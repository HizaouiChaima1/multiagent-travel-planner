"""Agent planificateur v1 (US12a) : vols aller-retour + hôtel.

Fonctionnement :
  1. les outils de recherche (tools.py) rassemblent les vols et hôtels disponibles ;
  2. le LLM choisit uniquement des IDENTIFIANTS du catalogue (sortie structurée Pydantic) ;
  3. le code vérifie les IDs, assemble l'itinéraire à partir des vraies données et calcule le
     coût : la réponse respecte donc toujours le schéma du contrat, même si le LLM se trompe
     (risque R3) ; après 3 tentatives sans choix valide (ou sans clé Groq), repli sur la
     combinaison la moins chère des données simulées : l'utilisateur obtient toujours un résultat.

Le nœud `planner_node` est le premier nœud du graphe LangGraph. L'orchestrateur complet
(agent budget, journalisation, US16) est à la charge de Ryned : il pourra ajouter ses nœuds
à `build_planner_graph()`. Les jours sont créés avec des activités vides jusqu'à US12b.
"""
import json
import logging
import time
from datetime import timedelta
from functools import partial
from typing import Any, TypedDict

from langchain_core.messages import HumanMessage, SystemMessage
from langgraph.graph import END, START, StateGraph

from app.agents.cost import compute_cost, over_budget_message, within_budget
from app.agents.errors import NoAvailabilityError
from app.agents.tools import search_flights, search_hotels
from app.schemas import Flight, Hotel, Itinerary, ItineraryDay, PlannerChoice

logger = logging.getLogger("travel.agents.planner")

HUB = "Tunis"  # ville de départ du MVP (voir les conventions du contrat)
MAX_ATTEMPTS = 3  # 1 appel + 2 nouvelles tentatives
RATE_LIMIT_PAUSE_SECONDS = 2.0  # pause (x numéro de tentative) quand Groq limite le débit
FLIGHTS_AND_HOTEL_SHARE = 0.7  # part du budget visée pour vols + hôtel (le reste : activités)

SYSTEM_PROMPT = """Tu es l'agent planificateur d'une application de voyages. \
Tu choisis un vol aller, un vol retour et un hôtel parmi les options fournies, \
et uniquement parmi celles-ci.

Règles :
- Recopie les identifiants EXACTEMENT comme dans les listes (FLT-xxxx, HOT-xxx-xx).
- Le vol retour doit partir après l'arrivée du vol aller.
- Le coût des vols = (prix aller + prix retour) x nombre de voyageurs ; \
le coût de l'hôtel = prix par nuit x nombre de nuits (une seule chambre).
- Vise un coût vols + hôtel d'au plus 70 % du budget total : le reste servira aux activités. \
Si ce n'est pas possible, prends les options les moins chères.
- À budget confortable, préfère un hôtel bien noté et des horaires de vol pratiques.
- Réponds uniquement avec les identifiants et une justification courte en français."""


class TravelState(TypedDict, total=False):
    trip: dict[str, Any]  # id, destination, departure_date, return_date, travelers, budget
    itinerary: Itinerary
    source: str  # "llm" (choix de l'IA) ou "fallback" (données simulées, choix le moins cher)


# ---------- 1. Recherche ----------

def collect_candidates(trip: dict) -> dict[str, list[dict]]:
    destination, dep, ret = trip["destination"], trip["departure_date"], trip["return_date"]
    candidates = {
        "outbound": search_flights.invoke(
            {"origin": HUB, "destination": destination, "day": dep.isoformat()}
        ),
        "return": search_flights.invoke(
            {"origin": destination, "destination": HUB, "day": ret.isoformat()}
        ),
        "hotels": search_hotels.invoke({"city": destination}),
    }
    if not candidates["outbound"] or not candidates["return"]:
        raise NoAvailabilityError(
            f"Aucun vol disponible entre Tunis et {destination} pour ces dates "
            "(vols simulés du 1er décembre 2026 au 31 janvier 2027)."
        )
    if not candidates["hotels"]:
        raise NoAvailabilityError(f"Aucun hôtel disponible à {destination}.")
    return candidates


def _compatible(outbound: dict, inbound: dict) -> bool:
    """Le vol retour part après l'arrivée du vol aller (cas d'un aller-retour le même jour)."""
    return inbound["departure_time"] > outbound["arrival_time"]


def cheapest_choice(candidates: dict[str, list[dict]]) -> PlannerChoice:
    pairs = [
        (o, r)
        for o in candidates["outbound"]
        for r in candidates["return"]
        if _compatible(o, r)
    ]
    if not pairs:
        raise NoAvailabilityError("Aucune combinaison de vols aller-retour compatible.")
    outbound, inbound = min(pairs, key=lambda p: p[0]["price"] + p[1]["price"])
    hotel = min(candidates["hotels"], key=lambda h: h["price_per_night"])
    return PlannerChoice(
        outbound_flight_id=outbound["id"],
        return_flight_id=inbound["id"],
        hotel_id=hotel["id"],
        rationale="Combinaison la moins chère.",
    )


# ---------- 2. Choix par le LLM ----------

def _build_prompt(trip: dict, nights: int, candidates: dict[str, list[dict]]) -> list:
    def flight_line(f: dict) -> dict:
        return {
            "id": f["id"],
            "compagnie": f["airline"],
            "depart": f["departure_time"],
            "arrivee": f["arrival_time"],
            "prix_par_voyageur_eur": f["price"],
        }

    def hotel_line(h: dict) -> dict:
        return {
            "id": h["id"],
            "nom": h["name"],
            "quartier": h["district"],
            "note_sur_5": h["rating"],
            "prix_par_nuit_eur": h["price_per_night"],
            "prix_total_sejour_eur": h["price_per_night"] * nights,
        }

    request = {
        "destination": trip["destination"],
        "date_depart": trip["departure_date"].isoformat(),
        "date_retour": trip["return_date"].isoformat(),
        "nombre_de_nuits": nights,
        "voyageurs": trip["travelers"],
        "budget_total_eur": trip["budget"],
        "budget_vols_et_hotel_vise_eur": round(trip["budget"] * FLIGHTS_AND_HOTEL_SHARE),
    }
    options = {
        "vols_aller": [flight_line(f) for f in candidates["outbound"]],
        "vols_retour": [flight_line(f) for f in candidates["return"]],
        "hotels": [hotel_line(h) for h in candidates["hotels"]],
    }
    content = (
        "Demande du voyageur :\n" + json.dumps(request, ensure_ascii=False, indent=1)
        + "\n\nOptions disponibles :\n" + json.dumps(options, ensure_ascii=False, indent=1)
    )
    return [SystemMessage(SYSTEM_PROMPT), HumanMessage(content)]


def _check_choice(choice: PlannerChoice, candidates: dict[str, list[dict]]) -> list[str]:
    """Renvoie la liste des problèmes du choix (vide si le choix est valide)."""
    outbound = next((f for f in candidates["outbound"] if f["id"] == choice.outbound_flight_id), None)
    inbound = next((f for f in candidates["return"] if f["id"] == choice.return_flight_id), None)
    hotel = next((h for h in candidates["hotels"] if h["id"] == choice.hotel_id), None)
    problems = []
    if outbound is None:
        problems.append(f"vol aller inconnu : {choice.outbound_flight_id}")
    if inbound is None:
        problems.append(f"vol retour inconnu : {choice.return_flight_id}")
    if hotel is None:
        problems.append(f"hôtel inconnu : {choice.hotel_id}")
    if outbound and inbound and not _compatible(outbound, inbound):
        problems.append("le vol retour part avant l'arrivée du vol aller")
    return problems


def ask_llm(llm, messages: list, candidates: dict[str, list[dict]]) -> PlannerChoice | None:
    """Interroge le LLM jusqu'à obtenir un choix valide (3 tentatives au plus).

    Renvoie None si le LLM est absent ou n'a rien produit de valide : l'appelant se rabat
    alors sur les données simulées (cheapest_choice).
    """
    if llm is None:  # PLANNER_MOCK=1 ou clé absente : pas d'appel au LLM
        return None
    last_problem = "réponse inutilisable"
    for attempt in range(1, MAX_ATTEMPTS + 1):
        try:
            raw = llm.invoke(messages)
            choice = raw if isinstance(raw, PlannerChoice) else PlannerChoice.model_validate(raw)
        except Exception as exc:  # JSON invalide, délai dépassé, erreur réseau...
            last_problem = f"{type(exc).__name__}"
            logger.warning("planner attempt %d/%d failed: %s", attempt, MAX_ATTEMPTS, exc)
            if "RateLimit" in type(exc).__name__ and attempt < MAX_ATTEMPTS:
                time.sleep(RATE_LIMIT_PAUSE_SECONDS * attempt)  # laisse le quota se libérer
            continue
        problems = _check_choice(choice, candidates)
        if not problems:
            return choice
        last_problem = "; ".join(problems)
        logger.warning("planner attempt %d/%d invalid: %s", attempt, MAX_ATTEMPTS, last_problem)
        messages = messages + [
            HumanMessage(
                "Ton choix est invalide (" + last_problem + "). "
                "Choisis uniquement des identifiants présents dans les listes."
            )
        ]
    logger.warning(
        "planner: no valid LLM choice after %d attempts (%s), falling back to mock data",
        MAX_ATTEMPTS, last_problem,
    )
    return None


# ---------- 3. Assemblage ----------

def build_itinerary(
    trip: dict, candidates: dict[str, list[dict]], choice: PlannerChoice
) -> Itinerary:
    dep, ret = trip["departure_date"], trip["return_date"]
    nights = (ret - dep).days
    outbound = Flight.model_validate(
        next(f for f in candidates["outbound"] if f["id"] == choice.outbound_flight_id)
    )
    inbound = Flight.model_validate(
        next(f for f in candidates["return"] if f["id"] == choice.return_flight_id)
    )
    hotel = Hotel.model_validate(next(h for h in candidates["hotels"] if h["id"] == choice.hotel_id))
    days = [
        ItineraryDay(day=i + 1, date=dep + timedelta(days=i), activities=[])
        for i in range(nights + 1)
    ]
    cost = compute_cost(outbound, inbound, hotel, nights, trip["travelers"], days)
    ok = within_budget(cost.total, trip["budget"])
    return Itinerary(
        id=0,  # fixé à l'enregistrement (routers/itineraries.py)
        trip_id=trip["id"],
        destination=trip["destination"],
        departure_date=dep,
        return_date=ret,
        travelers=trip["travelers"],
        budget=trip["budget"],
        nights=nights,
        outbound_flight=outbound,
        return_flight=inbound,
        hotel=hotel,
        days=days,
        cost=cost,
        budget_status="within_budget" if ok else "over_budget",
        budget_message=None if ok else over_budget_message(cost.total, trip["budget"]),
        created_at=trip["now"],
    )


# ---------- Nœud et graphe LangGraph ----------

def planner_node(state: TravelState, llm) -> TravelState:
    started = time.perf_counter()
    trip = state["trip"]
    nights = (trip["return_date"] - trip["departure_date"]).days
    candidates = collect_candidates(trip)
    choice = ask_llm(llm, _build_prompt(trip, nights, candidates), candidates)
    source = "llm" if choice is not None else "fallback"
    if choice is None:
        choice = cheapest_choice(candidates)
    itinerary = build_itinerary(trip, candidates, choice)
    if itinerary.budget_status == "over_budget":
        # Garde-fou v1 (en attendant l'agent budget US13) : si le choix du LLM dépasse le budget,
        # on retient la combinaison la moins chère ; si elle dépasse encore, over_budget est exact.
        itinerary = build_itinerary(trip, candidates, cheapest_choice(candidates))
    logger.info(
        "planner trip=%s source=%s duration=%.2fs flights=%s,%s hotel=%s total=%.0f status=%s",
        trip["id"], source, time.perf_counter() - started,
        itinerary.outbound_flight.id, itinerary.return_flight.id, itinerary.hotel.id,
        itinerary.cost.total, itinerary.budget_status,
    )
    return {"itinerary": itinerary, "source": source}


def build_planner_graph(llm):
    """Graphe v1 : un seul nœud. US16 (Ryned) y enchaînera l'agent budget."""
    graph = StateGraph(TravelState)
    graph.add_node("planner", partial(planner_node, llm=llm))
    graph.add_edge(START, "planner")
    graph.add_edge("planner", END)
    return graph.compile()

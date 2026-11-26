"""Agent budget (US07).

Règles (remplacements faits par le code, pas par le LLM) :
  1. coût total = vols + hôtel + activités (agents/cost.py) ;
  2. au-delà de 5 % de dépassement, l'hôtel est remplacé par le moins cher, puis les vols ;
  3. si cela ne suffit pas et que des activités sont payantes, l'agent redemande un programme
     d'activités gratuites : c'est la boucle de l'orchestrateur (une fois, deux passages
     du programme au plus) ;
  4. si le budget reste impossible, un message explique l'écart.
"""
from dataclasses import dataclass

from app.agents.activities import schedule_activities
from app.agents.cost import compute_cost, over_budget_message, within_budget
from app.agents.planner import cheapest_choice, collect_candidates
from app.schemas import Flight, Hotel, Itinerary


@dataclass
class BudgetDecision:
    itinerary: Itinerary
    next_mode: str | None  # mode d'activités à redemander, None quand la décision est finale
    message: str  # résumé pour le journal des agents


def recost(itinerary: Itinerary) -> Itinerary:
    cost = compute_cost(
        itinerary.outbound_flight,
        itinerary.return_flight,
        itinerary.hotel,
        itinerary.nights,
        itinerary.travelers,
        itinerary.days,
    )
    return itinerary.model_copy(update={"cost": cost})


def _swap_to_cheapest(itinerary: Itinerary, trip: dict, mode: str) -> tuple[Itinerary, list[str]]:
    """Remplace l'hôtel puis les vols par moins cher, et recale le programme sur les vols."""
    candidates = collect_candidates(trip)
    cheapest = cheapest_choice(candidates)
    changes = []
    hotel = Hotel.model_validate(next(h for h in candidates["hotels"] if h["id"] == cheapest.hotel_id))
    if hotel.price_per_night < itinerary.hotel.price_per_night:
        itinerary = itinerary.model_copy(update={"hotel": hotel})
        changes.append(f"hôtel remplacé par {hotel.name}")
    outbound = Flight.model_validate(
        next(f for f in candidates["outbound"] if f["id"] == cheapest.outbound_flight_id)
    )
    inbound = Flight.model_validate(
        next(f for f in candidates["return"] if f["id"] == cheapest.return_flight_id)
    )
    current = itinerary.outbound_flight.price + itinerary.return_flight.price
    if outbound.price + inbound.price < current:
        itinerary = itinerary.model_copy(update={"outbound_flight": outbound, "return_flight": inbound})
        changes.append("vols remplacés par les moins chers")
    if changes:
        itinerary = recost(itinerary)
        itinerary = recost(itinerary.model_copy(update={"days": schedule_activities(itinerary, mode)}))
    return itinerary, changes


def review_budget(itinerary: Itinerary, trip: dict, mode: str, adjusted: bool) -> BudgetDecision:
    itinerary = recost(itinerary)
    total, budget = itinerary.cost.total, itinerary.budget

    changes: list[str] = []
    if not within_budget(total, budget):
        itinerary, changes = _swap_to_cheapest(itinerary, trip, mode)
        total = itinerary.cost.total
    adjusted = adjusted or bool(changes)
    done_changes = f" ({', '.join(changes)})" if changes else ""

    if within_budget(total, budget):
        status = "adjusted" if adjusted else "within_budget"
        final = itinerary.model_copy(update={"budget_status": status, "budget_message": None})
        return BudgetDecision(final, None, f"{total:g} € pour {budget:g} € : dans le budget{done_changes}.")

    if mode != "free" and itinerary.cost.activities > 0:
        return BudgetDecision(
            itinerary,
            "free",
            f"{total:g} € pour {budget:g} € : trop cher{done_changes}, programme moins cher demandé.",
        )

    final = itinerary.model_copy(
        update={"budget_status": "over_budget", "budget_message": over_budget_message(total, budget)}
    )
    return BudgetDecision(final, None, f"{total:g} € pour {budget:g} € : budget impossible à tenir.")

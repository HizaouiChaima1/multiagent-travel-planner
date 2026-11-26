"""Évaluation de l'agent planificateur sur 5 demandes de test (US12a, critère « < 30 s » inclus).

Usage (clé Groq requise) :
    cd backend && GROQ_API_KEY=... python -m evals.planner_eval

Pour chaque demande : itinéraire conforme au schéma, vols dans la bonne direction et aux bonnes
dates, hôtel dans la ville, nuits couvertes, coût cohérent, temps de réponse < 30 s.
Sortie : un tableau et un code de retour non nul si une demande échoue.
"""
import sys
import time
from datetime import date, datetime

from app.agents.llm import get_planner_llm
from app.agents.planner import build_planner_graph
from app.schemas import Itinerary

PAUSE_BETWEEN_REQUESTS = 5  # secondes

REQUESTS = [
    # (nom, destination, départ, retour, voyageurs, budget)
    ("Rome standard", "Rome", date(2026, 12, 10), date(2026, 12, 14), 2, 1500),
    ("Paris budget trop bas", "Paris", date(2026, 12, 20), date(2026, 12, 22), 1, 200),
    ("Istanbul long séjour", "Istanbul", date(2026, 12, 15), date(2026, 12, 22), 2, 3000),
    ("Lisbonne même jour", "Lisbonne", date(2026, 12, 18), date(2026, 12, 18), 1, 600),
    ("Marrakech famille", "Marrakech", date(2027, 1, 5), date(2027, 1, 10), 4, 2500),
]


def check(it: Itinerary, trip: dict, elapsed: float) -> list[str]:
    errors = []
    if (it.outbound_flight.origin, it.outbound_flight.destination) != ("Tunis", trip["destination"]):
        errors.append("vol aller : mauvaise direction")
    if (it.return_flight.origin, it.return_flight.destination) != (trip["destination"], "Tunis"):
        errors.append("vol retour : mauvaise direction")
    if it.outbound_flight.departure_time.date() != trip["departure_date"]:
        errors.append("vol aller : mauvaise date")
    if it.return_flight.departure_time.date() != trip["return_date"]:
        errors.append("vol retour : mauvaise date")
    if it.return_flight.departure_time <= it.outbound_flight.arrival_time:
        errors.append("vol retour avant l'arrivée du vol aller")
    if it.hotel.city != trip["destination"]:
        errors.append("hôtel dans une autre ville")
    if len(it.days) != it.nights + 1:
        errors.append("jours != nuits + 1")
    expected = (it.outbound_flight.price + it.return_flight.price) * trip["travelers"]
    expected_total = expected + it.hotel.price_per_night * it.nights
    if abs(it.cost.total - expected_total) > 0.01:
        errors.append("coût total incohérent")
    if elapsed >= 30:
        errors.append(f"trop lent ({elapsed:.1f} s)")
    return errors


def main() -> int:
    graph = build_planner_graph(get_planner_llm())
    failures = 0
    print(f"{'Demande':26} {'Statut':14} {'Total €':>8} {'Temps':>7}  Résultat")
    for i, (name, dest, dep, ret, travelers, budget) in enumerate(REQUESTS, start=1):
        if i > 1:
            time.sleep(PAUSE_BETWEEN_REQUESTS)  # évite la limite de débit de l'API Groq
        trip = {"id": i, "destination": dest, "departure_date": dep, "return_date": ret,
                "travelers": travelers, "budget": float(budget), "now": datetime.utcnow()}
        started = time.perf_counter()
        try:
            it = graph.invoke({"trip": trip})["itinerary"]
            elapsed = time.perf_counter() - started
            errors = check(it, trip, elapsed)
            print(f"{name:26} {it.budget_status:14} {it.cost.total:8.0f} {elapsed:6.1f}s  "
                  + ("OK" if not errors else "ÉCHEC : " + "; ".join(errors)))
        except Exception as exc:
            errors = [f"{type(exc).__name__}: {exc}"]
            print(f"{name:26} {'-':14} {'-':>8} {time.perf_counter() - started:6.1f}s  ÉCHEC : {errors[0]}")
        failures += bool(errors)
    print(f"\n{len(REQUESTS) - failures}/{len(REQUESTS)} demandes valides")
    return 1 if failures else 0


if __name__ == "__main__":
    sys.exit(main())

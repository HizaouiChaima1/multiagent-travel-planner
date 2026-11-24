"""Calcul du coût d'un itinéraire, selon les conventions du contrat d'API (openapi.yaml).

    flights    = (prix vol aller + prix vol retour) x voyageurs
    hotel      = price_per_night x nights (une seule chambre)
    activities = somme des prix des activités x voyageurs
    total      = flights + hotel + activities

Écrit pour le planificateur (US12a). L'agent budget (US13, Ranim) peut le réutiliser.
"""
from app.schemas import CostBreakdown, Flight, Hotel, ItineraryDay

BUDGET_TOLERANCE = 0.05  # un dépassement de 5 % au plus est toléré


def compute_cost(
    outbound: Flight,
    inbound: Flight,
    hotel: Hotel,
    nights: int,
    travelers: int,
    days: list[ItineraryDay] | None = None,
) -> CostBreakdown:
    activities_price = sum(
        slot.activity.price for day in (days or []) for slot in day.activities
    )
    flights = (outbound.price + inbound.price) * travelers
    hotel_cost = hotel.price_per_night * nights
    activities = activities_price * travelers
    return CostBreakdown(
        flights=flights,
        hotel=hotel_cost,
        activities=activities,
        total=flights + hotel_cost + activities,
        currency="EUR",
    )


def within_budget(total: float, budget: float) -> bool:
    return total <= budget * (1 + BUDGET_TOLERANCE)


def over_budget_message(total: float, budget: float) -> str:
    gap = total - budget
    return (
        f"Le budget de {budget:g} € est insuffisant pour ce voyage. "
        f"Le coût minimal trouvé est de {total:g} €, soit {gap:g} € de plus que le budget."
    )

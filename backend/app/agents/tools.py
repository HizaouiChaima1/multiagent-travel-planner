"""Outils LangChain de recherche de vols, d'hôtels (US12a) et d'activités (US06).

Ils lisent directement les jeux de données simulés de Ranim (app.mock_data), sans appel HTTP,
et renvoient des dictionnaires JSON (dates en ISO 8601) identiques au contrat d'API.
"""
from datetime import date

from langchain_core.tools import tool

from app.mock_data.activities import get_activities
from app.mock_data.flights import get_flights
from app.mock_data.hotels import get_hotels


def _flight_json(f: dict) -> dict:
    return {
        **f,
        "departure_time": f["departure_time"].isoformat(),
        "arrival_time": f["arrival_time"].isoformat(),
    }


@tool
def search_flights(origin: str, destination: str, day: str) -> list[dict]:
    """Cherche les vols simulés d'une ville à une autre un jour donné.

    origin / destination : noms de villes (insensibles à la casse).
    day : jour de départ au format YYYY-MM-DD.
    Le prix est par voyageur, en euros.
    """
    flights = get_flights(
        origin=origin, destination=destination, departure_date=date.fromisoformat(day)
    )
    return [_flight_json(f) for f in flights]


@tool
def search_hotels(city: str, max_price_per_night: float | None = None) -> list[dict]:
    """Cherche les hôtels simulés d'une ville, avec un prix maximum par nuit optionnel.

    Le prix est celui d'une chambre par nuit, en euros ; la note est sur 5.
    """
    return get_hotels(city=city, max_price=max_price_per_night)


@tool
def search_activities(city: str, max_price: float | None = None) -> list[dict]:
    """Cherche les activités simulées d'une ville, avec un prix maximum par personne optionnel.

    Chaque activité a une catégorie, un prix (EUR par personne), une durée en heures
    et un cadre intérieur ou extérieur.
    """
    return get_activities(city=city, max_price=max_price)

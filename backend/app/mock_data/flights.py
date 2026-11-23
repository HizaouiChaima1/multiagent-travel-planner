"""US05 - Vols simulés entre Tunis et les 11 autres villes (aller et retour).

Génération reproductible : graine fixe et dates fixes, donc mêmes données à chaque démarrage.
Schéma d'un vol :
    id, airline, origin, destination, departure_time, arrival_time (heures locales),
    price (EUR par voyageur)
"""
import random
from datetime import date, datetime, time, timedelta
from typing import Optional

from app.mock_data.activities import CITIES

SEED = 42

# Ville de départ du MVP : tous les vols partent de Tunis ou y arrivent.
HUB = "Tunis"
HUB_UTC_OFFSET = 1

# Fenêtre de dates des vols : du 1er décembre 2026 au 31 janvier 2027.
START_DATE = date(2026, 12, 1)
DAYS = 62

# Deux départs par jour et par trajet (matin, après-midi) : l'agent budget peut ainsi
# remplacer un vol par un autre, moins cher, le même jour.
SLOTS = [(6, 10), (13, 19)]  # plages d'heures de départ (min, max)
MINUTES = [0, 15, 30, 45]

AIRLINES = ["Tunisair", "Nouvelair", "Air France", "Transavia", "Ryanair"]

# destination : (durée du vol en heures, décalage UTC en hiver, prix min, prix max en EUR)
DESTINATIONS = {
    "Paris": (2.5, 1, 90, 170),
    "Rome": (1.5, 1, 70, 130),
    "Barcelone": (2.0, 1, 75, 150),
    "Londres": (3.5, 0, 110, 200),
    "Istanbul": (3.0, 3, 100, 190),
    "Marrakech": (3.0, 1, 90, 170),
    "Lisbonne": (3.5, 0, 100, 180),
    "Madrid": (2.5, 1, 85, 160),
    "Berlin": (3.0, 1, 105, 190),
    "Amsterdam": (3.0, 1, 105, 190),
    "Athènes": (2.0, 2, 90, 170),
}

assert set(DESTINATIONS) == set(CITIES) - {HUB}


def _generate() -> list[dict]:
    rng = random.Random(SEED)
    flights: list[dict] = []
    for day_index in range(DAYS):
        day = START_DATE + timedelta(days=day_index)
        for city, (duration, utc_offset, pmin, pmax) in DESTINATIONS.items():
            for origin, destination, shift in (
                (HUB, city, utc_offset - HUB_UTC_OFFSET),
                (city, HUB, HUB_UTC_OFFSET - utc_offset),
            ):
                for hour_min, hour_max in SLOTS:
                    departure = datetime.combine(
                        day, time(rng.randint(hour_min, hour_max), rng.choice(MINUTES))
                    )
                    flights.append({
                        "id": f"FLT-{len(flights) + 1:04d}",
                        "airline": rng.choice(AIRLINES),
                        "origin": origin,
                        "destination": destination,
                        "departure_time": departure,
                        # Heure locale d'arrivée : durée du vol + écart de fuseau horaire.
                        "arrival_time": departure + timedelta(hours=duration + shift),
                        "price": float(rng.randint(pmin, pmax)),
                    })
    return flights


FLIGHTS: list[dict] = _generate()


def _norm(value: str) -> str:
    return value.strip().lower()


def get_flights(
    origin: Optional[str] = None,
    destination: Optional[str] = None,
    departure_date: Optional[date] = None,
    max_price: Optional[float] = None,
) -> list[dict]:
    result = FLIGHTS
    if origin:
        result = [f for f in result if _norm(f["origin"]) == _norm(origin)]
    if destination:
        result = [f for f in result if _norm(f["destination"]) == _norm(destination)]
    if departure_date is not None:
        result = [f for f in result if f["departure_time"].date() == departure_date]
    if max_price is not None:
        result = [f for f in result if f["price"] <= max_price]
    return result
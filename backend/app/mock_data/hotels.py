"""US06 - Hôtels simulés (12 villes x 5 à 8 hôtels).

Génération reproductible : graine fixe, donc mêmes données à chaque démarrage.
Schéma d'un hôtel :
    id, city, name, district, price_per_night (EUR, une chambre), rating (sur 5)
"""
import random
from typing import Optional

from app.mock_data.activities import CITIES

SEED = 42

MIN_HOTELS = 5
MAX_HOTELS = 8

# Note comprise entre ces bornes (un chiffre après la virgule).
MIN_RATING = 3.2
MAX_RATING = 4.9

TYPES = ["Hôtel", "Maison", "Résidence", "Grand Hôtel", "Boutique Hôtel"]
NAMES = [
    "Aurora", "Fontana", "Belvédère", "Horizon", "Jardin", "Lumière",
    "Palmier", "Étoile", "Panorama", "Azur", "Olivier", "Cèdre",
]

# ville : (prix moyen d'une chambre par nuit pour une note de 4,0 ; quartiers)
CITY_DATA = {
    "Paris": (130, ["Le Marais", "Montmartre", "Quartier Latin", "Champs-Élysées", "Bastille"]),
    "Rome": (90, ["Trastevere", "Centro Storico", "Termini", "Monti", "Prati"]),
    "Barcelone": (100, ["Quartier Gothique", "Eixample", "Gràcia", "El Born", "Barceloneta"]),
    "Londres": (140, ["Soho", "Kensington", "Camden", "Shoreditch", "Westminster"]),
    "Istanbul": (70, ["Sultanahmet", "Beyoğlu", "Karaköy", "Beşiktaş", "Kadıköy"]),
    "Tunis": (55, ["Médina", "La Marsa", "Carthage", "Centre-ville", "Sidi Bou Saïd"]),
    "Marrakech": (65, ["Médina", "Guéliz", "Hivernage", "Palmeraie", "Kasbah"]),
    "Lisbonne": (90, ["Alfama", "Baixa", "Chiado", "Bairro Alto", "Belém"]),
    "Madrid": (95, ["Sol", "Salamanca", "Malasaña", "Chueca", "Retiro"]),
    "Berlin": (90, ["Mitte", "Kreuzberg", "Prenzlauer Berg", "Charlottenburg", "Friedrichshain"]),
    "Amsterdam": (130, ["Jordaan", "De Pijp", "Centrum", "Oud-Zuid", "Oost"]),
    "Athènes": (75, ["Plaka", "Monastiraki", "Kolonaki", "Psyri", "Syntagma"]),
}

assert set(CITY_DATA) == set(CITIES)


def _generate() -> list[dict]:
    rng = random.Random(SEED)
    hotels: list[dict] = []
    for city in CITIES:
        base_price, districts = CITY_DATA[city]
        count = rng.randint(MIN_HOTELS, MAX_HOTELS)
        for idx, name in enumerate(rng.sample(NAMES, count), start=1):
            rating = round(rng.uniform(MIN_RATING, MAX_RATING), 1)
            # Plus l'hôtel est bien noté, plus il est cher (±10 % de variation).
            price = base_price * (1 + 0.5 * (rating - 4.0)) * rng.uniform(0.9, 1.1)
            hotels.append({
                "id": f"HOT-{city[:3].upper()}-{idx:02d}",
                "city": city,
                "name": f"{rng.choice(TYPES)} {name}",
                "district": rng.choice(districts),
                "price_per_night": float(round(price)),
                "rating": rating,
            })
    return hotels


HOTELS: list[dict] = _generate()


def _norm(value: str) -> str:
    return value.strip().lower()


def get_hotels(city: Optional[str] = None, max_price: Optional[float] = None) -> list[dict]:
    result = HOTELS
    if city:
        result = [h for h in result if _norm(h["city"]) == _norm(city)]
    if max_price is not None:
        result = [h for h in result if h["price_per_night"] <= max_price]
    return result
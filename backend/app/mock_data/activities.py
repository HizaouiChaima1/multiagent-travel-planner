"""US07 - Catalogue d'activités simulées (12 villes x 15 activités).

Génération reproductible : graine fixe, donc mêmes données à chaque démarrage.
Schéma d'une activité :
    id, city, name, category, price (EUR), duration_hours, setting ("indoor"/"outdoor")
"""
import random
from typing import Optional

SEED = 42

CITIES = [
    "Paris", "Rome", "Barcelone", "Londres", "Istanbul", "Tunis",
    "Marrakech", "Lisbonne", "Madrid", "Berlin", "Amsterdam", "Athènes",
]

# (modèle de nom, catégorie, intérieur/extérieur, prix min, prix max, durée min, durée max)
TEMPLATES = [
    ("Visite du musée principal de {city}", "culture", "indoor", 10, 25, 2.0, 3.0),
    ("Musée d'histoire de {city}", "culture", "indoor", 8, 20, 1.5, 2.5),
    ("Galerie d'art contemporain de {city}", "culture", "indoor", 8, 18, 1.5, 2.0),
    ("Visite guidée du centre historique de {city}", "culture", "outdoor", 0, 20, 2.0, 3.0),
    ("Balade dans le vieux quartier de {city}", "culture", "outdoor", 0, 0, 1.5, 2.5),
    ("Randonnée panoramique autour de {city}", "nature", "outdoor", 0, 15, 3.0, 5.0),
    ("Parc et jardins de {city}", "nature", "outdoor", 0, 8, 1.5, 2.5),
    ("Croisière ou balade au fil de l'eau à {city}", "nature", "outdoor", 15, 35, 1.5, 2.5),
    ("Dîner gastronomique local à {city}", "gastronomie", "indoor", 30, 70, 2.0, 3.0),
    ("Dégustation au marché de {city}", "gastronomie", "indoor", 12, 30, 1.0, 2.0),
    ("Cours de cuisine traditionnelle à {city}", "gastronomie", "indoor", 40, 80, 3.0, 4.0),
    ("Quartier commerçant et shopping à {city}", "shopping", "outdoor", 0, 0, 2.0, 3.0),
    ("Spa et hammam à {city}", "detente", "indoor", 25, 60, 2.0, 3.0),
    ("Spectacle ou concert à {city}", "divertissement", "indoor", 20, 60, 2.0, 3.0),
    ("Vélo électrique dans {city}", "aventure", "outdoor", 20, 40, 2.0, 3.0),
]

assert len(TEMPLATES) == 15


def _generate() -> list[dict]:
    rng = random.Random(SEED)
    activities: list[dict] = []
    for city in CITIES:
        for idx, (name, category, setting, pmin, pmax, dmin, dmax) in enumerate(TEMPLATES, start=1):
            activities.append({
                "id": f"ACT-{city[:3].upper()}-{idx:02d}",
                "city": city,
                "name": name.format(city=city),
                "category": category,
                "price": float(rng.randint(pmin, pmax)),
                "duration_hours": round(rng.uniform(dmin, dmax) * 2) / 2,
                "setting": setting,
            })
    return activities


ACTIVITIES: list[dict] = _generate()


def _norm(value: str) -> str:
    return value.strip().lower()


def get_activities(
    city: Optional[str] = None,
    category: Optional[str] = None,
    setting: Optional[str] = None,
    max_price: Optional[float] = None,
) -> list[dict]:
    result = ACTIVITIES
    if city:
        result = [a for a in result if _norm(a["city"]) == _norm(city)]
    if category:
        result = [a for a in result if _norm(a["category"]) == _norm(category)]
    if setting:
        result = [a for a in result if a["setting"] == setting]
    if max_price is not None:
        result = [a for a in result if a["price"] <= max_price]
    return result

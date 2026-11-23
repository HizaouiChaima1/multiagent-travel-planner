# Exemples JSON du contrat d'API (TS02)

Ces fichiers accompagnent `openapi.yaml` (à la racine du dépôt). Chaque exemple est
valide par rapport au schéma du contrat. Les exemples `trip*`, `mock-activities*` et
`mock-cities*` viennent de l'API déjà implémentée. Les autres (vols, hôtels, auth,
itinéraire) sont des propositions que chaque module peut utiliser comme données de test.

| Fichier | Route | Module concerné |
|---|---|---|
| `trip.request.json` / `trip.response.json` | `POST /trips` | M5 Interface (saisie), M4 Orchestration |
| `trip-invalid.request.json` / `trip-invalid.response.json` | `POST /trips` (budget nul, erreur 422) | M5 Interface (affichage des erreurs) |
| `mock-cities.response.json` | `GET /mock/cities` | M1 Données, M5 Interface |
| `mock-flights.response.json` | `GET /mock/flights?origin=Tunis&destination=Rome&date=2026-12-10` | M1 Données, M2 Planificateur |
| `mock-hotels.response.json` | `GET /mock/hotels?city=Rome` | M1 Données, M2 Planificateur |
| `mock-activities.response.json` | `GET /mock/activities?city=Rome&setting=outdoor&max_price=10` | M1 Données, M2 Planificateur |
| `itinerary-generate.request.json` | `POST /itineraries/generate` | M4 Orchestration, M5 Interface |
| `itinerary.response.json` | `POST /itineraries/generate`, `GET /itineraries/{id}` (dans le budget) | M2 Planificateur, M3 Budget, M5 Interface |
| `trip-over-budget.request.json` / `itinerary-over-budget.response.json` | `POST /itineraries/generate` (budget impossible, statut `over_budget`) | M3 Budget, M5 Interface |
| `auth-register.request.json` / `auth-register.response.json` | `POST /auth/register` | M5 Interface, M4 Backend |
| `auth-login.request.json` / `auth-login.response.json` | `POST /auth/login` | M5 Interface, M4 Backend |

## Rappels utiles

- Les coûts de `itinerary.response.json` suivent les règles du contrat :
  vols = (95 + 105) × 2 voyageurs = 400, hôtel = 85 × 4 nuits = 340,
  activités = 219 × 2 voyageurs = 438, total = 1 178 € pour un budget de 1 500 €.
- Les activités de ces exemples sont celles du catalogue réel (`ACT-ROM-xx`, `ACT-PAR-xx`).
- Les vols et hôtels (`FLT-xxxx`, `HOT-xxx-xx`) sont fictifs : le générateur de Ranim
  produira ses propres valeurs, mais devra respecter les champs et les types.
- Le jeton de `auth-login.response.json` est factice.

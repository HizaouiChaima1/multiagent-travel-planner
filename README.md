# MultiAgent Travel Planner

Planificateur de voyages dans lequel plusieurs agents d'intelligence artificielle collaborent pour construire, contrôler et ajuster un itinéraire. Projet d'équipe réalisé en méthode Scrum (ISAMM, Méthodes Agiles, 3 INLOG).

## Principe

Le voyageur saisit sa destination, ses dates, le nombre de voyageurs et son budget. Les agents produisent ensuite un itinéraire complet, que le voyageur peut négocier en langage naturel. Toutes les données (vols, hôtels, activités, météo) sont **simulées** : il n'y a ni paiement réel ni connexion à de vraies API de réservation.

## Agents

| Agent | Rôle |
|---|---|
| Planificateur | Propose vols, hôtel et programme jour par jour |
| Budget | Vérifie que le coût total respecte le budget et remplace les éléments trop chers |
| Météo | Signale les activités extérieures prévues un jour de pluie et propose une alternative |
| Réservation (simulée) | Confirme le voyage avec un numéro de réservation fictif |
| Orchestrateur (LangGraph) | Enchaîne les agents et conserve l'état entre les étapes |

## Fonctionnalités

- Inscription, connexion et préférences de voyage
- Demande de voyage (destination, dates, voyageurs, budget)
- Génération d'un itinéraire jour par jour dans le budget
- Négociation et modification du plan en langage naturel
- Réservation simulée, export PDF et calendrier (.ics), historique des voyages
- Administration : données simulées, journaux des agents, utilisateurs

## Stack technique

- **Backend** : FastAPI, LangGraph, LangChain, LLM Mistral, PostgreSQL
- **Frontend** : React (Vite)
- **Infrastructure** : Docker et Docker Compose, CI GitHub Actions

## Structure du dépôt

```
.
├── backend/     API FastAPI, agents, données simulées
├── frontend/    Interface React
└── README.md
```

## Lancer le projet en local

### Avec Docker Compose (recommandé)

Prérequis : Docker Desktop (ou Docker Engine avec le plugin Compose), Git.

```bash
docker compose up --build
```

Backend sur http://localhost:8000 (documentation sur `/docs`), frontend sur http://localhost:5173, PostgreSQL sur le port 5432. Le code du backend et du frontend est monté en volume : les modifications sont prises en compte sans reconstruire les images. `docker compose down` arrête les services (ajouter `-v` pour effacer aussi la base de données).

Pour les agents (US12a), ajoute aussi dans `.env` la clé d'équipe `MISTRAL_API_KEY` (et, si besoin, `MISTRAL_MODEL`, par défaut `mistral-small-latest`). Évaluation du planificateur : `cd backend && python -m evals.planner_eval`.

Les identifiants PostgreSQL ont des valeurs par défaut (`travel` / `travel` / `travel`). Pour les changer, crée à la racine un fichier `.env` (non versionné) avec `POSTGRES_USER`, `POSTGRES_PASSWORD` et `POSTGRES_DB`.

### Sans Docker

Prérequis : Python 3.11 ou plus récent, Node.js 20 ou plus récent, Git.

#### Backend (http://localhost:8000)

```bash
cd backend
python -m venv .venv
source .venv/bin/activate        # Windows : .venv\Scripts\activate
pip install -r requirements.txt
uvicorn app.main:app --reload --port 8000
```

La documentation interactive de l'API est sur http://localhost:8000/docs.
Sans variable `DATABASE_URL`, le backend utilise une base SQLite locale (`dev.db`).
Avec Docker Compose, cette variable pointe vers PostgreSQL.

#### Frontend (http://localhost:5173)

Dans un second terminal :

```bash
cd frontend
npm install
npm run dev
```

### Tests

```bash
cd backend && python -m pytest -q
cd frontend && npm test
```

## Équipe

| Membre | Rôle |
|---|---|
| Inès Cherif | Product Owner |
| Khairi Hammami | Scrum Master |
| Chaima | Développeuse (M5 Interface) |
| Ryned | Développeur (M4 Orchestration, backend) |
| Mahdi | Développeur (M2 Agent planificateur, M6 Export) |
| Ranim | Développeuse (M1 Données, M3 Agent budget) |

Encadrante : Mme Wala Rebhi.

## Organisation du travail

- Gestion de projet dans Jira (projet Scrum, clé `MATP`), sprints de 2 semaines.
- Une branche par ticket, nommée avec la clé Jira (exemple : `MATP-12-formulaire-demande`).
- Messages de commit préfixés par la clé Jira (exemple : `MATP-12 Ajoute le formulaire de demande`).
- Aucun commit direct sur `main` : tout passe par une pull request relue par un autre membre.

## Definition of Done

- Le code est sur une branche liée au ticket Jira et a été relu par un autre membre.
- Tous les critères d'acceptation sont vérifiés et les tests passent dans la CI.
- L'endpoint respecte le contrat d'API et figure dans la documentation OpenAPI.
- La story est démontrée à la Sprint Review puis déplacée dans Done.
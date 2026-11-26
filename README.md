# MultiAgent Travel Planner

Application web où trois agents d'intelligence artificielle préparent un voyage au départ de Tunis : vols aller-retour, hôtel et programme jour par jour, dans le budget du voyageur. Projet Scrum ISAMM (Méthodes Agiles, 3 INLOG). Les vols, hôtels et activités sont **simulés** (12 villes, décembre 2026 à janvier 2027).

## Ce que fait l'application

1. Page d'accueil en récit au scroll autour d'une Terre en 3D : le vol Tunis → Rome se dessine, le programme s'ouvre sur Rome, l'anneau du budget se remplit. À la fin, on fait tourner le globe et on choisit une ville pour voir les prix depuis Tunis.
2. Inscription et connexion (JWT).
3. Demande de voyage : destination, dates, voyageurs, budget.
4. Les agents travaillent, enchaînés par un orchestrateur LangGraph :
   - **planificateur** : vols et hôtel (LLM Mistral) ;
   - **programme** : 2 à 4 activités par jour, sans chevauchement ;
   - **budget** : vérifie le coût total, remplace ce qui est trop cher ou explique l'écart.
5. Page itinéraire : vols, hôtel, programme jour par jour, coût comparé au budget, journal des agents.
6. « Mes voyages » : historique de l'utilisateur connecté.

**Stack** : FastAPI, LangGraph, Mistral, PostgreSQL · React (Vite), three.js, GSAP + Lenis · Docker Compose, CI GitHub Actions.

## Lancer le projet

Prérequis : Docker Desktop.

```bash
cp .env.example .env        # Windows PowerShell : copy .env.example .env
docker compose up --build
```

- Application : http://localhost:5173
- API et documentation : http://localhost:8000/docs

**Sans clé Mistral**, mettre `PLANNER_MOCK=1` dans `.env` : les agents choisissent alors sans appeler le LLM (idéal pour une démo). Avec une clé, renseigner `MISTRAL_API_KEY`.

**Important après un `git pull`** : si de nouvelles dépendances frontend ont été ajoutées (par exemple `gsap` et `lenis` pour la page d'accueil), relancer avec :

```bash
docker compose up --build --renew-anon-volumes
```

Sans cette option, le conteneur garde les anciens `node_modules` et la page ne se charge pas.

Scénario de démo : Rome, du 12 au 16 décembre 2026, 2 voyageurs, 1 500 € (dans le budget), puis 300 € (budget impossible, message de l'agent budget).

## Tests

```bash
cd backend && python -m pytest -q     # ou : docker compose exec backend python -m pytest -q
cd frontend && npm test
```

## Structure

```
backend/    API FastAPI : auth, voyages, agents (app/agents), données simulées
frontend/   React : pages, globe (src/landing), itinéraire (src/itinerary)
contracts/  exemples JSON du contrat d'API
openapi.yaml
```

## Équipe

Inès Cherif (Product Owner) · Khairi Hammami (Scrum Master) · Chaima, Ryned, Mahdi, Ranim (développeurs). Encadrante : Mme Wala Rebhi.

Travail en sprints de 2 semaines suivis dans Jira. Une branche et une pull request relue par ticket, aucun commit direct sur `main`.

"""Fabrique du LLM (Mistral) utilisé par le planificateur.

Le modèle est configuré par variables d'environnement (voir docker-compose.yml) :
MISTRAL_API_KEY (clé d'équipe) et MISTRAL_MODEL (modèle léger en développement, risque R4).
"""
import os

from app.agents.errors import PlannerError
from app.schemas import PlannerChoice

# Chaque appel est borné pour tenir dans les 30 s de l'endpoint, même avec 3 tentatives.
LLM_TIMEOUT_SECONDS = 8


def get_planner_llm():
    """Renvoie un runnable dont .invoke(messages) retourne un PlannerChoice.

    Avec PLANNER_MOCK=1, renvoie None : le planificateur prend alors la combinaison la moins
    chère, sans appeler Mistral (démonstration et tests manuels uniquement).
    """
    if os.getenv("PLANNER_MOCK") == "1":
        return None
    api_key = os.getenv("MISTRAL_API_KEY")
    if not api_key:
        raise PlannerError("Le service d'intelligence artificielle n'est pas configuré.")
    from langchain_mistralai import ChatMistralAI

    model = ChatMistralAI(
        model=os.getenv("MISTRAL_MODEL", "mistral-small-latest"),
        mistral_api_key=api_key,
        temperature=0.1,  # réponses stables (risque R3)
        timeout=LLM_TIMEOUT_SECONDS,
        max_retries=0,  # les nouvelles tentatives sont gérées par le planificateur
    )
    return model.with_structured_output(PlannerChoice)

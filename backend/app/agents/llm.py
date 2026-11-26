"""Fabrique du LLM (Groq, offre gratuite) utilisé par le planificateur.

Le modèle est configuré par variables d'environnement (voir docker-compose.yml) :
GROQ_API_KEY (clé d'équipe, gratuite) et GROQ_MODEL.
Sans clé (ou avec PLANNER_MOCK=1), le planificateur se rabat sur les données simulées.
"""
import logging
import os

from app.schemas import PlannerChoice

logger = logging.getLogger("travel.agents.llm")

# Chaque appel est borné pour tenir dans les 30 s de l'endpoint, même avec 3 tentatives.
LLM_TIMEOUT_SECONDS = 8
DEFAULT_GROQ_MODEL = "openai/gpt-oss-120b"


def get_planner_llm():
    """Renvoie un runnable dont .invoke(messages) retourne un PlannerChoice, ou None.

    None = mode secours : le planificateur prend la combinaison la moins chère des données
    simulées, sans appeler le LLM (PLANNER_MOCK=1 ou clé Groq absente).
    """
    if os.getenv("PLANNER_MOCK") == "1":
        return None
    api_key = os.getenv("GROQ_API_KEY")
    if not api_key:
        logger.warning("GROQ_API_KEY absente : repli sur les données simulées")
        return None
    from langchain_groq import ChatGroq

    model = ChatGroq(
        model=os.getenv("GROQ_MODEL", DEFAULT_GROQ_MODEL),
        api_key=api_key,
        temperature=0.1,  # réponses stables (risque R3)
        timeout=LLM_TIMEOUT_SECONDS,
        max_retries=0,  # les nouvelles tentatives sont gérées par le planificateur
    )
    return model.with_structured_output(PlannerChoice)

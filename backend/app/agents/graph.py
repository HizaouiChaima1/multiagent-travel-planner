"""Orchestrateur LangGraph (US08) : planificateur -> programme -> budget.

    START -> planner -> activities -> budget -> END
                            ^           |
                            +-----------+  (programme gratuit si trop cher, une fois au plus)

L'état partagé garde la demande, l'itinéraire, le mode d'activités et le journal des étapes,
renvoyé au frontend pour montrer ce que chaque agent a fait.
"""
import logging
import operator
import time
from functools import partial
from typing import Annotated, Any, TypedDict

from langgraph.graph import END, START, StateGraph

from app.agents.activities import schedule_activities
from app.agents.budget import recost, review_budget
from app.agents.planner import planner_node
from app.schemas import AgentStep, Itinerary

logger = logging.getLogger("travel.agents.graph")

MODE_LABEL = {"normal": "", "free": " (activités gratuites)"}


class TripState(TypedDict, total=False):
    trip: dict[str, Any]
    itinerary: Itinerary
    mode: str  # "normal" ou "free" (voir agents/activities.py)
    adjusted: bool  # l'agent budget a déjà modifié l'itinéraire
    done: bool
    steps: Annotated[list[AgentStep], operator.add]


def _step(agent: str, message: str, started: float) -> list[AgentStep]:
    duration_ms = round((time.perf_counter() - started) * 1000)
    logger.info("agent=%s duration_ms=%d %s", agent, duration_ms, message)
    return [AgentStep(agent=agent, message=message, duration_ms=duration_ms)]


def planner_step(state: TripState, llm) -> TripState:
    started = time.perf_counter()
    it = planner_node(state, llm)["itinerary"]
    message = (
        f"Vols {it.outbound_flight.airline} et {it.return_flight.airline}, "
        f"hôtel {it.hotel.name} ({it.nights} nuits)."
    )
    return {"itinerary": it, "mode": "normal", "steps": _step("planificateur", message, started)}


def activities_step(state: TripState) -> TripState:
    started = time.perf_counter()
    it, mode = state["itinerary"], state["mode"]
    it = recost(it.model_copy(update={"days": schedule_activities(it, mode)}))
    count = sum(len(day.activities) for day in it.days)
    message = f"{count} activités réparties sur {len(it.days)} jours{MODE_LABEL[mode]}."
    return {"itinerary": it, "steps": _step("programme", message, started)}


def budget_step(state: TripState) -> TripState:
    started = time.perf_counter()
    decision = review_budget(
        state["itinerary"], state["trip"], state["mode"], state.get("adjusted", False)
    )
    update: TripState = {
        "itinerary": decision.itinerary,
        "done": decision.next_mode is None,
        "steps": _step("budget", decision.message, started),
    }
    if decision.next_mode:
        update["mode"] = decision.next_mode
        update["adjusted"] = True
    return update


def build_travel_graph(llm):
    graph = StateGraph(TripState)
    graph.add_node("planner", partial(planner_step, llm=llm))
    graph.add_node("activities", activities_step)
    graph.add_node("budget", budget_step)
    graph.add_edge(START, "planner")
    graph.add_edge("planner", "activities")
    graph.add_edge("activities", "budget")
    graph.add_conditional_edges("budget", lambda s: END if s["done"] else "activities")
    return graph.compile()


def plan_trip(trip: dict, llm) -> Itinerary:
    """Lance les trois agents et renvoie l'itinéraire final avec le journal des étapes."""
    state = build_travel_graph(llm).invoke({"trip": trip, "steps": []})
    return state["itinerary"].model_copy(update={"steps": state["steps"]})

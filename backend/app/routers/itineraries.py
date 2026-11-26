from datetime import datetime, timezone

from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session

from app.agents.errors import NoAvailabilityError, PlannerError
from app.agents.llm import get_planner_llm
from app.agents.planner import build_planner_graph
from app.db import get_db
from app.models import Itinerary as ItineraryRow
from app.models import User
from app.routers.trips import get_owned_trip
from app.schemas import Itinerary, ItineraryGenerateRequest
from app.security import get_current_user

router = APIRouter(prefix="/itineraries", tags=["itineraries"])


def planner_llm():
    """Dépendance FastAPI (remplaçable dans les tests)."""
    try:
        return get_planner_llm()
    except PlannerError as exc:
        raise HTTPException(status_code=502, detail=str(exc)) from exc


@router.post("/generate", response_model=Itinerary, status_code=201)
def generate_itinerary(
    payload: ItineraryGenerateRequest,
    db: Session = Depends(get_db),
    llm=Depends(planner_llm),
    user: User = Depends(get_current_user),
):
    """US12a - génère les vols aller-retour et l'hôtel d'une demande de voyage."""
    trip = get_owned_trip(payload.trip_id, db, user)

    now = datetime.now(timezone.utc).replace(tzinfo=None)
    state = {
        "trip": {
            "id": trip.id,
            "destination": trip.destination,
            "departure_date": trip.departure_date,
            "return_date": trip.return_date,
            "travelers": trip.travelers,
            "budget": trip.budget,
            "now": now,
        }
    }
    try:
        itinerary = build_planner_graph(llm).invoke(state)["itinerary"]
    except NoAvailabilityError as exc:
        raise HTTPException(status_code=422, detail=str(exc)) from exc
    except PlannerError as exc:
        raise HTTPException(status_code=502, detail=str(exc)) from exc

    row = ItineraryRow(trip_id=trip.id, payload={}, created_at=now)
    db.add(row)
    db.flush()  # obtient l'identifiant
    itinerary = itinerary.model_copy(update={"id": row.id})
    row.payload = itinerary.model_dump(mode="json")
    db.commit()
    return itinerary

from datetime import datetime, timezone

from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy import select
from sqlalchemy.orm import Session

from app.agents.errors import NoAvailabilityError, PlannerError
from app.agents.graph import plan_trip
from app.agents.llm import get_planner_llm
from app.db import get_db
from app.models import Itinerary as ItineraryRow
from app.models import Trip, User
from app.routers.trips import get_owned_trip
from app.schemas import Itinerary, ItineraryGenerateRequest
from app.security import get_current_user

router = APIRouter(tags=["itineraries"])


def requested_trip(
    payload: ItineraryGenerateRequest,
    db: Session = Depends(get_db),
    user: User = Depends(get_current_user),
) -> Trip:
    """Voyage demandé, vérifié (jeton puis propriétaire) avant tout appel au LLM."""
    return get_owned_trip(payload.trip_id, db, user)


def planner_llm(trip: Trip = Depends(requested_trip)):
    """Dépendance FastAPI (remplaçable dans les tests). Dépend du voyage pour passer après lui."""
    try:
        return get_planner_llm()
    except PlannerError as exc:
        raise HTTPException(status_code=502, detail=str(exc)) from exc


@router.post("/itineraries/generate", response_model=Itinerary, status_code=201)
def generate_itinerary(
    trip: Trip = Depends(requested_trip),
    llm=Depends(planner_llm),
    db: Session = Depends(get_db),
):
    """US08 - les agents planificateur, programme et budget construisent l'itinéraire."""
    now = datetime.now(timezone.utc).replace(tzinfo=None)
    request = {
        "id": trip.id,
        "destination": trip.destination,
        "departure_date": trip.departure_date,
        "return_date": trip.return_date,
        "travelers": trip.travelers,
        "budget": trip.budget,
        "now": now,
    }
    try:
        itinerary = plan_trip(request, llm)
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


@router.get("/itineraries/{itinerary_id}", response_model=Itinerary)
def get_itinerary(
    itinerary_id: int,
    db: Session = Depends(get_db),
    user: User = Depends(get_current_user),
):
    row = db.get(ItineraryRow, itinerary_id)
    if row is None:
        raise HTTPException(status_code=404, detail="Itinéraire introuvable.")
    get_owned_trip(row.trip_id, db, user)
    return row.payload


@router.get("/trips/{trip_id}/itinerary", response_model=Itinerary)
def get_latest_itinerary(
    trip_id: int,
    db: Session = Depends(get_db),
    user: User = Depends(get_current_user),
):
    """US09 - dernier itinéraire généré pour un voyage (404 s'il n'y en a pas encore)."""
    trip = get_owned_trip(trip_id, db, user)
    row = db.scalar(
        select(ItineraryRow)
        .where(ItineraryRow.trip_id == trip.id)
        .order_by(ItineraryRow.id.desc())
        .limit(1)
    )
    if row is None:
        raise HTTPException(status_code=404, detail="Aucun itinéraire pour ce voyage.")
    return row.payload

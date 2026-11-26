from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy import select
from sqlalchemy.orm import Session

from app.db import get_db
from app.models import Trip, User
from app.schemas import TripCreate, TripOut
from app.security import get_current_user

router = APIRouter(prefix="/trips", tags=["trips"])


def get_owned_trip(trip_id: int, db: Session, user: User) -> Trip:
    """Voyage de l'utilisateur connecté ; 404 s'il n'existe pas ou appartient à un autre."""
    trip = db.get(Trip, trip_id)
    if trip is None or trip.user_id != user.id:
        raise HTTPException(status_code=404, detail="Voyage introuvable.")
    return trip


@router.post("", response_model=TripOut, status_code=201)
def create_trip(
    payload: TripCreate,
    db: Session = Depends(get_db),
    user: User = Depends(get_current_user),
):
    trip = Trip(**payload.model_dump(), user_id=user.id)
    db.add(trip)
    db.commit()
    db.refresh(trip)
    return trip


@router.get("", response_model=list[TripOut])
def list_trips(db: Session = Depends(get_db), user: User = Depends(get_current_user)):
    """Demandes de l'utilisateur connecté, de la plus récente à la plus ancienne."""
    return db.scalars(select(Trip).where(Trip.user_id == user.id).order_by(Trip.id.desc())).all()


@router.get("/{trip_id}", response_model=TripOut)
def get_trip(trip_id: int, db: Session = Depends(get_db), user: User = Depends(get_current_user)):
    return get_owned_trip(trip_id, db, user)

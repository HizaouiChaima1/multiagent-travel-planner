import datetime as dt
from typing import Optional

from fastapi import APIRouter, Query

from app.mock_data.flights import get_flights
from app.schemas import Flight

router = APIRouter(prefix="/mock", tags=["mock"])


@router.get("/flights", response_model=list[Flight])
def list_flights(
    origin: Optional[str] = Query(None, description="Ville de départ (insensible à la casse)"),
    destination: Optional[str] = Query(None, description="Ville d'arrivée (insensible à la casse)"),
    date: Optional[dt.date] = Query(None, description="Jour de départ (YYYY-MM-DD)"),
    max_price: Optional[float] = Query(None, ge=0, description="Prix maximum par voyageur (EUR)"),
):
    return get_flights(
        origin=origin, destination=destination, departure_date=date, max_price=max_price
    )
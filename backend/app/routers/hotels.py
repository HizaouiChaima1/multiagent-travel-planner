from typing import Optional

from fastapi import APIRouter, Query

from app.mock_data.hotels import get_hotels
from app.schemas import Hotel

router = APIRouter(prefix="/mock", tags=["mock"])


@router.get("/hotels", response_model=list[Hotel])
def list_hotels(
    city: Optional[str] = Query(None, description="Ville (insensible à la casse)"),
    max_price: Optional[float] = Query(None, ge=0, description="Prix maximum par nuit (EUR)"),
):
    return get_hotels(city=city, max_price=max_price)
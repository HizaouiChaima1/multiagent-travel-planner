from typing import Literal, Optional

from fastapi import APIRouter, Query

from app.mock_data.activities import CITIES, get_activities
from app.schemas import Activity

router = APIRouter(prefix="/mock", tags=["mock"])


@router.get("/cities", response_model=list[str])
def list_cities():
    return CITIES


@router.get("/activities", response_model=list[Activity])
def list_activities(
    city: Optional[str] = Query(None, description="Ville (insensible à la casse)"),
    category: Optional[str] = Query(None),
    setting: Optional[Literal["indoor", "outdoor"]] = Query(None),
    max_price: Optional[float] = Query(None, ge=0),
):
    return get_activities(city=city, category=category, setting=setting, max_price=max_price)

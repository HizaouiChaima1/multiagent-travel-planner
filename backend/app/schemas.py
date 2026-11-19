from datetime import date, datetime
from typing import Literal

from pydantic import BaseModel, ConfigDict, Field, field_validator, model_validator

from app.mock_data.activities import CITIES


class Activity(BaseModel):
    id: str
    city: str
    name: str
    category: str
    price: float
    duration_hours: float
    setting: Literal["indoor", "outdoor"]


class TripCreate(BaseModel):
    """US09 - demande de voyage saisie par le voyageur."""

    destination: str = Field(min_length=1)
    departure_date: date
    return_date: date
    travelers: int = Field(ge=1, le=10)
    budget: float

    @field_validator("destination")
    @classmethod
    def destination_supported(cls, v: str) -> str:
        v = v.strip()
        for city in CITIES:
            if city.lower() == v.lower():
                return city
        raise ValueError(f"Destination non disponible. Villes proposées : {', '.join(CITIES)}")

    @field_validator("budget")
    @classmethod
    def budget_positive(cls, v: float) -> float:
        if v <= 0:
            raise ValueError("Le budget doit être strictement positif.")
        return v

    @model_validator(mode="after")
    def check_dates(self):
        if self.departure_date < date.today():
            raise ValueError("La date de départ ne peut pas être dans le passé.")
        if self.return_date < self.departure_date:
            raise ValueError("La date de retour ne peut pas précéder la date de départ.")
        return self


class TripOut(BaseModel):
    model_config = ConfigDict(from_attributes=True)

    id: int
    destination: str
    departure_date: date
    return_date: date
    travelers: int
    budget: float
    created_at: datetime

from datetime import date, datetime
from typing import Literal, Optional

from pydantic import BaseModel, ConfigDict, EmailStr, Field, field_validator, model_validator

from app.mock_data.activities import CITIES


class Credentials(BaseModel):
    """US02 - identifiants de connexion."""

    email: EmailStr
    password: str = Field(min_length=1)

    @field_validator("email")
    @classmethod
    def normalize_email(cls, v: str) -> str:
        return v.lower()


class RegisterIn(Credentials):
    """US01 - inscription : mot de passe de 8 caractères minimum."""

    password: str = Field(min_length=8, max_length=72)


class UserOut(BaseModel):
    model_config = ConfigDict(from_attributes=True)

    id: int
    email: str
    created_at: datetime


class TokenOut(BaseModel):
    access_token: str
    token_type: Literal["bearer"] = "bearer"


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


class Flight(BaseModel):
    id: str
    airline: str
    origin: str
    destination: str
    departure_time: datetime
    arrival_time: datetime
    price: float = Field(ge=0)


class Hotel(BaseModel):
    id: str
    city: str
    name: str
    district: str
    price_per_night: float = Field(ge=0)
    rating: float = Field(ge=0, le=5)


class ScheduledActivity(BaseModel):
    start_time: str = Field(pattern=r"^([01][0-9]|2[0-3]):[0-5][0-9]$")
    end_time: str = Field(pattern=r"^([01][0-9]|2[0-3]):[0-5][0-9]$")
    activity: Activity


class ItineraryDay(BaseModel):
    day: int = Field(ge=1)
    date: date
    # Vide tant que US12b (programme jour par jour, sprint 3) n'est pas livrée ;
    # le contrat final impose 2 à 4 activités par jour.
    activities: list[ScheduledActivity] = Field(default_factory=list, max_length=4)


class CostBreakdown(BaseModel):
    flights: float
    hotel: float
    activities: float
    total: float
    currency: Literal["EUR"] = "EUR"


class ItineraryGenerateRequest(BaseModel):
    trip_id: int = Field(ge=1)


class Itinerary(BaseModel):
    """US12a - itinéraire généré (contrat : openapi.yaml, schéma Itinerary)."""

    id: int
    trip_id: int
    destination: str
    departure_date: date
    return_date: date
    travelers: int
    budget: float
    nights: int = Field(ge=0)
    outbound_flight: Flight
    return_flight: Flight
    hotel: Hotel
    days: list[ItineraryDay]
    cost: CostBreakdown
    budget_status: Literal["within_budget", "adjusted", "over_budget"]
    budget_message: Optional[str] = None
    created_at: datetime


class PlannerChoice(BaseModel):
    """Sortie structurée du LLM : il ne choisit que des identifiants du catalogue."""

    outbound_flight_id: str = Field(description="Identifiant du vol aller choisi (FLT-xxxx)")
    return_flight_id: str = Field(description="Identifiant du vol retour choisi (FLT-xxxx)")
    hotel_id: str = Field(description="Identifiant de l'hôtel choisi (HOT-xxx-xx)")
    rationale: str = Field(default="", description="Justification courte du choix, en français")

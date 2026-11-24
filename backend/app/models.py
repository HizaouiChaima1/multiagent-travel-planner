from datetime import date, datetime, timezone

from sqlalchemy import JSON, Date, DateTime, Float, ForeignKey, Integer, String
from sqlalchemy.orm import Mapped, mapped_column

from app.db import Base


class Trip(Base):
    __tablename__ = "trips"

    id: Mapped[int] = mapped_column(Integer, primary_key=True, index=True)
    # Utilisateur fictif tant que l'authentification (US01/US02, sprint 2) n'existe pas.
    user_id: Mapped[int | None] = mapped_column(Integer, nullable=True)
    destination: Mapped[str] = mapped_column(String(100), nullable=False)
    departure_date: Mapped[date] = mapped_column(Date, nullable=False)
    return_date: Mapped[date] = mapped_column(Date, nullable=False)
    travelers: Mapped[int] = mapped_column(Integer, nullable=False)
    budget: Mapped[float] = mapped_column(Float, nullable=False)
    created_at: Mapped[datetime] = mapped_column(
        DateTime, default=lambda: datetime.now(timezone.utc).replace(tzinfo=None)
    )


class Itinerary(Base):
    """US12a - itinéraire généré, conservé tel que renvoyé par l'API (JSON)."""

    __tablename__ = "itineraries"

    id: Mapped[int] = mapped_column(Integer, primary_key=True, index=True)
    trip_id: Mapped[int] = mapped_column(ForeignKey("trips.id"), nullable=False, index=True)
    payload: Mapped[dict] = mapped_column(JSON, nullable=False)
    created_at: Mapped[datetime] = mapped_column(
        DateTime, default=lambda: datetime.now(timezone.utc).replace(tzinfo=None)
    )

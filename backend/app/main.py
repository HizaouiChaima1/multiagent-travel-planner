import os
from contextlib import asynccontextmanager

from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware

from app import models  # noqa: F401  (enregistre les tables)
from app.db import Base, engine
from app.routers import activities, auth, flights, hotels, itineraries, trips


@asynccontextmanager
async def lifespan(app: FastAPI):
    Base.metadata.create_all(bind=engine)
    yield


app = FastAPI(title="MultiAgent Travel Planner", lifespan=lifespan)

CORS_ORIGINS = os.getenv("CORS_ORIGINS", "http://localhost:5173").split(",")

app.add_middleware(
    CORSMiddleware,
    allow_origins=[origin.strip() for origin in CORS_ORIGINS],
    allow_methods=["*"],
    allow_headers=["*"],
)

app.include_router(auth.router)
app.include_router(activities.router)
app.include_router(flights.router)
app.include_router(hotels.router)
app.include_router(itineraries.router)
app.include_router(trips.router)


@app.get("/health")
def health():
    return {"status": "ok"}

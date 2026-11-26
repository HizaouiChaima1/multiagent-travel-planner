import { request } from "./client.js";

/** US08 - lance les agents (planificateur, programme, budget) pour un voyage. */
export const generateItinerary = (tripId) =>
  request("/itineraries/generate", {
    method: "POST",
    body: { trip_id: tripId },
    fallback: "Les agents n'ont pas pu préparer l'itinéraire.",
  });

/** Dernier itinéraire du voyage ; erreur 404 (error.status) s'il n'a pas encore été généré. */
export const fetchLatestItinerary = (tripId) =>
  request(`/trips/${tripId}/itinerary`, { fallback: "Impossible de charger l'itinéraire." });

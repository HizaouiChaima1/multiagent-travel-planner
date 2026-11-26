import { request } from "./client.js";

export const fetchTrips = () =>
  request("/trips", { fallback: "Impossible de charger vos voyages." });

export const createTrip = (values) =>
  request("/trips", {
    method: "POST",
    body: {
      destination: values.destination.trim(),
      departure_date: values.departureDate,
      return_date: values.returnDate,
      travelers: Number(values.travelers),
      budget: Number(values.budget),
    },
    fallback: "Erreur lors de l'enregistrement de la demande.",
  });

export const fetchTrip = (tripId) =>
  request(`/trips/${tripId}`, { fallback: "Voyage introuvable." });

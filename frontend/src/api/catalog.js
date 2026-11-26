import { request } from "./client.js";

export const fetchCities = () =>
  request("/mock/cities", { fallback: "Impossible de charger les destinations." });

/** Prix réels du catalogue pour une ville : vol le moins cher depuis Tunis et nuit d'hôtel. */
export async function fetchCityOffer(city) {
  const query = encodeURIComponent(city);
  const [flights, hotels] = await Promise.all([
    request(`/mock/flights?origin=Tunis&destination=${query}`, {
      fallback: "Impossible de charger les vols.",
    }),
    request(`/mock/hotels?city=${query}`, { fallback: "Impossible de charger les hôtels." }),
  ]);
  const cheapest = (items, key) => Math.min(...items.map((item) => item[key]));
  return {
    flightFrom: flights.length ? cheapest(flights, "price") : null,
    flights: flights.length,
    hotelFrom: hotels.length ? cheapest(hotels, "price_per_night") : null,
    hotels: hotels.length,
  };
}

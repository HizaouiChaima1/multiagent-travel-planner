import { request } from "./client.js";

export const fetchCities = () =>
  request("/mock/cities", { fallback: "Impossible de charger les destinations." });

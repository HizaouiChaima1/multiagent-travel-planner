// Coordonnées (latitude, longitude) du départ et des 12 villes des données simulées.
export const HUB = { name: "Tunis", lat: 36.81, lon: 10.18 };

export const DESTINATIONS = [
  { name: "Paris", lat: 48.86, lon: 2.35 },
  { name: "Rome", lat: 41.9, lon: 12.5 },
  { name: "Barcelone", lat: 41.39, lon: 2.17 },
  { name: "Londres", lat: 51.51, lon: -0.13 },
  { name: "Istanbul", lat: 41.01, lon: 28.98 },
  { name: "Marrakech", lat: 31.63, lon: -7.99 },
  { name: "Lisbonne", lat: 38.72, lon: -9.14 },
  { name: "Madrid", lat: 40.42, lon: -3.7 },
  { name: "Berlin", lat: 52.52, lon: 13.4 },
  { name: "Amsterdam", lat: 52.37, lon: 4.9 },
  { name: "Athènes", lat: 37.98, lon: 23.73 },
];

export const ROME = DESTINATIONS.find((city) => city.name === "Rome");

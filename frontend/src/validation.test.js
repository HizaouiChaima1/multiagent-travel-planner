import test from "node:test";
import assert from "node:assert/strict";
import { validateTripRequest } from "./validation.js";

const today = "2026-11-19";
const cities = ["Paris", "Rome"];
const valid = {
  destination: "Paris",
  departureDate: "2026-12-01",
  returnDate: "2026-12-08",
  travelers: "2",
  budget: "1500",
};
const check = (over) => validateTripRequest({ ...valid, ...over }, { cities, today });

test("une demande valide n'a aucune erreur", () => {
  assert.deepEqual(check({}), {});
});

test("destination vide ou inconnue", () => {
  assert.ok(check({ destination: "" }).destination);
  assert.ok(check({ destination: "Atlantide" }).destination);
  assert.deepEqual(check({ destination: "paris" }), {});
});

test("date de départ passée refusée", () => {
  assert.ok(check({ departureDate: "2026-11-01" }).departureDate);
});

test("retour avant le départ refusé", () => {
  assert.ok(check({ returnDate: "2026-11-30" }).returnDate);
});

test("budget nul, négatif ou vide refusé", () => {
  assert.ok(check({ budget: "0" }).budget);
  assert.ok(check({ budget: "-10" }).budget);
  assert.ok(check({ budget: "" }).budget);
});

test("nombre de voyageurs invalide", () => {
  assert.ok(check({ travelers: "0" }).travelers);
  assert.ok(check({ travelers: "11" }).travelers);
  assert.ok(check({ travelers: "1.5" }).travelers);
});

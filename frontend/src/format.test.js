import test from "node:test";
import assert from "node:assert/strict";
import { nightsBetween } from "./format.js";

test("nombre de nuits entre deux dates", () => {
  assert.equal(nightsBetween("2026-12-01", "2026-12-08"), 7);
  assert.equal(nightsBetween("2026-12-01", "2026-12-01"), 0);
});

test("le nombre de nuits ne devient jamais négatif", () => {
  assert.equal(nightsBetween("2026-12-08", "2026-12-01"), 0);
});

test("le changement d'heure ne fausse pas le décompte", () => {
  assert.equal(nightsBetween("2027-03-25", "2027-03-30"), 5);
});

import { test } from "node:test";
import assert from "node:assert/strict";
import { validateCredentials } from "./validation.js";

const ok = { email: "voyageur@example.com", password: "motdepasse123", confirm: "motdepasse123" };

test("identifiants valides : aucune erreur", () => {
  assert.deepEqual(validateCredentials(ok, { signup: true }), {});
  assert.deepEqual(validateCredentials(ok), {});
});

test("e-mail invalide refusé", () => {
  for (const email of ["", "voyageur", "voyageur@", "a b@example.com"]) {
    assert.ok(validateCredentials({ ...ok, email }).email, email);
  }
});

test("inscription : mot de passe de 8 caractères minimum", () => {
  const short = { ...ok, password: "court12", confirm: "court12" };
  assert.ok(validateCredentials(short, { signup: true }).password);
  assert.equal(validateCredentials(short).password, undefined);
});

test("inscription : la confirmation doit être identique", () => {
  assert.ok(validateCredentials({ ...ok, confirm: "autre-mot" }, { signup: true }).confirm);
});

test("connexion : mot de passe obligatoire", () => {
  assert.ok(validateCredentials({ ...ok, password: "" }).password);
});

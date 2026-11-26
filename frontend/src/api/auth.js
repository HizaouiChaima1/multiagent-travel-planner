import { request } from "./client.js";

export const register = (email, password) =>
  request("/auth/register", {
    method: "POST",
    body: { email, password },
    fallback: "Inscription impossible.",
  });

export const login = (email, password) =>
  request("/auth/login", {
    method: "POST",
    body: { email, password },
    fallback: "Connexion impossible.",
  });

export const fetchMe = () => request("/auth/me", { fallback: "Session expirée." });

import { readToken } from "../auth/session.js";

const API_URL = import.meta.env?.VITE_API_URL ?? "http://localhost:8000";

let onUnauthorized = () => {};

/** Appelé par la session quand l'API refuse le jeton (expiré ou invalide). */
export function setUnauthorizedHandler(handler) {
  onUnauthorized = handler;
}

/** Message lisible à partir d'une erreur FastAPI ({detail: "..."} ou {detail: [...]}). */
export function errorMessage(body, fallback) {
  const detail = body?.detail;
  if (typeof detail === "string" && detail) return detail;
  if (Array.isArray(detail) && detail.length) {
    return detail.map((d) => d.msg.replace(/^Value error, /, "")).join(" ");
  }
  return fallback;
}

/**
 * Appel JSON à l'API. Ajoute le jeton si l'utilisateur est connecté.
 * Lève une Error dont le message est prêt à être affiché.
 */
export async function request(path, { method = "GET", body, fallback = "Erreur réseau." } = {}) {
  const headers = { "Content-Type": "application/json" };
  const token = readToken();
  if (token) headers.Authorization = `Bearer ${token}`;

  let res;
  try {
    res = await fetch(`${API_URL}${path}`, {
      method,
      headers,
      body: body === undefined ? undefined : JSON.stringify(body),
    });
  } catch {
    throw new Error("Le serveur ne répond pas. Vérifiez que l'API est démarrée.");
  }

  const data = await res.json().catch(() => null);
  if (!res.ok) {
    if (res.status === 401 && token) onUnauthorized();
    const error = new Error(errorMessage(data, fallback));
    error.status = res.status;
    throw error;
  }
  return data;
}

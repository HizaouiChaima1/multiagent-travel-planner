// Jeton JWT conservé dans le navigateur. Le stockage peut être indisponible
// (navigation privée, cookies bloqués) : la session vit alors en mémoire.
const KEY = "travel-planner.token";
let memoryToken = null;

export function readToken() {
  try {
    return localStorage.getItem(KEY) ?? memoryToken;
  } catch {
    return memoryToken;
  }
}

export function writeToken(token) {
  memoryToken = token;
  try {
    if (token) localStorage.setItem(KEY, token);
    else localStorage.removeItem(KEY);
  } catch {
    /* stockage indisponible : la mémoire suffit pour cet onglet */
  }
}

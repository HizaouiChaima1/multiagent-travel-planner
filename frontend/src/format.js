// Mise en forme des données affichées au voyageur.

const MS_PER_DAY = 24 * 60 * 60 * 1000;

export function nightsBetween(departureISO, returnISO) {
  const diff = Date.parse(`${returnISO}T00:00:00Z`) - Date.parse(`${departureISO}T00:00:00Z`);
  return Math.max(0, Math.round(diff / MS_PER_DAY));
}

export function formatDate(iso) {
  return new Intl.DateTimeFormat("fr-FR", {
    day: "numeric",
    month: "long",
    year: "numeric",
    timeZone: "UTC",
  }).format(new Date(`${iso}T00:00:00Z`));
}

export function formatBudget(amount) {
  return new Intl.NumberFormat("fr-FR", {
    style: "currency",
    currency: "EUR",
    maximumFractionDigits: 0,
  }).format(amount);
}

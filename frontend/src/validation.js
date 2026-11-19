// US09 - validations côté client (miroir de celles du backend).

export function todayISO(now = new Date()) {
  const y = now.getFullYear();
  const m = String(now.getMonth() + 1).padStart(2, "0");
  const d = String(now.getDate()).padStart(2, "0");
  return `${y}-${m}-${d}`;
}

/**
 * @param {{destination:string, departureDate:string, returnDate:string, travelers:string|number, budget:string|number}} values
 * @param {{cities?: string[], today?: string}} options
 * @returns {Record<string,string>} erreurs par champ (objet vide si valide)
 */
export function validateTripRequest(values, { cities = [], today = todayISO() } = {}) {
  const errors = {};

  const destination = (values.destination || "").trim();
  if (!destination) {
    errors.destination = "La destination est obligatoire.";
  } else if (cities.length && !cities.some((c) => c.toLowerCase() === destination.toLowerCase())) {
    errors.destination = "Destination non disponible.";
  }

  if (!values.departureDate) {
    errors.departureDate = "La date de départ est obligatoire.";
  } else if (values.departureDate < today) {
    errors.departureDate = "La date de départ ne peut pas être dans le passé.";
  }

  if (!values.returnDate) {
    errors.returnDate = "La date de retour est obligatoire.";
  } else if (values.departureDate && values.returnDate < values.departureDate) {
    errors.returnDate = "La date de retour ne peut pas précéder la date de départ.";
  }

  const travelers = Number(values.travelers);
  if (!Number.isInteger(travelers) || travelers < 1 || travelers > 10) {
    errors.travelers = "Le nombre de voyageurs doit être un entier entre 1 et 10.";
  }

  const budget = Number(values.budget);
  if (values.budget === "" || values.budget === null || Number.isNaN(budget)) {
    errors.budget = "Le budget est obligatoire.";
  } else if (budget <= 0) {
    errors.budget = "Le budget doit être strictement positif.";
  }

  return errors;
}

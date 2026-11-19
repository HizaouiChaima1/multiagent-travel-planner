const API_URL = import.meta.env?.VITE_API_URL ?? "http://localhost:8000";

export async function fetchCities() {
  const res = await fetch(`${API_URL}/mock/cities`);
  if (!res.ok) throw new Error("Impossible de charger les destinations.");
  return res.json();
}

export async function createTrip(values) {
  const res = await fetch(`${API_URL}/trips`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({
      destination: values.destination.trim(),
      departure_date: values.departureDate,
      return_date: values.returnDate,
      travelers: Number(values.travelers),
      budget: Number(values.budget),
    }),
  });
  if (!res.ok) {
    let message = "Erreur lors de l'enregistrement de la demande.";
    try {
      const body = await res.json();
      if (Array.isArray(body.detail) && body.detail.length) {
        message = body.detail.map((d) => d.msg.replace(/^Value error, /, "")).join(" ");
      }
    } catch {
      /* corps non JSON : on garde le message par défaut */
    }
    throw new Error(message);
  }
  return res.json();
}

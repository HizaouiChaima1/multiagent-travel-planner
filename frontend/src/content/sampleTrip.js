// Résultats réels des agents (mode sans LLM) pour le scénario de démonstration du TP1 :
// Tunis -> Rome, 12 au 16 décembre 2026, 2 voyageurs. Rejouer : backend/tests/test_agents_mvp.py.
export const SAMPLE_TRIP = {
  request: "Rome, du 12 au 16 décembre, 2 voyageurs, 1 500 €",
  steps: [
    ["Agent planificateur", "Vols Nouvelair et Ryanair, hôtel Maison Cèdre pour 4 nuits."],
    ["Agent programme", "14 activités réparties sur 5 jours, sans chevauchement."],
    ["Agent budget", "1 172 € pour 1 500 € : dans le budget."],
  ],
  day: {
    label: "Jour 2, dimanche 13 décembre",
    events: [
      ["09:00 – 11:00", "Dégustation au marché de Rome", "Gastronomie, intérieur", 14],
      ["11:30 – 14:00", "Vélo électrique dans Rome", "Aventure, extérieur", 28],
      ["14:30 – 16:30", "Spectacle ou concert à Rome", "Spectacle, intérieur", 42],
    ],
  },
  cost: { flights: 342, hotel: 248, activities: 582, total: 1172, budget: 1500 },
  tight: {
    budget: 300,
    minimum: 590,
    message:
      "Le budget de 300 € est insuffisant pour ce voyage. Le coût minimal trouvé est de 590 €, soit 290 € de plus que le budget.",
  },
};

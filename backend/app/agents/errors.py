class PlannerError(Exception):
    """Le LLM n'a pas produit de choix valide, ou le service est indisponible (HTTP 502)."""


class NoAvailabilityError(Exception):
    """Aucune combinaison vol aller / vol retour / hôtel n'existe pour la demande (HTTP 422)."""

from app.schemas import PlannerChoice


class FakeLLM:
    """LLM factice : renvoie les réponses données, dans l'ordre (la dernière se répète)."""

    def __init__(self, *responses):
        self.responses = list(responses)
        self.calls = 0

    def invoke(self, messages):
        resp = self.responses[min(self.calls, len(self.responses) - 1)]
        self.calls += 1
        if isinstance(resp, Exception):
            raise resp
        return resp


def pick_first(candidates) -> PlannerChoice:
    """Choix valide : premier vol aller, dernier vol retour, premier hôtel."""
    return PlannerChoice(
        outbound_flight_id=candidates["outbound"][0]["id"],
        return_flight_id=candidates["return"][-1]["id"],
        hotel_id=candidates["hotels"][0]["id"],
        rationale="test",
    )

"""Agent programme jour par jour (US06).

Il remplit chaque jour du séjour avec des activités de la ville de destination :
  - jours pleins : de 09:00 à 21:00, 2 à 4 activités ;
  - jour d'arrivée : à partir de 1 h 30 après l'atterrissage ;
  - jour du retour : jusqu'à 3 h avant le décollage ;
  - jamais deux fois la même activité, catégories variées, 30 min entre deux activités ;
  - activités et enveloppe d'activités réparties équitablement entre les jours.

Le placement est fait en Python, puis vérifié par `overlapping_slots` (action de la
rétrospective du sprint 1 : contrôler les chevauchements après le nœud, pas dans le prompt).

Le mode fixe le choix des activités, pour que l'agent budget puisse demander moins cher :
  "normal" : activités variées dans l'enveloppe restante du budget (budget - vols - hôtel) ;
  "free"   : activités gratuites uniquement.
"""
from datetime import datetime, time, timedelta

from app.agents.tools import search_activities
from app.schemas import Activity, Itinerary, ItineraryDay, ScheduledActivity

DAY_START = time(9, 0)
DAY_END = time(21, 0)
ARRIVAL_BUFFER = timedelta(minutes=90)
DEPARTURE_BUFFER = timedelta(hours=3)
GAP = timedelta(minutes=30)
MIN_PER_DAY, MAX_PER_DAY = 2, 4
MIN_USEFUL_WINDOW = timedelta(hours=2)  # en dessous, le jour de vol reste sans activité


def _round_up_half_hour(moment: datetime) -> datetime:
    extra = (30 - moment.minute % 30) % 30
    return (moment + timedelta(minutes=extra)).replace(second=0, microsecond=0)


def day_window(itinerary: Itinerary, day: ItineraryDay) -> tuple[datetime, datetime]:
    """Créneau libre du jour, compte tenu des vols."""
    start = datetime.combine(day.date, DAY_START)
    end = datetime.combine(day.date, DAY_END)
    arrival = itinerary.outbound_flight.arrival_time
    departure = itinerary.return_flight.departure_time
    if day.date == arrival.date():
        start = max(start, _round_up_half_hour(arrival + ARRIVAL_BUFFER))
    if day.date == departure.date():
        end = min(end, departure - DEPARTURE_BUFFER)
    return start, end


def _ordered_candidates(city: str, max_price: float) -> list[dict]:
    """Activités possibles, dans l'ordre où l'agent les propose (catégories alternées)."""
    activities = search_activities.invoke({"city": city, "max_price": max_price})
    activities = sorted(activities, key=lambda a: (a["price"], a["id"]))
    by_category: dict[str, list[dict]] = {}
    for activity in activities:
        by_category.setdefault(activity["category"], []).append(activity)
    ordered = []
    while any(by_category.values()):
        for queue in by_category.values():
            if queue:
                ordered.append(queue.pop(0))
    return ordered


def schedule_activities(itinerary: Itinerary, mode: str = "normal") -> list[ItineraryDay]:
    """Renvoie les jours du séjour remplis d'activités, sans chevauchement."""
    flights_and_hotel = itinerary.cost.flights + itinerary.cost.hotel
    # Enveloppe d'activités par personne (0 si les vols et l'hôtel prennent tout le budget).
    remaining = 0.0
    if mode == "normal":
        remaining = max(itinerary.budget - flights_and_hotel, 0) / itinerary.travelers
    pool = _ordered_candidates(itinerary.destination, remaining)
    windows = [day_window(itinerary, day) for day in itinerary.days]
    usable = [end - start >= MIN_USEFUL_WINDOW for start, end in windows]
    per_day = min(MAX_PER_DAY, max(MIN_PER_DAY, len(pool) // max(sum(usable), 1)))
    days = []
    for index, day in enumerate(itinerary.days):
        # Part de l'enveloppe restante pour ce jour, partagée entre les jours encore utilisables.
        day_budget = remaining / max(sum(usable[index:]), 1)
        spent = 0.0
        cursor, end = windows[index]
        slots: list[ScheduledActivity] = []
        for activity in list(pool):
            if len(slots) == per_day:
                break
            finish = cursor + timedelta(hours=activity["duration_hours"])
            if finish > end or spent + activity["price"] > day_budget:
                continue
            slots.append(
                ScheduledActivity(
                    start_time=cursor.strftime("%H:%M"),
                    end_time=finish.strftime("%H:%M"),
                    activity=Activity.model_validate(activity),
                )
            )
            spent += activity["price"]
            pool.remove(activity)
            cursor = _round_up_half_hour(finish + GAP)
        remaining -= spent
        days.append(day.model_copy(update={"activities": slots}))
    return days


def overlapping_slots(day: ItineraryDay) -> list[tuple[str, str]]:
    """Paires d'activités qui se chevauchent dans une journée (vide si tout va bien)."""
    slots = sorted(day.activities, key=lambda s: s.start_time)
    return [
        (a.activity.id, b.activity.id)
        for a, b in zip(slots, slots[1:])
        if b.start_time < a.end_time
    ]

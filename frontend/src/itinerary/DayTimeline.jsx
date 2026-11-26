import { formatBudget, formatDay, formatTime } from "../format.js";
import { CATEGORY_LABEL, SETTING_LABEL } from "./labels.js";

/** Événements d'un jour : vols et activités, triés par heure. */
function dayEvents(day, itinerary) {
  const events = day.activities.map((slot) => ({
    key: slot.activity.id,
    time: `${slot.start_time} – ${slot.end_time}`,
    sort: slot.start_time,
    title: slot.activity.name,
    meta: `${CATEGORY_LABEL[slot.activity.category] ?? slot.activity.category}, ${
      SETTING_LABEL[slot.activity.setting]
    }`,
    price: slot.activity.price,
  }));
  const flights = [
    [itinerary.outbound_flight, "Arrivée", "arrival_time"],
    [itinerary.return_flight, "Départ", "departure_time"],
  ];
  for (const [flight, verb, field] of flights) {
    if (flight[field].slice(0, 10) === day.date) {
      const time = formatTime(flight[field]);
      events.push({
        key: flight.id,
        time,
        sort: time,
        title: `${verb} : vol ${flight.airline} ${flight.origin} → ${flight.destination}`,
        flight: true,
      });
    }
  }
  return events.sort((a, b) => a.sort.localeCompare(b.sort));
}

export default function DayTimeline({ itinerary }) {
  return (
    <section className="days" aria-labelledby="days-title">
      <h2 id="days-title">Programme jour par jour</h2>
      {itinerary.days.map((day) => {
        const events = dayEvents(day, itinerary);
        return (
          <article key={day.day} className="day">
            <h3>
              Jour {day.day} <span>{formatDay(day.date)}</span>
            </h3>
            {day.activities.length === 0 && (
              <p className="day-free">
                Pas d'activité prévue ce jour-là : temps libre.
              </p>
            )}
            {events.length > 0 && (
              <ol>
                {events.map((event) => (
                  <li
                    key={event.key}
                    className={event.flight ? "event-flight" : undefined}
                  >
                    <span className="event-time">{event.time}</span>
                    <span className="event-body">
                      <span className="event-title">{event.title}</span>
                      {event.meta && (
                        <span className="event-meta">{event.meta}</span>
                      )}
                    </span>
                    {event.price !== undefined && (
                      <span className="event-price">
                        {event.price === 0
                          ? "Gratuit"
                          : `${formatBudget(event.price)} / pers.`}
                      </span>
                    )}
                  </li>
                ))}
              </ol>
            )}
          </article>
        );
      })}
    </section>
  );
}

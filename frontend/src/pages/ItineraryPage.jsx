import { Link, useParams } from "react-router-dom";
import { formatDate } from "../format.js";
import AgentLog from "../itinerary/AgentLog.jsx";
import AgentProgress from "../itinerary/AgentProgress.jsx";
import BudgetMeter from "../itinerary/BudgetMeter.jsx";
import DayTimeline from "../itinerary/DayTimeline.jsx";
import FlightCard from "../itinerary/FlightCard.jsx";
import HotelCard from "../itinerary/HotelCard.jsx";
import { useItinerary } from "../itinerary/useItinerary.js";
import "../itinerary/itinerary.css";
import "../styles/shell.css";

/** US09 - vols, hôtel, programme jour par jour et coût total comparé au budget. */
export default function ItineraryPage() {
  const { id } = useParams();
  const { trip, itinerary, status, error, generate } = useItinerary(id);

  if (status === "loading") {
    return <main className="page" aria-busy="true" />;
  }

  if (status === "generating") {
    return (
      <main className="page">
        <AgentProgress destination={trip.destination} />
      </main>
    );
  }

  if (status === "error") {
    return (
      <main className="page">
        <h1>Itinéraire indisponible</h1>
        <p className="error banner" role="alert">
          {error}
        </p>
        <div className="actions">
          {trip && (
            <button type="button" className="secondary" onClick={generate}>
              Réessayer
            </button>
          )}
          <Link to="/planifier">Modifier la demande</Link>
        </div>
      </main>
    );
  }

  const travelers = itinerary.travelers;
  return (
    <div className="shell itinerary">
      <aside className="panel itinerary-panel">
        <div>
          <p className="itinerary-city">{itinerary.destination}</p>
          <p className="promise">
            Du {formatDate(itinerary.departure_date)} au {formatDate(itinerary.return_date)},{" "}
            {travelers} {travelers > 1 ? "voyageurs" : "voyageur"}
          </p>
        </div>
        <BudgetMeter itinerary={itinerary} />
        <AgentLog steps={itinerary.steps ?? []} />
        <button type="button" className="regenerate" onClick={generate}>
          Relancer les agents
        </button>
      </aside>

      <main className="content itinerary-content">
        <section className="travel" aria-label="Vols et hôtel">
          <FlightCard label="Vol aller" flight={itinerary.outbound_flight} travelers={travelers} />
          <FlightCard label="Vol retour" flight={itinerary.return_flight} travelers={travelers} />
          <HotelCard hotel={itinerary.hotel} nights={itinerary.nights} />
        </section>
        <DayTimeline itinerary={itinerary} />
      </main>
    </div>
  );
}

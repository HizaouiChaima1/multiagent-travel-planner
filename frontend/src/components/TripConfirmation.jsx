import { Link } from "react-router-dom";
import { formatBudget, formatDate, nightsBetween } from "../format.js";
import "./TripConfirmation.css";

export default function TripConfirmation({ trip, onRestart }) {
  const nights = nightsBetween(trip.departure_date, trip.return_date);

  return (
    <section className="confirmation" role="status" aria-live="polite">
      <h1>Demande enregistrée</h1>
      <p className="lead">
        Votre voyage à {trip.destination} porte le numéro <strong>{trip.id}</strong>.
      </p>

      <dl className="summary">
        <div>
          <dt>Du</dt>
          <dd>{formatDate(trip.departure_date)}</dd>
        </div>
        <div>
          <dt>Au</dt>
          <dd>
            {formatDate(trip.return_date)}
            <span className="muted">
              {" "}
              ({nights} {nights > 1 ? "nuits" : "nuit"})
            </span>
          </dd>
        </div>
        <div>
          <dt>Voyageurs</dt>
          <dd>{trip.travelers}</dd>
        </div>
        <div>
          <dt>Budget</dt>
          <dd>{formatBudget(trip.budget)}</dd>
        </div>
      </dl>

      <div className="actions">
        <button type="button" className="secondary" onClick={onRestart}>
          Planifier un autre voyage
        </button>
        <Link to="/voyages">Voir mes voyages</Link>
      </div>
    </section>
  );
}

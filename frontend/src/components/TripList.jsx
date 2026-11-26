import { Link } from "react-router-dom";
import { formatBudget, formatDate, nightsBetween } from "../format.js";
import "./TripList.css";

export default function TripList({ trips, loading, error }) {
  return (
    <section className="history" aria-labelledby="history-title">
      <h1 id="history-title">Mes voyages</h1>

      {error && (
        <p className="error" role="alert">
          {error}
        </p>
      )}

      {loading && <p className="empty">Chargement de vos voyages…</p>}

      {!loading && !error && trips.length === 0 && (
        <p className="empty">
          Aucune demande pour le moment. <Link to="/planifier">Planifiez votre premier voyage</Link>.
        </p>
      )}

      {trips.length > 0 && (
        <ul className="trips">
          {trips.map((trip) => {
            const nights = nightsBetween(trip.departure_date, trip.return_date);
            return (
              <li key={trip.id}>
                <div className="trip-main">
                  <p className="trip-city">{trip.destination}</p>
                  <p className="trip-meta">
                    Du {formatDate(trip.departure_date)} au {formatDate(trip.return_date)} (
                    {nights} {nights > 1 ? "nuits" : "nuit"}),{" "}
                    {trip.travelers} {trip.travelers > 1 ? "voyageurs" : "voyageur"}
                  </p>
                </div>
                <div className="trip-side">
                  <p className="trip-budget">{formatBudget(trip.budget)}</p>
                  <p className="trip-id">Demande {trip.id}</p>
                </div>
              </li>
            );
          })}
        </ul>
      )}
    </section>
  );
}

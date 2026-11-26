import { formatBudget, formatDate, formatTime } from "../format.js";

export default function FlightCard({ label, flight, travelers }) {
  return (
    <article className="travel-card">
      <p className="travel-kind">{label}</p>
      <p className="travel-route">
        {flight.origin} → {flight.destination}
      </p>
      <p className="travel-detail">
        {formatDate(flight.departure_time.slice(0, 10))}, {formatTime(flight.departure_time)} –{" "}
        {formatTime(flight.arrival_time)}
      </p>
      <p className="travel-detail">{flight.airline}</p>
      <p className="travel-price">
        {formatBudget(flight.price)} <span>par voyageur, {travelers} au total</span>
      </p>
    </article>
  );
}

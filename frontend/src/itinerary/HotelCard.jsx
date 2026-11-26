import { formatBudget } from "../format.js";

export default function HotelCard({ hotel, nights }) {
  return (
    <article className="travel-card">
      <p className="travel-kind">Hôtel</p>
      <p className="travel-route">{hotel.name}</p>
      <p className="travel-detail">
        Quartier {hotel.district}, noté {hotel.rating.toLocaleString("fr-FR")} sur 5
      </p>
      <p className="travel-price">
        {formatBudget(hotel.price_per_night)}{" "}
        <span>
          la nuit, {nights} {nights > 1 ? "nuits" : "nuit"}
        </span>
      </p>
    </article>
  );
}

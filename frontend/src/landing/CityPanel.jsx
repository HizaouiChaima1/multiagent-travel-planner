import { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import { fetchCityOffer } from "../api/catalog.js";
import { photoForCity } from "../content/photos.js";
import { formatBudget } from "../format.js";

/** Ville choisie sur le globe : vrais prix du catalogue simulé et accès direct au formulaire. */
export default function CityPanel({ city }) {
  const [offer, setOffer] = useState(null);
  const [error, setError] = useState("");
  const photo = photoForCity(city);

  useEffect(() => {
    let cancelled = false;
    setOffer(null);
    setError("");
    fetchCityOffer(city)
      .then((result) => !cancelled && setOffer(result))
      .catch((e) => !cancelled && setError(e.message));
    return () => {
      cancelled = true;
    };
  }, [city]);

  return (
    <section className="city-panel" aria-live="polite" aria-label={`Partir à ${city}`}>
      {photo && <img src={photo.src} alt={photo.alt} />}
      <div className="city-panel-body">
        <p className="city-panel-route">Tunis → {city}</p>
        {error && <p className="city-panel-line">{error}</p>}
        {!error && (
          <dl className="city-panel-offer">
            <div>
              <dt>Vol aller</dt>
              <dd>{offer ? `dès ${formatBudget(offer.flightFrom)}` : "…"}</dd>
            </div>
            <div>
              <dt>Hôtel</dt>
              <dd>{offer ? `dès ${formatBudget(offer.hotelFrom)} la nuit` : "…"}</dd>
            </div>
          </dl>
        )}
        {offer && (
          <p className="city-panel-line">
            {offer.flights} vols et {offer.hotels} hôtels dans le catalogue de décembre et janvier.
          </p>
        )}
        <Link to={`/planifier?destination=${encodeURIComponent(city)}`} className="primary">
          Planifier {city}
        </Link>
      </div>
    </section>
  );
}

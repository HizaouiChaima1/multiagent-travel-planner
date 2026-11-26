import { Link } from "react-router-dom";
import { PHOTOS } from "../content/photos.js";

/** Six destinations en grand, chacune ouvre le formulaire avec la ville déjà choisie. */
export default function CityStrip() {
  return (
    <section className="strip" id="destinations" aria-labelledby="strip-title">
      <h2 id="strip-title" data-reveal>
        Douze villes au départ de Tunis
      </h2>
      <ul>
        {Object.values(PHOTOS).map((photo) => (
          <li key={photo.city} data-reveal>
            <Link to={`/planifier?destination=${encodeURIComponent(photo.city)}`}>
              <img src={photo.src} alt={photo.alt} loading="lazy" />
              <span className="strip-city">{photo.city}</span>
              <span className="strip-place">{photo.place}</span>
            </Link>
          </li>
        ))}
      </ul>
    </section>
  );
}

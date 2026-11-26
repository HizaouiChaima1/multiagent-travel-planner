import { Link } from "react-router-dom";
import "./PhotoPanel.css";

/** Panneau sombre avec la photo d'une destination, son nom et le crédit du photographe. */
export default function PhotoPanel({ photo }) {
  return (
    <aside className="photo-panel">
      <Link to="/" className="brand">
        Travel Planner
      </Link>
      <figure>
        <div className="photo-frame">
          <img src={photo.src} alt={photo.alt} />
        </div>
        <figcaption>
          <p className="photo-city">{photo.city}</p>
          <p className="photo-place">{photo.place}</p>
          <p className="photo-promise">
            Des agents préparent vos vols, votre hôtel et un programme jour par jour, dans votre
            budget.
          </p>
          <a className="photo-credit" href={photo.source} target="_blank" rel="noreferrer">
            Photo : {photo.credit}
          </a>
        </figcaption>
      </figure>
    </aside>
  );
}

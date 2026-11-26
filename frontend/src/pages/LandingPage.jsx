import { Suspense, lazy, useCallback, useRef, useState } from "react";
import { Link } from "react-router-dom";
import { useAuth } from "../auth/AuthContext.jsx";
import DestinationList from "../components/DestinationList.jsx";
import { GLOBE_MASK_CREDIT, PHOTOS } from "../content/photos.js";
import AgentsSection from "../landing/AgentsSection.jsx";
import BudgetSection from "../landing/BudgetSection.jsx";
import CityPanel from "../landing/CityPanel.jsx";
import CityStrip from "../landing/CityStrip.jsx";
import { DESTINATIONS } from "../landing/globe/cities.js";
import { useReveal } from "../landing/useReveal.js";
import "../landing/landing.css";

// three.js n'est chargé que sur la page d'accueil.
const Globe = lazy(() => import("../landing/globe/Globe.jsx"));
const CITY_NAMES = DESTINATIONS.map((city) => city.name);

export default function LandingPage() {
  const { user } = useAuth();
  const [city, setCity] = useState("Rome");
  const [webgl, setWebgl] = useState(true);
  const pageRef = useRef(null);
  const disableGlobe = useCallback(() => setWebgl(false), []);
  useReveal(pageRef);

  const start = user ? "/planifier" : "/inscription";

  return (
    <div className="landing" ref={pageRef}>
      <header className="landing-bar">
        <Link to="/" className="brand">
          Travel Planner
        </Link>
        <nav aria-label="Sections">
          <a href="#agents">Les agents</a>
          <a href="#destinations">Destinations</a>
        </nav>
        {user ? (
          <Link to="/voyages" className="landing-account">
            Mes voyages
          </Link>
        ) : (
          <Link to="/connexion" className="landing-account">
            Se connecter
          </Link>
        )}
      </header>

      <section className="hero" aria-labelledby="hero-title">
        <div className="hero-text">
          <h1 id="hero-title">Trois agents préparent votre voyage</h1>
          <p className="hero-lead">
            Vols au départ de Tunis, hôtel et programme jour par jour, calculés pour tenir dans
            votre budget.
          </p>
          <div className="hero-actions">
            <Link to={start} className="primary">
              Planifier un voyage
            </Link>
          </div>
          <p className="hero-pick">Choisissez une ville, sur le globe ou ici :</p>
          <DestinationList cities={CITY_NAMES} selected={city} onSelect={setCity} />
        </div>
        <div className="hero-globe">
          {webgl && (
            <Suspense fallback={null}>
              <Globe selected={city} onSelect={setCity} onUnsupported={disableGlobe} />
            </Suspense>
          )}
          <CityPanel city={city} />
        </div>
      </section>

      <AgentsSection />
      <CityStrip />
      <BudgetSection />

      <section className="closing" aria-labelledby="closing-title">
        <h2 id="closing-title" data-reveal>
          Votre prochain départ de Tunis
        </h2>
        <Link to={start} className="primary" data-reveal>
          Planifier un voyage
        </Link>
      </section>

      <footer className="landing-footer">
        <p className="footer-name">Travel Planner</p>
        <p>Projet Scrum ISAMM, 3e année. Données de vols, d'hôtels et d'activités simulées.</p>
        <ul className="footer-credits" aria-label="Crédits photo">
          {Object.values(PHOTOS).map((photo) => (
            <li key={photo.city}>
              <a href={photo.source} target="_blank" rel="noreferrer">
                {photo.city} : {photo.credit}
              </a>
            </li>
          ))}
          <li>
            <a href={GLOBE_MASK_CREDIT.source} target="_blank" rel="noreferrer">
              {GLOBE_MASK_CREDIT.label}
            </a>
          </li>
        </ul>
      </footer>
    </div>
  );
}

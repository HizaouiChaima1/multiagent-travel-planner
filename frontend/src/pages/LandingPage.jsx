import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { Link } from "react-router-dom";
import gsap from "gsap";
import { useAuth } from "../auth/AuthContext.jsx";
import { EARTH_CREDIT, PHOTOS } from "../content/photos.js";
import {
  AgentsChapter,
  BudgetChapter,
  DepartChapter,
  DestinationsChapter,
  FinChapter,
  PlannerChapter,
  ProgrammeChapter,
  RequestChapter,
} from "../landing/cinema/Chapters.jsx";
import Loader from "../landing/cinema/Loader.jsx";
import Stage from "../landing/cinema/Stage.jsx";
import { useSmoothScroll } from "../landing/cinema/useSmoothScroll.js";
import { useStory } from "../landing/cinema/useStory.js";
import "../landing/cinema/cinema.css";

export default function LandingPage() {
  const { user } = useAuth();
  const rootRef = useRef(null);
  const [city, setCity] = useState("Rome");
  const [progress, setProgress] = useState(0);
  const [ready, setReady] = useState(false);
  const [webgl, setWebgl] = useState(true);

  // État partagé entre le scroll (qui l'écrit) et la scène 3D (qui le lit à chaque image).
  const state = useMemo(() => ({}), []);
  const interaction = useMemo(() => ({ enabled: false, dragLat: 0, dragLon: 0 }), []);
  interaction.selected = city;
  interaction.onSelect = setCity;

  const scrollTo = useSmoothScroll();
  useStory(rootRef, state);

  const handleReady = useCallback(() => setReady(true), []);
  const handleUnsupported = useCallback(() => {
    setWebgl(false);
    setReady(true);
  }, []);

  // La planète se lève une fois les textures chargées.
  useEffect(() => {
    if (!ready || window.matchMedia("(prefers-reduced-motion: reduce)").matches) return undefined;
    const intro = gsap.fromTo(state, { intro: 0.9 }, { intro: 0, duration: 2.6, ease: "power3.out" });
    return () => intro.kill();
  }, [ready, state]);

  const start = user ? "/planifier" : "/inscription";
  const classes = ["cinema", ready && "is-ready", !webgl && "no-webgl"].filter(Boolean).join(" ");

  return (
    <div className={classes} ref={rootRef}>
      <Loader progress={progress} done={ready} />
      {webgl && (
        <Stage
          state={state}
          interaction={interaction}
          onProgress={setProgress}
          onReady={handleReady}
          onUnsupported={handleUnsupported}
        />
      )}

      <header className="cinema-bar">
        <Link to="/" className="brand">
          Travel Planner
        </Link>
        <nav aria-label="Sections">
          <button type="button" onClick={() => scrollTo("#agents")}>
            Les agents
          </button>
          <button type="button" onClick={() => scrollTo("#destinations")}>
            Destinations
          </button>
        </nav>
        <Link to={user ? "/voyages" : "/connexion"} className="cinema-account">
          {user ? "Mes voyages" : "Se connecter"}
        </Link>
      </header>
      <div className="cinema-progress" aria-hidden="true">
        <span data-progress />
      </div>
      <p className="cinema-chapter" aria-hidden="true" data-chapter-label>
        Départ
      </p>

      <main className="story">
        <DepartChapter start={start} onDiscover={() => scrollTo("#agents")} />
        <AgentsChapter />
        <RequestChapter />
        <PlannerChapter />
        <ProgrammeChapter />
        <BudgetChapter />
        <DestinationsChapter city={city} onSelect={setCity} />
        <FinChapter start={start} />
      </main>

      <footer className="cinema-footer">
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
            <a href={EARTH_CREDIT.source} target="_blank" rel="noreferrer">
              {EARTH_CREDIT.label}
            </a>
          </li>
        </ul>
      </footer>
    </div>
  );
}

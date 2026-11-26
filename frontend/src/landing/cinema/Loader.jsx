/** Écran d'arrivée pendant le chargement des textures de la Terre. */
export default function Loader({ progress, done }) {
  return (
    <div className={done ? "loader is-done" : "loader"} aria-hidden="true">
      <p className="loader-place">
        Tunis-Carthage <span>36,81° N · 10,18° E</span>
      </p>
      <p className="loader-count">{String(Math.round(progress * 100)).padStart(2, "0")}</p>
      <div className="loader-bar">
        <span style={{ transform: `scaleX(${progress})` }} />
      </div>
    </div>
  );
}

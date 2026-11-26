import { Link } from "react-router-dom";
import "../styles/shell.css";

/** Mise en page des écrans de connexion et d'inscription : panneau sombre + formulaire. */
export default function AuthShell({ title, lead, footer, children }) {
  return (
    <div className="shell">
      <aside className="panel">
        <Link to="/" className="brand">
          Travel Planner
        </Link>
        <p className="promise">
          Des agents préparent vos vols, votre hôtel et un programme jour par jour, dans votre
          budget.
        </p>
      </aside>
      <main className="content">
        <div className="auth">
          <h1>{title}</h1>
          <p className="lead">{lead}</p>
          {children}
          <p className="auth-switch">{footer}</p>
        </div>
      </main>
    </div>
  );
}

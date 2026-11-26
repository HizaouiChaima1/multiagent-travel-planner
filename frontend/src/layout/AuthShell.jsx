import PhotoPanel from "../components/PhotoPanel.jsx";
import "../styles/shell.css";

/** Mise en page des écrans de connexion et d'inscription : photo d'une destination + formulaire. */
export default function AuthShell({ photo, title, lead, footer, children }) {
  return (
    <div className="shell">
      <PhotoPanel photo={photo} />
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

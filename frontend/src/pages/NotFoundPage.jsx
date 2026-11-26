import { Link } from "react-router-dom";

export default function NotFoundPage() {
  return (
    <main className="page">
      <h1>Page introuvable</h1>
      <p className="lead">Cette adresse ne mène nulle part.</p>
      <Link to="/" className="secondary">
        Revenir à l'accueil
      </Link>
    </main>
  );
}

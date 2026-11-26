import { Link, NavLink, Outlet } from "react-router-dom";
import { useAuth } from "../auth/AuthContext.jsx";
import "./AppLayout.css";

/** Barre du haut des écrans connectés : marque, navigation, compte et déconnexion. */
export default function AppLayout() {
  const { user, logout } = useAuth();

  return (
    <>
      <header className="topbar">
        <Link to="/" className="brand">
          Travel Planner
        </Link>
        <nav className="topbar-nav" aria-label="Navigation principale">
          <NavLink to="/planifier">Nouveau voyage</NavLink>
          <NavLink to="/voyages">Mes voyages</NavLink>
        </nav>
        <div className="topbar-account">
          <span className="topbar-email">{user.email}</span>
          <button type="button" className="topbar-logout" onClick={logout}>
            Se déconnecter
          </button>
        </div>
      </header>
      <Outlet />
    </>
  );
}

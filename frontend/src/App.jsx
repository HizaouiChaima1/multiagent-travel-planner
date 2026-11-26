import { Navigate, Route, Routes } from "react-router-dom";
import RequireAuth from "./auth/RequireAuth.jsx";
import AppLayout from "./layout/AppLayout.jsx";
import ItineraryPage from "./pages/ItineraryPage.jsx";
import LoginPage from "./pages/LoginPage.jsx";
import NotFoundPage from "./pages/NotFoundPage.jsx";
import PlannerPage from "./pages/PlannerPage.jsx";
import SignupPage from "./pages/SignupPage.jsx";
import TripsPage from "./pages/TripsPage.jsx";

export default function App() {
  return (
    <Routes>
      {/* La page d'accueil (globe) arrive à l'étape 4. */}
      <Route path="/" element={<Navigate to="/planifier" replace />} />
      <Route path="/connexion" element={<LoginPage />} />
      <Route path="/inscription" element={<SignupPage />} />
      <Route element={<RequireAuth />}>
        <Route element={<AppLayout />}>
          <Route path="/planifier" element={<PlannerPage />} />
          <Route path="/voyages" element={<TripsPage />} />
          <Route path="/voyages/:id" element={<ItineraryPage />} />
        </Route>
      </Route>
      <Route path="*" element={<NotFoundPage />} />
    </Routes>
  );
}

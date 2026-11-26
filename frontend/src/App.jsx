import { Route, Routes } from "react-router-dom";
import RequireAuth from "./auth/RequireAuth.jsx";
import AppLayout from "./layout/AppLayout.jsx";
import ItineraryPage from "./pages/ItineraryPage.jsx";
import LandingPage from "./pages/LandingPage.jsx";
import LoginPage from "./pages/LoginPage.jsx";
import NotFoundPage from "./pages/NotFoundPage.jsx";
import PlannerPage from "./pages/PlannerPage.jsx";
import SignupPage from "./pages/SignupPage.jsx";
import TripsPage from "./pages/TripsPage.jsx";

export default function App() {
  return (
    <Routes>
      <Route path="/" element={<LandingPage />} />
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

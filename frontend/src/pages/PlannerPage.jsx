import { useEffect, useState } from "react";
import { useNavigate, useSearchParams } from "react-router-dom";
import { fetchCities } from "../api/catalog.js";
import DestinationList from "../components/DestinationList.jsx";
import TripRequestForm from "../components/TripRequestForm.jsx";
import "../styles/shell.css";

/** US04 - saisie d'une demande de voyage ; les agents prennent le relais sur la page itinéraire. */
export default function PlannerPage() {
  const [cities, setCities] = useState([]);
  const [citiesError, setCitiesError] = useState("");
  // ?destination=Rome : ville choisie sur le globe de la page d'accueil.
  const [params] = useSearchParams();
  const [destination, setDestination] = useState(() => params.get("destination") ?? "");
  const navigate = useNavigate();

  useEffect(() => {
    fetchCities()
      .then(setCities)
      .catch((e) => setCitiesError(e.message));
  }, []);

  return (
    <div className="shell">
      <aside className="panel">
        <p className="promise">
          Des agents préparent vos vols, votre hôtel et un programme jour par jour, dans votre
          budget.
        </p>
        <DestinationList
          cities={cities}
          selected={destination}
          onSelect={setDestination}
        />
      </aside>

      <main className="content">
        <TripRequestForm
          cities={cities}
          destination={destination}
          onDestinationChange={setDestination}
          loadError={citiesError}
          onCreated={(trip) => navigate(`/voyages/${trip.id}`)}
        />
      </main>
    </div>
  );
}

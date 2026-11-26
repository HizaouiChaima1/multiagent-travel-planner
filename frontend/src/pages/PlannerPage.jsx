import { useEffect, useState } from "react";
import { fetchCities } from "../api/catalog.js";
import DestinationList from "../components/DestinationList.jsx";
import TripConfirmation from "../components/TripConfirmation.jsx";
import TripRequestForm from "../components/TripRequestForm.jsx";
import "../styles/shell.css";

/** US04 - saisie d'une demande de voyage. */
export default function PlannerPage() {
  const [cities, setCities] = useState([]);
  const [citiesError, setCitiesError] = useState("");
  const [destination, setDestination] = useState("");
  const [createdTrip, setCreatedTrip] = useState(null);

  useEffect(() => {
    fetchCities()
      .then(setCities)
      .catch((e) => setCitiesError(e.message));
  }, []);

  const startOver = () => {
    setCreatedTrip(null);
    setDestination("");
  };

  return (
    <div className="shell">
      <aside className="panel">
        <p className="promise">
          Des agents préparent vos vols, votre hôtel et un programme jour par jour, dans votre
          budget.
        </p>
        <DestinationList
          cities={cities}
          selected={createdTrip ? createdTrip.destination : destination}
          onSelect={setDestination}
          disabled={Boolean(createdTrip)}
        />
      </aside>

      <main className="content">
        {createdTrip ? (
          <TripConfirmation trip={createdTrip} onRestart={startOver} />
        ) : (
          <TripRequestForm
            cities={cities}
            destination={destination}
            onDestinationChange={setDestination}
            loadError={citiesError}
            onCreated={setCreatedTrip}
          />
        )}
      </main>
    </div>
  );
}

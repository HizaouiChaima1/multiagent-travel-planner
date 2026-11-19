import { useEffect, useState } from "react";
import { fetchCities, fetchTrips } from "./api.js";
import DestinationList from "./components/DestinationList.jsx";
import TripRequestForm from "./components/TripRequestForm.jsx";
import TripConfirmation from "./components/TripConfirmation.jsx";
import TripList from "./components/TripList.jsx";

export default function App() {
  const [cities, setCities] = useState([]);
  const [citiesError, setCitiesError] = useState("");
  const [destination, setDestination] = useState("");
  const [createdTrip, setCreatedTrip] = useState(null);
  const [trips, setTrips] = useState([]);
  const [tripsError, setTripsError] = useState("");

  const loadTrips = () =>
    fetchTrips()
      .then((list) => {
        setTrips(list);
        setTripsError("");
      })
      .catch((e) => setTripsError(e.message));

  useEffect(() => {
    fetchCities()
      .then(setCities)
      .catch((e) => setCitiesError(e.message));
    loadTrips();
  }, []);

  const handleCreated = (trip) => {
    setCreatedTrip(trip);
    loadTrips();
  };

  const startOver = () => {
    setCreatedTrip(null);
    setDestination("");
  };

  return (
    <div className="shell">
      <aside className="panel">
        <p className="brand">Travel Planner</p>
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
            onCreated={handleCreated}
          />
        )}
        <TripList trips={trips} error={tripsError} />
      </main>
    </div>
  );
}

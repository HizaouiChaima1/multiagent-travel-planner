import { useEffect, useState } from "react";
import { fetchTrips } from "../api/trips.js";
import TripList from "../components/TripList.jsx";

/** Historique des demandes de l'utilisateur connecté. */
export default function TripsPage() {
  const [trips, setTrips] = useState(null);
  const [error, setError] = useState("");

  useEffect(() => {
    fetchTrips()
      .then(setTrips)
      .catch((e) => setError(e.message));
  }, []);

  return (
    <main className="page">
      <TripList trips={trips ?? []} loading={trips === null && !error} error={error} />
    </main>
  );
}

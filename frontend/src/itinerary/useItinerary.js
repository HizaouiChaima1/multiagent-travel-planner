import { useCallback, useEffect, useState } from "react";
import { fetchLatestItinerary, generateItinerary } from "../api/itineraries.js";
import { fetchTrip } from "../api/trips.js";

/**
 * Charge le voyage et son dernier itinéraire ; lance les agents s'il n'y en a pas encore.
 * status : "loading" | "generating" | "ready" | "error"
 */
export function useItinerary(tripId) {
  const [trip, setTrip] = useState(null);
  const [itinerary, setItinerary] = useState(null);
  const [status, setStatus] = useState("loading");
  const [error, setError] = useState("");

  const generate = useCallback(async () => {
    setStatus("generating");
    setError("");
    try {
      setItinerary(await generateItinerary(tripId));
      setStatus("ready");
    } catch (e) {
      setError(e.message);
      setStatus("error");
    }
  }, [tripId]);

  useEffect(() => {
    let cancelled = false;
    setStatus("loading");
    fetchTrip(tripId)
      .then(async (loadedTrip) => {
        if (cancelled) return;
        setTrip(loadedTrip);
        try {
          const latest = await fetchLatestItinerary(tripId);
          if (cancelled) return;
          setItinerary(latest);
          setStatus("ready");
        } catch (e) {
          if (cancelled) return;
          if (e.status === 404) generate();
          else throw e;
        }
      })
      .catch((e) => {
        if (cancelled) return;
        setError(e.message);
        setStatus("error");
      });
    return () => {
      cancelled = true;
    };
  }, [tripId, generate]);

  return { trip, itinerary, status, error, generate };
}

import { useState } from "react";
import { createTrip } from "../api.js";
import { todayISO, validateTripRequest } from "../validation.js";

const INITIAL = { departureDate: "", returnDate: "", travelers: "1", budget: "" };
const MIN_TRAVELERS = 1;
const MAX_TRAVELERS = 10;

export default function TripRequestForm({
  cities,
  destination,
  onDestinationChange,
  loadError,
  onCreated,
}) {
  const [values, setValues] = useState(INITIAL);
  const [errors, setErrors] = useState({});
  const [serverError, setServerError] = useState("");
  const [submitting, setSubmitting] = useState(false);

  const clearError = (name) => setErrors((errs) => ({ ...errs, [name]: undefined }));

  const handleChange = (e) => {
    const { name, value } = e.target;
    setValues((v) => ({ ...v, [name]: value }));
    clearError(name);
  };

  const changeTravelers = (delta) => {
    const next = Math.min(
      MAX_TRAVELERS,
      Math.max(MIN_TRAVELERS, (Number(values.travelers) || MIN_TRAVELERS) + delta)
    );
    setValues((v) => ({ ...v, travelers: String(next) }));
    clearError("travelers");
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setServerError("");
    const found = validateTripRequest({ ...values, destination }, { cities });
    setErrors(found);
    if (Object.keys(found).length > 0) return;

    setSubmitting(true);
    try {
      onCreated(await createTrip({ ...values, destination }));
    } catch (err) {
      setServerError(err.message);
    } finally {
      setSubmitting(false);
    }
  };

  const describedBy = (name) => (errors[name] ? `${name}-error` : undefined);
  const invalid = (name) => (errors[name] ? "true" : "false");
  const fieldError = (name) =>
    errors[name] ? (
      <p className="error" id={`${name}-error`} role="alert">
        {errors[name]}
      </p>
    ) : null;

  return (
    <form className="form" onSubmit={handleSubmit} noValidate>
      <h1>Où partez-vous ?</h1>
      <p className="lead">Choisissez une destination, vos dates et votre budget.</p>

      <div className="field">
        <label htmlFor="destination">Destination</label>
        <input
          id="destination"
          name="destination"
          list="cities"
          autoComplete="off"
          placeholder="Choisissez une ville à gauche ou tapez-la"
          value={destination}
          onChange={(e) => {
            onDestinationChange(e.target.value);
            clearError("destination");
          }}
          aria-invalid={invalid("destination")}
          aria-describedby={describedBy("destination")}
        />
        <datalist id="cities">
          {cities.map((c) => (
            <option key={c} value={c} />
          ))}
        </datalist>
        {fieldError("destination")}
      </div>

      <div className="row">
        <div className="field">
          <label htmlFor="departureDate">Départ</label>
          <input
            id="departureDate"
            name="departureDate"
            type="date"
            min={todayISO()}
            value={values.departureDate}
            onChange={handleChange}
            aria-invalid={invalid("departureDate")}
            aria-describedby={describedBy("departureDate")}
          />
          {fieldError("departureDate")}
        </div>
        <div className="field">
          <label htmlFor="returnDate">Retour</label>
          <input
            id="returnDate"
            name="returnDate"
            type="date"
            min={values.departureDate || todayISO()}
            value={values.returnDate}
            onChange={handleChange}
            aria-invalid={invalid("returnDate")}
            aria-describedby={describedBy("returnDate")}
          />
          {fieldError("returnDate")}
        </div>
      </div>

      <div className="row">
        <div className="field">
          <label htmlFor="travelers">Voyageurs</label>
          <div className="stepper">
            <button
              type="button"
              aria-label="Retirer un voyageur"
              onClick={() => changeTravelers(-1)}
              disabled={Number(values.travelers) <= MIN_TRAVELERS}
            >
              −
            </button>
            <input
              id="travelers"
              name="travelers"
              type="number"
              inputMode="numeric"
              min={MIN_TRAVELERS}
              max={MAX_TRAVELERS}
              step="1"
              value={values.travelers}
              onChange={handleChange}
              aria-invalid={invalid("travelers")}
              aria-describedby={describedBy("travelers")}
            />
            <button
              type="button"
              aria-label="Ajouter un voyageur"
              onClick={() => changeTravelers(1)}
              disabled={Number(values.travelers) >= MAX_TRAVELERS}
            >
              +
            </button>
          </div>
          {fieldError("travelers")}
        </div>
        <div className="field">
          <label htmlFor="budget">Budget total</label>
          <div className="with-suffix">
            <input
              id="budget"
              name="budget"
              type="number"
              inputMode="decimal"
              min="1"
              step="any"
              placeholder="1500"
              value={values.budget}
              onChange={handleChange}
              aria-invalid={invalid("budget")}
              aria-describedby={describedBy("budget")}
            />
            <span aria-hidden="true">€</span>
          </div>
          {fieldError("budget")}
        </div>
      </div>

      {(serverError || loadError) && (
        <p className="error banner" role="alert">
          {serverError || loadError}
        </p>
      )}

      <button type="submit" className="primary" disabled={submitting}>
        {submitting ? "Envoi en cours" : "Lancer la planification"}
      </button>
    </form>
  );
}

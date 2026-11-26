/** Champ libellé + saisie + aide + erreur accessible (aria-invalid, aria-describedby). */
export default function FormField({ label, name, error, hint, ...inputProps }) {
  const errorId = `${name}-error`;
  const hintId = `${name}-hint`;
  const describedBy = [error && errorId, hint && hintId].filter(Boolean).join(" ") || undefined;

  return (
    <div className="field">
      <label htmlFor={name}>{label}</label>
      <input
        id={name}
        name={name}
        aria-invalid={error ? "true" : "false"}
        aria-describedby={describedBy}
        {...inputProps}
      />
      {hint && !error && (
        <p className="hint" id={hintId}>
          {hint}
        </p>
      )}
      {error && (
        <p className="error" id={errorId} role="alert">
          {error}
        </p>
      )}
    </div>
  );
}

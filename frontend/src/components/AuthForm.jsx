import { useState } from "react";
import { validateCredentials } from "../auth/validation.js";
import FormField from "./FormField.jsx";

const COPY = {
  login: { submit: "Se connecter", pending: "Connexion en cours" },
  signup: { submit: "Créer mon compte", pending: "Création en cours" },
};

/** Formulaire e-mail + mot de passe, partagé par la connexion et l'inscription. */
export default function AuthForm({ mode, onSubmit }) {
  const signup = mode === "signup";
  const [values, setValues] = useState({ email: "", password: "", confirm: "" });
  const [errors, setErrors] = useState({});
  const [serverError, setServerError] = useState("");
  const [submitting, setSubmitting] = useState(false);

  const handleChange = (e) => {
    const { name, value } = e.target;
    setValues((v) => ({ ...v, [name]: value }));
    setErrors((errs) => ({ ...errs, [name]: undefined }));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setServerError("");
    const found = validateCredentials(values, { signup });
    setErrors(found);
    if (Object.keys(found).length > 0) return;

    setSubmitting(true);
    try {
      await onSubmit(values.email.trim(), values.password);
    } catch (err) {
      setServerError(err.message);
      setSubmitting(false);
    }
  };

  const field = (name) => ({ name, value: values[name], onChange: handleChange, error: errors[name] });

  return (
    <form className="form" onSubmit={handleSubmit} noValidate>
      <FormField label="E-mail" type="email" autoComplete="email" {...field("email")} />
      <FormField
        label="Mot de passe"
        type="password"
        autoComplete={signup ? "new-password" : "current-password"}
        hint={signup ? "8 caractères minimum." : undefined}
        {...field("password")}
      />
      {signup && (
        <FormField
          label="Confirmer le mot de passe"
          type="password"
          autoComplete="new-password"
          {...field("confirm")}
        />
      )}

      {serverError && (
        <p className="error banner" role="alert">
          {serverError}
        </p>
      )}

      <button type="submit" className="primary" disabled={submitting}>
        {submitting ? COPY[mode].pending : COPY[mode].submit}
      </button>
    </form>
  );
}

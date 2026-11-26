// Mêmes règles que le backend (US01) : e-mail valide, mot de passe de 8 caractères minimum.
export const MIN_PASSWORD_LENGTH = 8;
const EMAIL_PATTERN = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

export function validateCredentials({ email, password, confirm }, { signup = false } = {}) {
  const errors = {};
  if (!EMAIL_PATTERN.test(email.trim())) {
    errors.email = "Saisissez une adresse e-mail valide.";
  }
  if (!password) {
    errors.password = "Saisissez votre mot de passe.";
  } else if (signup && password.length < MIN_PASSWORD_LENGTH) {
    errors.password = `Au moins ${MIN_PASSWORD_LENGTH} caractères.`;
  }
  if (signup && confirm !== password) {
    errors.confirm = "Les deux mots de passe ne correspondent pas.";
  }
  return errors;
}

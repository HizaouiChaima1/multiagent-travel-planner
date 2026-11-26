import { Link, Navigate, useNavigate } from "react-router-dom";
import { useAuth } from "../auth/AuthContext.jsx";
import AuthForm from "../components/AuthForm.jsx";
import AuthShell from "../layout/AuthShell.jsx";

export default function SignupPage() {
  const { user, register } = useAuth();
  const navigate = useNavigate();

  if (user) return <Navigate to="/planifier" replace />;

  return (
    <AuthShell
      title="Créer un compte"
      lead="Un e-mail et un mot de passe suffisent pour planifier votre premier voyage."
      footer={
        <>
          Déjà inscrit ? <Link to="/connexion">Se connecter</Link>
        </>
      }
    >
      <AuthForm
        mode="signup"
        onSubmit={async (email, password) => {
          await register(email, password);
          navigate("/planifier", { replace: true });
        }}
      />
    </AuthShell>
  );
}

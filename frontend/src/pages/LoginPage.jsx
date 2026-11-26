import { Link, Navigate, useLocation, useNavigate } from "react-router-dom";
import { useAuth } from "../auth/AuthContext.jsx";
import AuthForm from "../components/AuthForm.jsx";
import AuthShell from "../layout/AuthShell.jsx";

export default function LoginPage() {
  const { user, login } = useAuth();
  const navigate = useNavigate();
  const target = useLocation().state?.from ?? "/planifier";

  if (user) return <Navigate to={target} replace />;

  return (
    <AuthShell
      title="Se connecter"
      lead="Retrouvez vos voyages et vos itinéraires."
      footer={
        <>
          Pas encore de compte ? <Link to="/inscription">Créer un compte</Link>
        </>
      }
    >
      <AuthForm
        mode="login"
        onSubmit={async (email, password) => {
          await login(email, password);
          navigate(target, { replace: true });
        }}
      />
    </AuthShell>
  );
}

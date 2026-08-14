import { useState } from "react";
import { useNavigate, Link } from "react-router-dom";
import AuthLayout from "../components/auth/AuthLayout";
import FormField from "../components/auth/FormField";
import { useAuth } from "../context/AuthContext";

export default function LoginPage() {
  const { login, demoEmail, demoPassword } = useAuth();
  const navigate = useNavigate();

  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");

  const handleSubmit = (e) => {
    e.preventDefault();
    if (!email.trim() || !password) {
      setError("Enter your email ID and password.");
      return;
    }
    const ok = login(email, password);
    if (!ok) {
      setError("Invalid email or password.");
      return;
    }
    setError("");
    navigate("/", { replace: true });
  };

  return (
    <AuthLayout
      eyebrow="Welcome back"
      title="Login"
      footer={
        <>
          Don&apos;t have an account?{" "}
          <Link to="/register" className="font-medium text-accent hover:text-accent-hover">
            Register
          </Link>
        </>
      }
    >
      <form className="space-y-4" onSubmit={handleSubmit} noValidate>
        <FormField
          label="Email ID"
          type="email"
          placeholder="you@company.com"
          value={email}
          onChange={(e) => setEmail(e.target.value)}
          autoComplete="username"
        />
        <FormField
          label="Password"
          type="password"
          placeholder="••••••••"
          value={password}
          onChange={(e) => setPassword(e.target.value)}
          autoComplete="current-password"
        />

        {error && (
          <p className="rounded-md border border-priority-critical-bg bg-priority-critical-bg px-3 py-2 text-xs text-priority-critical">
            {error}
          </p>
        )}

        <button
          type="submit"
          className="w-full rounded-md bg-accent py-2.5 text-sm font-medium text-white transition-colors hover:bg-accent-hover"
        >
          Login
        </button>

        <p className="text-center text-xs text-text-muted">
          Demo credentials: {demoEmail} / {demoPassword}
        </p>
      </form>
    </AuthLayout>
  );
}

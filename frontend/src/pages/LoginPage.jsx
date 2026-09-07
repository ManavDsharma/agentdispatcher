import { useState } from "react";
import { useNavigate } from "react-router-dom";
import AuthLayout from "../components/auth/AuthLayout";
import FormField from "../components/auth/FormField";
import { useAuth } from "../context/AuthContext";

export default function LoginPage() {
  const { login, demoUsername, demoPassword } = useAuth();
  const navigate = useNavigate();

  const [username, setUsername] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");

  const handleSubmit = (e) => {
    e.preventDefault();
    if (!username.trim() || !password) {
      setError("Enter your username and password.");
      return;
    }
    const ok = login(username, password);
    if (!ok) {
      setError("Invalid username or password.");
      return;
    }
    setError("");
    navigate("/", { replace: true });
  };

  return (
    <AuthLayout eyebrow="Welcome back" title="Login">
      <form className="space-y-4" onSubmit={handleSubmit} noValidate>
        <FormField
          label="Username"
          type="text"
          placeholder="temp"
          value={username}
          onChange={(e) => setUsername(e.target.value)}
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
          <p className="rounded-md border border-pill-critical-bg bg-pill-critical-bg px-3 py-2 text-xs text-pill-critical">
            {error}
          </p>
        )}

        <button
          type="submit"
          className="w-full rounded-md bg-brand py-2.5 text-sm font-medium text-white transition-colors hover:bg-brand-hover"
        >
          Login
        </button>

        <p className="text-center text-xs text-ink-muted">
          Demo credentials: {demoUsername} / {demoPassword}
        </p>
      </form>
    </AuthLayout>
  );
}

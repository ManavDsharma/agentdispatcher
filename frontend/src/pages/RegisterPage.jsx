import { useState } from "react";
import { useNavigate, Link } from "react-router-dom";
import AuthLayout from "../components/auth/AuthLayout";
import FormField from "../components/auth/FormField";

const EMAIL_RE = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

export default function RegisterPage() {
  const navigate = useNavigate();
  const [form, setForm] = useState({ name: "", email: "", password: "", confirm: "" });
  const [errors, setErrors] = useState({});
  const [success, setSuccess] = useState(false);

  const update = (field) => (e) => setForm((f) => ({ ...f, [field]: e.target.value }));

  const validate = () => {
    const next = {};
    if (!form.name.trim()) next.name = "Name is required.";
    if (!form.email.trim()) next.email = "Email is required.";
    else if (!EMAIL_RE.test(form.email.trim())) next.email = "Enter a valid email address.";
    if (!form.password) next.password = "Password is required.";
    else if (form.password.length < 8) next.password = "Use at least 8 characters.";
    if (!form.confirm) next.confirm = "Confirm your password.";
    else if (form.confirm !== form.password) next.confirm = "Passwords don't match.";
    return next;
  };

  const handleSubmit = (e) => {
    e.preventDefault();
    const next = validate();
    setErrors(next);
    if (Object.keys(next).length > 0) return;

    setSuccess(true);
    setTimeout(() => navigate("/login", { replace: true }), 1200);
  };

  return (
    <AuthLayout
      eyebrow="Get started"
      title="Register"
      footer={
        <>
          Already have an account?{" "}
          <Link to="/login" className="font-medium text-accent hover:text-accent-hover">
            Login
          </Link>
        </>
      }
    >
      {success ? (
        <p className="rounded-md border border-status-resolved-bg bg-status-resolved-bg px-3.5 py-3 text-sm text-status-resolved">
          Account created. Redirecting to login…
        </p>
      ) : (
        <form className="space-y-4" onSubmit={handleSubmit} noValidate>
          <FormField
            label="Name"
            placeholder="Jane Doe"
            value={form.name}
            onChange={update("name")}
            error={errors.name}
            autoComplete="name"
          />
          <FormField
            label="Email"
            type="email"
            placeholder="you@company.com"
            value={form.email}
            onChange={update("email")}
            error={errors.email}
            autoComplete="email"
          />
          <FormField
            label="Password"
            type="password"
            placeholder="At least 8 characters"
            value={form.password}
            onChange={update("password")}
            error={errors.password}
            autoComplete="new-password"
          />
          <FormField
            label="Confirm Password"
            type="password"
            placeholder="••••••••"
            value={form.confirm}
            onChange={update("confirm")}
            error={errors.confirm}
            autoComplete="new-password"
          />

          <button
            type="submit"
            className="w-full rounded-md bg-accent py-2.5 text-sm font-medium text-white transition-colors hover:bg-accent-hover"
          >
            Register
          </button>
        </form>
      )}
    </AuthLayout>
  );
}

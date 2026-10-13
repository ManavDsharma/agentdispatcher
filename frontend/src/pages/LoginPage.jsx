import {
  useState
} from "react";

import {
  Link,
  useNavigate
} from "react-router-dom";

import {
  ArrowRight,
  KeyRound,
  LockKeyhole
} from "lucide-react";

import {
  useAuth
} from "../context/AuthContext";

import AuthLayout
  from "../components/auth/AuthLayout";

import FormField
  from "../components/auth/FormField";


export default function LoginPage() {

  const navigate =
    useNavigate();

  const {
    login,
    completeNewPassword
  } = useAuth();


  const [
    email,
    setEmail
  ] = useState("");

  const [
    password,
    setPassword
  ] = useState("");

  const [
    newPassword,
    setNewPassword
  ] = useState("");

  const [
    confirmPassword,
    setConfirmPassword
  ] = useState("");

  const [
    challenge,
    setChallenge
  ] = useState(null);

  const [
    loading,
    setLoading
  ] = useState(false);

  const [
    error,
    setError
  ] = useState("");

  const [
    success,
    setSuccess
  ] = useState("");


  async function handleLogin(event) {

    event.preventDefault();

    setError("");
    setSuccess("");
    setLoading(true);


    try {

      const result =
        await login(
          email,
          password
        );


      if (
        result.requiresNewPassword
      ) {

        setChallenge(result);

        setSuccess(
          "This is your first login. Please create a new password."
        );

        return;
      }


      navigate("/");

    } catch (err) {

      setError(
        err.message ||
        "Unable to sign in."
      );

    } finally {

      setLoading(false);
    }
  }


  async function handleNewPassword(
    event
  ) {

    event.preventDefault();

    setError("");
    setSuccess("");


    if (
      newPassword.length < 8
    ) {

      setError(
        "Password must contain at least 8 characters."
      );

      return;
    }


    if (
      newPassword !==
      confirmPassword
    ) {

      setError(
        "Passwords do not match."
      );

      return;
    }


    setLoading(true);


    try {

      await completeNewPassword(
        challenge.username,
        challenge.challengeSession,
        newPassword
      );


      navigate("/");

    } catch (err) {

      setError(
        err.message ||
        "Unable to set the new password."
      );

    } finally {

      setLoading(false);
    }
  }


  if (challenge) {

    return (
      <AuthLayout>

        <div className="space-y-6">

          <div>

            <div className="mb-3 flex h-11 w-11 items-center justify-center rounded-xl bg-[#86bc25]/10 text-[#86bc25]">

              <KeyRound
                size={22}
              />

            </div>

            <h1 className="text-2xl font-semibold text-slate-900">
              Create your password
            </h1>

            <p className="mt-2 text-sm text-slate-500">
              Your account was approved. You are using a temporary password provided in your access email. Please create a permanent password to continue.
            </p>

          </div>


          {error && (
            <div className="rounded-lg border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700">
              {error}
            </div>
          )}


          <form
            onSubmit={
              handleNewPassword
            }
            className="space-y-5"
          >

            <FormField
              label="New password"
              type="password"
              value={
                newPassword
              }
              onChange={(e) =>
                setNewPassword(
                  e.target.value
                )
              }
              placeholder="Enter new password"
              required
            />

            <FormField
              label="Confirm password"
              type="password"
              value={
                confirmPassword
              }
              onChange={(e) =>
                setConfirmPassword(
                  e.target.value
                )
              }
              placeholder="Confirm new password"
              required
            />


            <button
              type="submit"
              disabled={loading}
              className="flex w-full items-center justify-center gap-2 rounded-lg bg-[#86bc25] px-4 py-3 text-sm font-semibold text-black transition hover:bg-[#76a91f] disabled:cursor-not-allowed disabled:opacity-60"
            >

              {loading
                ? "Updating..."
                : "Set password"}

              {!loading && (
                <ArrowRight
                  size={17}
                />
              )}

            </button>

          </form>

        </div>

      </AuthLayout>
    );
  }


  return (
    <AuthLayout>

      <div className="space-y-6">

        <div>

          <div className="mb-3 flex h-11 w-11 items-center justify-center rounded-xl bg-[#86bc25]/10 text-[#86bc25]">

            <LockKeyhole
              size={22}
            />

          </div>

          <h1 className="text-2xl font-semibold text-slate-900">
            Sign in
          </h1>

          <p className="mt-2 text-sm text-slate-500">
            Sign in to access the DTP Operate Agent.
          </p>

        </div>


        {error && (
          <div className="rounded-lg border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700">
            {error}
          </div>
        )}


        {success && (
          <div className="rounded-lg border border-green-200 bg-green-50 px-4 py-3 text-sm text-green-700">
            {success}
          </div>
        )}


        <form
          onSubmit={handleLogin}
          className="space-y-5"
        >

          <FormField
            label="Email"
            type="email"
            value={email}
            onChange={(e) =>
              setEmail(
                e.target.value
              )
            }
            placeholder="you@company.com"
            required
          />

          <FormField
            label="Password"
            type="password"
            value={password}
            onChange={(e) =>
              setPassword(
                e.target.value
              )
            }
            placeholder="Enter password"
            required
          />


          <div className="flex justify-end">

            <Link
              to="/forgot-password"
              className="text-sm font-medium text-[#5f8518] hover:underline"
            >
              Forgot password?
            </Link>

          </div>


          <button
            type="submit"
            disabled={loading}
            className="flex w-full items-center justify-center gap-2 rounded-lg bg-[#86bc25] px-4 py-3 text-sm font-semibold text-black transition hover:bg-[#76a91f] disabled:cursor-not-allowed disabled:opacity-60"
          >

            {loading
              ? "Signing in..."
              : "Sign in"}

            {!loading && (
              <ArrowRight
                size={17}
              />
            )}

          </button>

        </form>


        <div className="border-t border-slate-200 pt-5 text-center text-sm text-slate-500">

          Don't have access?

          {" "}

          <Link
            to="/register"
            className="font-semibold text-[#5f8518] hover:underline"
          >
            Register for access
          </Link>

        </div>

      </div>

    </AuthLayout>
  );
}
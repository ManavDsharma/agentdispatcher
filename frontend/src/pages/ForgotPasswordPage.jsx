import {
  useState
} from "react";

import {
  Link
} from "react-router-dom";

import {
  ArrowLeft,
  CheckCircle2,
  KeyRound
} from "lucide-react";

import {
  requestPasswordReset,
  confirmPasswordReset
} from "../services/authService";

import AuthLayout
  from "../components/auth/AuthLayout";

import FormField
  from "../components/auth/FormField";


export default function ForgotPasswordPage() {

  const [
    email,
    setEmail
  ] = useState("");

  const [
    code,
    setCode
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
    step,
    setStep
  ] = useState("request");


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


  async function handleRequest(
    event
  ) {

    event.preventDefault();

    setError("");
    setSuccess("");
    setLoading(true);


    try {

      const result =
        await requestPasswordReset(
          email
        );

      setSuccess(
        result.message
      );

      setStep("waiting");

    } catch (err) {

      setError(
        err.message ||
        "Unable to submit reset request."
      );

    } finally {

      setLoading(false);
    }
  }


  async function handleConfirm(
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

      const result =
        await confirmPasswordReset({
          email,
          code,
          newPassword
        });


      setSuccess(
        result.message
      );

      setStep("complete");

    } catch (err) {

      setError(
        err.message ||
        "Unable to reset password."
      );

    } finally {

      setLoading(false);
    }
  }


  if (step === "complete") {

    return (
      <AuthLayout>

        <div className="text-center">

          <div className="mx-auto mb-5 flex h-14 w-14 items-center justify-center rounded-full bg-green-100 text-green-700">

            <CheckCircle2
              size={28}
            />

          </div>

          <h1 className="text-2xl font-semibold text-slate-900">
            Password updated
          </h1>

          <p className="mt-3 text-sm text-slate-500">
            Your password has been successfully changed.
          </p>

          <Link
            to="/login"
            className="mt-7 block w-full rounded-lg bg-[#86bc25] px-4 py-3 text-sm font-semibold text-center text-black"
          >
            Return to sign in
          </Link>

        </div>

      </AuthLayout>
    );
  }


  if (step === "waiting") {

    return (
      <AuthLayout>

        <div>

          <div className="mb-4 flex h-11 w-11 items-center justify-center rounded-xl bg-[#86bc25]/10 text-[#86bc25]">

            <KeyRound
              size={22}
            />

          </div>

          <h1 className="text-2xl font-semibold text-slate-900">
            Request submitted
          </h1>

          <p className="mt-3 text-sm leading-6 text-slate-500">
            Your password reset request will be sent to an administrator for approval. If approved, you will receive an email containing a temporary password and instructions to sign in.
          </p>


          {success && (
            <div className="mt-5 rounded-lg border border-green-200 bg-green-50 px-4 py-3 text-sm text-green-700">
              {success}
            </div>
          )}


          <button
            onClick={() =>
              setStep("confirm")
            }
            className="mt-6 w-full rounded-lg border border-slate-300 bg-white px-4 py-3 text-sm font-semibold text-slate-700 hover:bg-slate-50"
          >
            I have received my reset code
          </button>


          <Link
            to="/login"
            className="mt-4 flex items-center justify-center gap-2 text-sm text-slate-500 hover:text-slate-900"
          >
            <ArrowLeft
              size={16}
            />
            Back to sign in
          </Link>

        </div>

      </AuthLayout>
    );
  }


  if (step === "confirm") {

    return (
      <AuthLayout>

        <div>

          <h1 className="text-2xl font-semibold text-slate-900">
            Reset password
          </h1>

          <p className="mt-2 text-sm text-slate-500">
            Enter the verification code sent by Cognito and choose your new password.
          </p>


          {error && (
            <div className="mt-5 rounded-lg border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700">
              {error}
            </div>
          )}


          <form
            onSubmit={
              handleConfirm
            }
            className="mt-6 space-y-5"
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
              required
            />

            <FormField
              label="Verification code"
              value={code}
              onChange={(e) =>
                setCode(
                  e.target.value
                )
              }
              placeholder="Enter code"
              required
            />

            <FormField
              label="New password"
              type="password"
              value={newPassword}
              onChange={(e) =>
                setNewPassword(
                  e.target.value
                )
              }
              required
            />

            <FormField
              label="Confirm password"
              type="password"
              value={confirmPassword}
              onChange={(e) =>
                setConfirmPassword(
                  e.target.value
                )
              }
              required
            />


            <button
              type="submit"
              disabled={loading}
              className="w-full rounded-lg bg-[#86bc25] px-4 py-3 text-sm font-semibold text-black disabled:opacity-60"
            >
              {loading
                ? "Updating..."
                : "Reset password"}
            </button>

          </form>

        </div>

      </AuthLayout>
    );
  }


  return (
    <AuthLayout>

      <div>

        <Link
          to="/login"
          className="mb-6 inline-flex items-center gap-2 text-sm text-slate-500 hover:text-slate-900"
        >
          <ArrowLeft
            size={16}
          />
          Back to sign in
        </Link>


        <div className="mb-6">

          <div className="mb-3 flex h-11 w-11 items-center justify-center rounded-xl bg-[#86bc25]/10 text-[#86bc25]">

            <KeyRound
              size={22}
            />

          </div>

          <h1 className="text-2xl font-semibold text-slate-900">
            Forgot password?
          </h1>

          <p className="mt-2 text-sm text-slate-500">
            Submit a password reset request for administrator approval.
          </p>

        </div>


        {error && (
          <div className="mb-5 rounded-lg border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700">
            {error}
          </div>
        )}


        <form
          onSubmit={handleRequest}
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

          <button
            type="submit"
            disabled={loading}
            className="w-full rounded-lg bg-[#86bc25] px-4 py-3 text-sm font-semibold text-black disabled:opacity-60"
          >
            {loading
              ? "Submitting..."
              : "Request password reset"}
          </button>

        </form>

      </div>

    </AuthLayout>
  );
}
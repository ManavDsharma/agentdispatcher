import {
  useState
} from "react";

import {
  Link,
  useNavigate
} from "react-router-dom";

import {
  ArrowLeft,
  CheckCircle2,
  UserPlus
} from "lucide-react";

import {
  registerUser
} from "../services/authService";

import AuthLayout
  from "../components/auth/AuthLayout";

import FormField
  from "../components/auth/FormField";


export default function RegisterPage() {

  const navigate =
    useNavigate();


  const [
    firstName,
    setFirstName
  ] = useState("");

  const [
    lastName,
    setLastName
  ] = useState("");

  const [
    email,
    setEmail
  ] = useState("");

  const [
    accessType,
    setAccessType
  ] = useState("");


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
  ] = useState(false);


  async function handleSubmit(
    event
  ) {

    event.preventDefault();

    setError("");

    if (!accessType) {

      setError(
        "Please select an access type."
      );

      return;
    }

    setLoading(true);


    try {

      await registerUser({
        firstName,
        lastName,
        email,
        accessType
      });

      setSuccess(true);

    } catch (err) {

      setError(
        err.message ||
        "Unable to submit registration."
      );

    } finally {

      setLoading(false);
    }
  }


  if (success) {

    return (
      <AuthLayout>

        <div className="text-center">

          <div className="mx-auto mb-5 flex h-14 w-14 items-center justify-center rounded-full bg-green-100 text-green-700">

            <CheckCircle2
              size={28}
            />

          </div>

          <h1 className="text-2xl font-semibold text-slate-900">
            Request submitted
          </h1>

          <p className="mt-3 text-sm leading-6 text-slate-500">
            Your access request has been submitted successfully. An administrator will review your request. If approved, you will receive an email with your temporary login credentials.
          </p>

          <button
            onClick={() =>
              navigate("/login")
            }
            className="mt-7 w-full rounded-lg bg-[#86bc25] px-4 py-3 text-sm font-semibold text-black hover:bg-[#76a91f]"
          >
            Return to sign in
          </button>

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

            <UserPlus
              size={22}
            />

          </div>

          <h1 className="text-2xl font-semibold text-slate-900">
            Request access
          </h1>

          <p className="mt-2 text-sm text-slate-500">
            Submit your details and an administrator will review your request.
          </p>

        </div>


        {error && (
          <div className="mb-5 rounded-lg border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700">
            {error}
          </div>
        )}


        <form
          onSubmit={handleSubmit}
          className="space-y-5"
        >

          <div className="grid grid-cols-2 gap-4">

            <FormField
              label="First name"
              value={firstName}
              onChange={(e) =>
                setFirstName(
                  e.target.value
                )
              }
              placeholder="First name"
              required
            />

            <FormField
              label="Last name"
              value={lastName}
              onChange={(e) =>
                setLastName(
                  e.target.value
                )
              }
              placeholder="Last name"
              required
            />

          </div>


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


          <div>

            <label className="mb-2 block text-sm font-medium text-slate-700">
              Access type
            </label>

            <select
              value={accessType}
              onChange={(e) =>
                setAccessType(
                  e.target.value
                )
              }
              required
              className="w-full rounded-lg border border-slate-300 bg-white px-3 py-3 text-sm outline-none transition focus:border-[#86bc25] focus:ring-2 focus:ring-[#86bc25]/20"
            >

              <option value="">
                Select access type
              </option>

              <option value="Admin">
                Admin
              </option>

              <option value="L1">
                L1
              </option>

              <option value="L2">
                L2
              </option>

              <option value="Operate Lead">
                Operate Lead
              </option>

            </select>

          </div>


          <button
            type="submit"
            disabled={loading}
            className="w-full rounded-lg bg-[#86bc25] px-4 py-3 text-sm font-semibold text-black hover:bg-[#76a91f] disabled:opacity-60"
          >
            {loading
              ? "Submitting..."
              : "Submit access request"}
          </button>

        </form>

      </div>

    </AuthLayout>
  );
}
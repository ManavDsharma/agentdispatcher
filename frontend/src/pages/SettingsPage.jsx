
import { useAuth } from "../context/AuthContext";
import Topbar from "../components/layout/Topbar";

export default function SettingsPage() {
  const { user, logout } = useAuth();

  return (
    <div className="min-h-screen bg-[#f7f8f5]">
      <Topbar
        title="Settings"
        action={null}
      />

      <main className="p-6">
        <div className="max-w-2xl rounded-xl border border-slate-200 bg-white p-6 shadow-sm">
          <h2 className="text-lg font-semibold text-slate-900">
            Account
          </h2>

          <p className="mt-1 text-sm text-slate-500">
            Manage your DTP Operate Agent account
          </p>

          <div className="mt-6 space-y-4">
            <Info
              label="Name"
              value={user?.name}
            />

            <Info
              label="Email"
              value={user?.email}
            />

            <Info
              label="Access Type"
              value={user?.accessType}
            />

            <Info
              label="Cognito Group"
              value={user?.cognitoGroup}
            />

            <Info
              label="Account Status"
              value={user?.status}
            />
          </div>

          <div className="mt-8 border-t border-slate-200 pt-6">
            <button
              type="button"
              onClick={logout}
              className="rounded-lg border border-red-200 bg-white px-4 py-2.5 text-sm font-semibold text-red-700 transition hover:bg-red-50"
            >
              Sign out
            </button>
          </div>
        </div>
      </main>
    </div>
  );
}

function Info({ label, value }) {
  return (
    <div className="flex items-center justify-between border-b border-slate-100 pb-3">
      <span className="text-sm text-slate-500">
        {label}
      </span>

      <span className="text-right text-sm font-medium text-slate-900">
        {value || "-"}
      </span>
    </div>
  );
}
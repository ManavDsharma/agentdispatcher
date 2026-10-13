import {
  useEffect,
  useMemo,
  useState
} from "react";

import {
  Check,
  KeyRound,
  RefreshCw,
  ShieldCheck,
  X
} from "lucide-react";

import {
  getAdminUsers,
  adminUserAction
} from "../services/adminService";

import {
  Topbar
} from "../components/layout/Topbar";


function formatDate(value) {

  if (!value) {
    return "-";
  }

  try {

    return new Date(
      value
    ).toLocaleString();

  } catch {

    return value;
  }
}


function StatusBadge({
  status
}) {

  const styles = {

    PENDING:
      "bg-amber-50 text-amber-700 border-amber-200",

    APPROVED:
      "bg-green-50 text-green-700 border-green-200",

    REJECTED:
      "bg-red-50 text-red-700 border-red-200",

    CODE_SENT:
      "bg-blue-50 text-blue-700 border-blue-200",

    COMPLETED:
      "bg-green-50 text-green-700 border-green-200",

    NONE:
      "bg-slate-50 text-slate-600 border-slate-200"
  };


  return (
    <span
      className={`inline-flex rounded-full border px-2.5 py-1 text-xs font-medium ${
        styles[status] ||
        styles.NONE
      }`}
    >
      {status || "NONE"}
    </span>
  );
}


export default function AdminControlPage() {

  const [
    users,
    setUsers
  ] = useState([]);

  const [
    loading,
    setLoading
  ] = useState(true);

  const [
    actionLoading,
    setActionLoading
  ] = useState("");

  const [
    error,
    setError
  ] = useState("");

  const [
    activeTab,
    setActiveTab
  ] = useState("access");


  async function loadUsers() {

    setLoading(true);
    setError("");

    try {

      const result =
        await getAdminUsers();

      setUsers(
        result.users || []
      );

    } catch (err) {

      setError(
        err.message ||
        "Unable to load admin data."
      );

    } finally {

      setLoading(false);
    }
  }


  useEffect(() => {

    loadUsers();

  }, []);


  async function handleAction(
    email,
    action
  ) {

    const messageMap = {

      APPROVE:
        "Approve this access request?",

      REJECT:
        "Reject this access request?",

      RESET_APPROVE:
        "Approve this password reset request?",

      RESET_REJECT:
        "Reject this password reset request?"
    };


    if (
      !window.confirm(
        messageMap[action]
      )
    ) {
      return;
    }


    const key =
      `${action}:${email}`;

    setActionLoading(key);
    setError("");


    try {

      await adminUserAction(
        email,
        action
      );

      await loadUsers();

    } catch (err) {

      setError(
        err.message ||
        "Unable to perform action."
      );

    } finally {

      setActionLoading("");
    }
  }


  const pendingAccess =
    useMemo(
      () =>
        users.filter(
          user =>
            user.status ===
            "PENDING"
        ),
      [users]
    );


  const pendingReset =
    useMemo(
      () =>
        users.filter(
          user =>
            user.passwordResetStatus ===
            "PENDING"
        ),
      [users]
    );


  return (
    <div className="min-h-screen bg-[#f7f8f5]">

      <Topbar
        title="Admin Control"
        subtitle="Manage user access and password reset requests"
      />


      <main className="p-6">

        <div className="mb-6 flex items-center justify-between">

          <div>

            <div className="flex items-center gap-2">

              <ShieldCheck
                size={22}
                className="text-[#86bc25]"
              />

              <h1 className="text-xl font-semibold text-slate-900">
                Access Administration
              </h1>

            </div>

            <p className="mt-1 text-sm text-slate-500">
              Review registration and password reset requests.
            </p>

          </div>


          <button
            onClick={loadUsers}
            disabled={loading}
            className="inline-flex items-center gap-2 rounded-lg border border-slate-300 bg-white px-3 py-2 text-sm font-medium text-slate-700 hover:bg-slate-50"
          >

            <RefreshCw
              size={16}
              className={
                loading
                  ? "animate-spin"
                  : ""
              }
            />

            Refresh

          </button>

        </div>


        {error && (
          <div className="mb-5 rounded-lg border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700">
            {error}
          </div>
        )}


        <div className="mb-5 flex gap-2 border-b border-slate-200">

          <button
            onClick={() =>
              setActiveTab("access")
            }
            className={`border-b-2 px-4 py-3 text-sm font-medium ${
              activeTab === "access"
                ? "border-[#86bc25] text-slate-900"
                : "border-transparent text-slate-500"
            }`}
          >
            Access Requests
            {" "}
            ({pendingAccess.length})
          </button>


          <button
            onClick={() =>
              setActiveTab("reset")
            }
            className={`border-b-2 px-4 py-3 text-sm font-medium ${
              activeTab === "reset"
                ? "border-[#86bc25] text-slate-900"
                : "border-transparent text-slate-500"
            }`}
          >
            Password Reset
            {" "}
            ({pendingReset.length})
          </button>

        </div>


        <div className="overflow-hidden rounded-xl border border-slate-200 bg-white shadow-sm">

          {loading ? (

            <div className="p-10 text-center text-sm text-slate-500">
              Loading requests...
            </div>

          ) : activeTab === "access" ? (

            <AccessTable
              users={users}
              actionLoading={
                actionLoading
              }
              onAction={
                handleAction
              }
            />

          ) : (

            <ResetTable
              users={users}
              actionLoading={
                actionLoading
              }
              onAction={
                handleAction
              }
            />

          )}

        </div>

      </main>

    </div>
  );
}


function AccessTable({
  users,
  actionLoading,
  onAction
}) {

  return (
    <div className="overflow-x-auto">

      <table className="w-full text-left">

        <thead className="bg-slate-50">

          <tr>

            <th className="px-5 py-3 text-xs font-semibold uppercase tracking-wide text-slate-500">
              User
            </th>

            <th className="px-5 py-3 text-xs font-semibold uppercase tracking-wide text-slate-500">
              Access
            </th>

            <th className="px-5 py-3 text-xs font-semibold uppercase tracking-wide text-slate-500">
              Status
            </th>

            <th className="px-5 py-3 text-xs font-semibold uppercase tracking-wide text-slate-500">
              Requested
            </th>

            <th className="px-5 py-3 text-right text-xs font-semibold uppercase tracking-wide text-slate-500">
              Actions
            </th>

          </tr>

        </thead>


        <tbody className="divide-y divide-slate-100">

          {users.map(
            user => {

              const pending =
                user.status ===
                "PENDING";


              return (
                <tr
                  key={user.email}
                  className="hover:bg-slate-50"
                >

                  <td className="px-5 py-4">

                    <div className="font-medium text-slate-900">
                      {user.name ||
                        `${user.firstName} ${user.lastName}`}
                    </div>

                    <div className="text-sm text-slate-500">
                      {user.email}
                    </div>

                  </td>


                  <td className="px-5 py-4">

                    <div className="font-medium text-slate-700">
                      {user.accessType}
                    </div>

                    <div className="text-xs text-slate-400">
                      {user.cognitoGroup}
                    </div>

                  </td>


                  <td className="px-5 py-4">
                    <StatusBadge
                      status={
                        user.status
                      }
                    />
                  </td>


                  <td className="px-5 py-4 text-sm text-slate-500">
                    {formatDate(
                      user.createdAt
                    )}
                  </td>


                  <td className="px-5 py-4">

                    {pending ? (

                      <div className="flex justify-end gap-2">

                        <button
                          onClick={() =>
                            onAction(
                              user.email,
                              "APPROVE"
                            )
                          }
                          disabled={
                            Boolean(
                              actionLoading
                            )
                          }
                          className="inline-flex items-center gap-1.5 rounded-lg bg-[#86bc25] px-3 py-2 text-xs font-semibold text-black hover:bg-[#76a91f] disabled:opacity-50"
                        >
                          <Check
                            size={14}
                          />
                          Approve
                        </button>


                        <button
                          onClick={() =>
                            onAction(
                              user.email,
                              "REJECT"
                            )
                          }
                          disabled={
                            Boolean(
                              actionLoading
                            )
                          }
                          className="inline-flex items-center gap-1.5 rounded-lg border border-red-200 bg-white px-3 py-2 text-xs font-semibold text-red-700 hover:bg-red-50 disabled:opacity-50"
                        >
                          <X
                            size={14}
                          />
                          Reject
                        </button>

                      </div>

                    ) : (

                      <div className="text-right text-xs text-slate-400">
                        No action
                      </div>

                    )}

                  </td>

                </tr>
              );
            }
          )}


          {users.length === 0 && (

            <tr>

              <td
                colSpan="5"
                className="px-5 py-10 text-center text-sm text-slate-500"
              >
                No users found.
              </td>

            </tr>

          )}

        </tbody>

      </table>

    </div>
  );
}


function ResetTable({
  users,
  actionLoading,
  onAction
}) {

  const requests =
    users.filter(
      user =>
        user.passwordResetStatus ===
        "PENDING"
    );


  return (
    <div className="overflow-x-auto">

      <table className="w-full text-left">

        <thead className="bg-slate-50">

          <tr>

            <th className="px-5 py-3 text-xs font-semibold uppercase tracking-wide text-slate-500">
              User
            </th>

            <th className="px-5 py-3 text-xs font-semibold uppercase tracking-wide text-slate-500">
              Account
            </th>

            <th className="px-5 py-3 text-xs font-semibold uppercase tracking-wide text-slate-500">
              Requested
            </th>

            <th className="px-5 py-3 text-right text-xs font-semibold uppercase tracking-wide text-slate-500">
              Actions
            </th>

          </tr>

        </thead>


        <tbody className="divide-y divide-slate-100">

          {requests.map(
            user => {

              const approveKey =
                `RESET_APPROVE:${user.email}`;

              const rejectKey =
                `RESET_REJECT:${user.email}`;


              return (
                <tr
                  key={user.email}
                  className="hover:bg-slate-50"
                >

                  <td className="px-5 py-4">

                    <div className="font-medium text-slate-900">
                      {user.name}
                    </div>

                    <div className="text-sm text-slate-500">
                      {user.email}
                    </div>

                  </td>


                  <td className="px-5 py-4">

                    <StatusBadge
                      status={
                        user.status
                      }
                    />

                  </td>


                  <td className="px-5 py-4 text-sm text-slate-500">
                    {formatDate(
                      user.passwordResetRequestedAt
                    )}
                  </td>


                  <td className="px-5 py-4">

                    <div className="flex justify-end gap-2">

                      <button
                        onClick={() =>
                          onAction(
                            user.email,
                            "RESET_APPROVE"
                          )
                        }
                        disabled={
                          Boolean(
                            actionLoading
                          )
                        }
                        className="inline-flex items-center gap-1.5 rounded-lg bg-[#86bc25] px-3 py-2 text-xs font-semibold text-black disabled:opacity-50"
                      >

                        <KeyRound
                          size={14}
                        />

                        Approve Reset

                      </button>


                      <button
                        onClick={() =>
                          onAction(
                            user.email,
                            "RESET_REJECT"
                          )
                        }
                        disabled={
                          Boolean(
                            actionLoading
                          )
                        }
                        className="inline-flex items-center gap-1.5 rounded-lg border border-red-200 bg-white px-3 py-2 text-xs font-semibold text-red-700 disabled:opacity-50"
                      >

                        <X
                          size={14}
                        />

                        Reject

                      </button>

                    </div>

                  </td>

                </tr>
              );
            }
          )}


          {requests.length === 0 && (

            <tr>

              <td
                colSpan="4"
                className="px-5 py-10 text-center text-sm text-slate-500"
              >
                No pending password reset requests.
              </td>

            </tr>

          )}

        </tbody>

      </table>

    </div>
  );
}
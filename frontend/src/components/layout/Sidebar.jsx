import { useEffect, useState } from "react";
import {
  Bot,
  LayoutDashboard,
  Settings,
  ShieldCheck,
  Database,
  Activity,
  ChevronRight,
  ChevronDown,
  LogOut,
} from "lucide-react";
import { NavLink } from "react-router-dom";

import { useAuth } from "../../context/AuthContext";
import {
  checkHealth,
  checkAgentHealth,
} from "../../services/healthService";

const NAV_ITEMS = [
  {
    label: "Tickets",
    to: "/",
    icon: LayoutDashboard,
  },
  {
    label: "AI Agent",
    to: "/ai-agent",
    icon: Bot,
  },
];

export default function Sidebar() {
  const { user, isAdmin, logout } = useAuth();

  const [dbStatus, setDbStatus] = useState("checking");
  const [agentStatus, setAgentStatus] = useState("checking");

  // System Status dropdown
  const [showSystemStatus, setShowSystemStatus] =
    useState(false);

  useEffect(() => {
    let mounted = true;

    const loadHealth = async () => {
      // ============================================================
      // DATABASE HEALTH
      // ============================================================

      try {
        const db = await checkHealth();

        if (mounted) {
          setDbStatus(
            db?.status === "ok" ||
              db?.status === "healthy" ||
              db?.healthy === true
              ? "online"
              : "offline"
          );
        }
      } catch {
        if (mounted) {
          setDbStatus("offline");
        }
      }

      // ============================================================
      // AI AGENT HEALTH
      // ============================================================

      try {
        const agent = await checkAgentHealth();

        if (mounted) {
          setAgentStatus(
            agent?.status === "ok" ||
              agent?.status === "healthy" ||
              agent?.healthy === true
              ? "online"
              : "offline"
          );
        }
      } catch {
        if (mounted) {
          setAgentStatus("offline");
        }
      }
    };

    loadHealth();

    const interval = setInterval(
      loadHealth,
      30000
    );

    return () => {
      mounted = false;
      clearInterval(interval);
    };
  }, []);

  // ============================================================
  // DISPLAY NAME
  // ============================================================

  const getDisplayName = () => {
    if (!user) {
      return "User";
    }

    if (user.name) {
      return user.name;
    }

    const fullName = [
      user.firstName,
      user.lastName,
    ]
      .filter(Boolean)
      .join(" ");

    return (
      fullName ||
      user.email ||
      "User"
    );
  };

  // ============================================================
  // ACCESS LEVEL
  // ============================================================

  const getAccessLabel = () => {
    if (!user) {
      return "";
    }

    if (user.accessType) {
      return user.accessType;
    }

    switch (user.cognitoGroup) {
      case "DTP_OPERATE_AGENT_ADMIN":
        return "Admin";

      case "DTP_OPERATE_AGENT_L1":
        return "L1";

      case "DTP_OPERATE_AGENT_L2":
        return "L2";

      case "DTP_OPERATE_AGENT_OPERATE_LEAD":
        return "Operate Lead";

      default:
        return "User";
    }
  };

  // ============================================================
  // STATUS CLASS
  // ============================================================

  const getStatusClass = (status) => {
    if (status === "online") {
      return "bg-emerald-500";
    }

    if (status === "offline") {
      return "bg-red-500";
    }

    return "bg-amber-400 animate-pulse";
  };

  return (
    <aside className="flex h-screen w-[260px] shrink-0 flex-col border-r border-slate-200 bg-[#111111] text-white">

      {/* ========================================================
          BRAND
      ======================================================== */}

      <div className="flex h-[72px] items-center border-b border-white/10 px-5">
        <div className="flex items-center gap-3">

          <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-[#86bc25]">
            <Bot
              size={23}
              strokeWidth={2.2}
              className="text-black"
            />
          </div>

          <div>
            <div className="text-[15px] font-semibold tracking-wide">
              DTP Operate
            </div>

            <div className="text-[11px] text-white/50">
              L1 Intelligent Agent
            </div>
          </div>

        </div>
      </div>

      {/* ========================================================
          USER PROFILE
      ======================================================== */}

      <div className="border-b border-white/10 px-4 py-4">
        <div className="flex items-center gap-3 rounded-xl bg-white/[0.06] px-3 py-3">

          <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-full bg-[#86bc25] text-sm font-bold text-black">
            {getDisplayName()
              .charAt(0)
              .toUpperCase()}
          </div>

          <div className="min-w-0 flex-1">

            <div className="truncate text-sm font-medium text-white">
              {getDisplayName()}
            </div>

            <div className="truncate text-[11px] text-white/45">
              {user?.email || ""}
            </div>

            <div className="mt-0.5 text-[10px] font-medium text-[#86bc25]">
              {getAccessLabel()}
            </div>

          </div>

        </div>
      </div>

      {/* ========================================================
          NAVIGATION
      ======================================================== */}

      <div className="flex-1 overflow-y-auto scrollbar-hide">

        {/* ======================================================
            WORKSPACE
        ====================================================== */}

        <div className="mb-2 px-3 text-[10px] font-semibold uppercase tracking-[0.12em] text-white/35">
          Workspace
        </div>

        <nav className="space-y-1">

          {NAV_ITEMS.map((item) => {
            const Icon = item.icon;

            return (
              <NavLink
                key={item.to}
                to={item.to}
                end={item.to === "/"}
                className={({ isActive }) =>
                  [
                    "group flex items-center gap-3 rounded-lg px-3 py-2.5 text-sm transition-all",

                    isActive
                      ? "bg-[#86bc25] font-medium text-black shadow-sm"
                      : "text-white/65 hover:bg-white/[0.06] hover:text-white",
                  ].join(" ")
                }
              >
                {({ isActive }) => (
                  <>
                    <Icon
                      size={18}
                      strokeWidth={
                        isActive
                          ? 2.3
                          : 1.8
                      }
                    />

                    <span className="flex-1">
                      {item.label}
                    </span>

                    {isActive && (
                      <ChevronRight
                        size={15}
                      />
                    )}
                  </>
                )}
              </NavLink>
            );
          })}

        </nav>

        {/* ========================================================
            ADMINISTRATION
        ======================================================== */}

        {isAdmin && (
          <div className="mt-7">

            <div className="mb-2 px-3 text-[10px] font-semibold uppercase tracking-[0.12em] text-white/35">
              Administration
            </div>

              <NavLink
                to="/admin-control"
                className={({ isActive }) =>
                  [
                    "group flex items-center gap-3 rounded-lg px-3 py-2.5 text-sm transition-all",

                    isActive
                      ? "bg-[#86bc25] font-medium text-black"
                      : "text-white/65 hover:bg-white/[0.06] hover:text-white",
                  ].join(" ")
                }
              >
                {({ isActive }) => (
                  <>
                    <ShieldCheck
                      size={18}
                      strokeWidth={
                        isActive
                          ? 2.3
                          : 1.8
                      }
                    />

                    <span className="flex-1">
                      Admin Control
                    </span>

                    {isActive && (
                      <ChevronRight
                        size={15}
                      />
                    )}
                  </>
                )}
              </NavLink>

          </div>
        )}

        {/* ========================================================
            SETTINGS
        ======================================================== */}

        <div className="mt-7">

          <NavLink
            to="/settings"
            className={({ isActive }) =>
              [
                "group flex items-center gap-3 rounded-lg px-3 py-2.5 text-sm transition-all",

                isActive
                  ? "bg-[#86bc25] font-medium text-black shadow-sm"
                  : "text-white/65 hover:bg-white/[0.06] hover:text-white",
              ].join(" ")
            }
          >
            {({ isActive }) => (
              <>
                <Settings
                  size={18}
                  strokeWidth={
                    isActive
                      ? 2.3
                      : 1.8
                  }
                />

                <span className="flex-1">
                  Settings
                </span>

                {isActive && (
                  <ChevronRight
                    size={15}
                  />
                )}
              </>
            )}
          </NavLink>

        </div>

        {/* ========================================================
            SYSTEM STATUS
        ======================================================== */}

        <div className="mt-5">

          {/* DROPDOWN HEADER */}

          <button
            type="button"
            onClick={() =>
              setShowSystemStatus(
                (previous) => !previous
              )
            }
            className="flex w-full items-center justify-between rounded-lg px-3 py-2.5 text-left text-sm text-white/65 transition-all hover:bg-white/[0.06] hover:text-white"
          >

            <div className="flex items-center gap-3">

              <Activity
                size={18}
                strokeWidth={1.8}
              />

              <span>
                System Status
              </span>

            </div>

            <ChevronDown
              size={16}
              strokeWidth={1.8}
              className={`transition-transform duration-200 ${
                showSystemStatus
                  ? "rotate-180"
                  : ""
              }`}
            />

          </button>

          {/* STATUS DETAILS */}

          {showSystemStatus && (
            <div className="mt-1 space-y-1 px-1">

              {/* DATABASE */}

              <div className="flex items-center gap-3 rounded-lg px-3 py-2">

                <div className="relative">

                  <Database
                    size={15}
                    className="text-white/45"
                    strokeWidth={1.8}
                  />

                  <span
                    className={`absolute -right-1 -top-1 h-2 w-2 rounded-full ${getStatusClass(
                      dbStatus
                    )}`}
                  />

                </div>

                <div className="min-w-0 flex-1">

                  <div className="text-xs text-white/65">
                    Database
                  </div>

                  <div className="text-[10px] capitalize text-white/35">
                    {dbStatus === "checking"
                      ? "Checking..."
                      : dbStatus}
                  </div>

                </div>

              </div>

              {/* AI AGENT */}

              <div className="flex items-center gap-3 rounded-lg px-3 py-2">

                <div className="relative">

                  <Activity
                    size={15}
                    className="text-white/45"
                    strokeWidth={1.8}
                  />

                  <span
                    className={`absolute -right-1 -top-1 h-2 w-2 rounded-full ${getStatusClass(
                      agentStatus
                    )}`}
                  />

                </div>

                <div className="min-w-0 flex-1">

                  <div className="text-xs text-white/65">
                    AI Agent
                  </div>

                  <div className="text-[10px] capitalize text-white/35">
                    {agentStatus === "checking"
                      ? "Checking..."
                      : agentStatus}
                  </div>

                </div>

              </div>

            </div>
          )}

        </div>

      </div>

      {/* ========================================================
          FOOTER / LOGOUT
      ======================================================== */}

      <div className="border-t border-white/10 p-3">

        <button
          type="button"
          onClick={logout}
          className="flex w-full items-center gap-3 rounded-lg px-3 py-2.5 text-sm text-white/55 transition hover:bg-white/[0.06] hover:text-white"
        >

          <LogOut
            size={17}
            strokeWidth={1.8}
          />

          <span>
            Sign out
          </span>

        </button>

        <div className="mt-3 px-3 text-[10px] text-white/25">
          DTP Operate Agent
        </div>

      </div>

    </aside>
  );
}

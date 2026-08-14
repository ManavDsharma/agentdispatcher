import { LogOut } from "lucide-react";
import Topbar from "../components/layout/Topbar";
import { useAuth } from "../context/AuthContext";

export default function SettingsPage() {
  const { logout } = useAuth();

  return (
    <>
      <Topbar eyebrow="Support Ops" title="Settings" />
      <main className="flex flex-1 flex-col items-start gap-4 p-8">
        <p className="text-sm text-text-muted">Nothing configurable yet.</p>
        <button
          onClick={logout}
          className="flex items-center gap-2 rounded-md border border-border bg-bg-surface px-4 py-2 text-sm font-medium text-text-secondary transition-colors hover:border-border-strong hover:text-text-primary"
        >
          <LogOut size={16} strokeWidth={1.75} />
          Log out
        </button>
      </main>
    </>
  );
}

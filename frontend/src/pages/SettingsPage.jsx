import Topbar from "../components/layout/Topbar";

export default function SettingsPage() {
  return (
    <>
      <Topbar eyebrow="Support Ops" title="Settings" />
      <main className="flex flex-1 flex-col items-start gap-4 bg-surface p-8">
        <p className="text-sm text-ink-muted">Nothing configurable yet.</p>
      </main>
    </>
  );
}

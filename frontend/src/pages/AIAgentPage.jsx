import Topbar from "../components/layout/Topbar";

export default function AIAgentPage() {
  return (
    <>
      <Topbar eyebrow="Support Ops" title="AI Agent" />
      <main className="flex flex-1 items-center justify-center bg-surface p-8">
        <p className="text-sm text-ink-muted">
          Chat interface arriving in a later phase.
        </p>
      </main>
    </>
  );
}

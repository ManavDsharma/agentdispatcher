import Topbar from "../components/layout/Topbar";

export default function AIAgentPage() {
  return (
    <>
      <Topbar eyebrow="Support Ops" title="AI Agent" />
      <main className="flex flex-1 items-center justify-center p-8">
        <p className="text-sm text-text-muted">
          Chat interface arriving in a later phase.
        </p>
      </main>
    </>
  );
}

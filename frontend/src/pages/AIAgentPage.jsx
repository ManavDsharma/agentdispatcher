import { useEffect, useMemo, useRef, useState } from "react";
import { Bot, RotateCcw, Send, User } from "lucide-react";
import Topbar from "../components/layout/Topbar";
import { createAgentSocket } from "../services/agentSocket";

const CAPABILITIES = [
  { label: "Bot failure diagnosis", example: "Why did the AP Invoice bot crash?" },
  { label: "Asset management", example: "Update the SAP credential asset" },
  { label: "Schedule control", example: "Trigger the EOD report schedule now" },
  { label: "Job management", example: "Restart the CRM data sync job" },
  { label: "Information queries", example: "List all currently running bots" },
];

const SUGGESTED_PROMPTS = [
  "List all running bots",
  "Why did the last bot fail?",
  "Show pending schedules",
  "List Orchestrator assets",
];

function newSessionId() {
  return crypto.randomUUID();
}

function introMessage() {
  return {
    id: "intro",
    role: "agent",
    content: null, // rendered specially below
  };
}

let messageId = 0;

function TypingDots() {
  return (
    <div className="flex items-center gap-1 px-1 py-1">
      {[0, 1, 2].map((i) => (
        <span
          key={i}
          className="h-1.5 w-1.5 animate-pulse rounded-full bg-ink-muted"
          style={{ animationDelay: `${i * 150}ms` }}
        />
      ))}
    </div>
  );
}

export default function AIAgentPage() {
  const [messages, setMessages] = useState([introMessage()]);
  const [input, setInput] = useState("");
  const [connected, setConnected] = useState(false);
  const [waiting, setWaiting] = useState(false);
  const [sessionId, setSessionId] = useState(newSessionId);

  const socketRef = useRef(null);
  const threadEndRef = useRef(null);

  useEffect(() => {
    const socket = createAgentSocket({
      onOpen: () => setConnected(true),
      onClose: () => setConnected(false),
      onError: () => setConnected(false),
      onMessage: (data) => {
        if (data.type !== "response") return;
        setWaiting(false);
        setMessages((prev) => [
          ...prev,
          { id: ++messageId, role: "agent", content: data.response, source: data.source },
        ]);
      },
    });
    socketRef.current = socket;
    return () => socket.close();
  }, [sessionId]);

  useEffect(() => {
    threadEndRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages, waiting]);

  const showSuggestions = useMemo(() => messages.length === 1, [messages]);

  const sendPrompt = (prompt) => {
    const text = prompt.trim();
    if (!text) return;

    setMessages((prev) => [...prev, { id: ++messageId, role: "user", content: text }]);
    setInput("");

    const sent = socketRef.current?.sendPrompt(text, sessionId);
    if (!sent) {
      setMessages((prev) => [
        ...prev,
        {
          id: ++messageId,
          role: "agent",
          content: "I'm not connected right now — try again in a moment.",
          source: "fallback",
        },
      ]);
      return;
    }
    setWaiting(true);
  };

  const handleReset = () => {
    setMessages([introMessage()]);
    setWaiting(false);
    setSessionId(newSessionId());
  };

  return (
    <>
      <Topbar
        eyebrow="Support Ops"
        title="AI Agent"
        action={
          <span
            className={`rounded-full px-3 py-1 text-xs font-medium ${
              connected ? "bg-brand-soft text-brand" : "bg-surface-muted text-ink-muted"
            }`}
          >
            {connected ? "dtp_agent" : "Offline"}
          </span>
        }
      />

      <main className="flex flex-1 flex-col overflow-hidden bg-surface">
        <div className="flex items-center justify-between border-b border-surface-border px-8 py-4">
          <div className="flex items-center gap-3">
            <div className="flex h-9 w-9 items-center justify-center rounded-full bg-brand-soft text-brand">
              <Bot size={18} strokeWidth={1.75} />
            </div>
            <div>
              <p className="text-sm font-semibold text-ink">AI Support Agent</p>
              <p className="text-xs text-ink-muted">
                {connected ? "Connected" : "Disconnected — messages will use a placeholder reply"}
              </p>
            </div>
          </div>
          <button
            onClick={handleReset}
            className="flex items-center gap-1.5 rounded-md px-3 py-1.5 text-xs font-medium text-ink-secondary transition-colors hover:bg-surface-hover hover:text-ink"
            title="Reset conversation"
          >
            <RotateCcw size={14} strokeWidth={1.75} />
            Reset
          </button>
        </div>

        <div className="flex-1 space-y-4 overflow-auto px-8 py-6">
          {messages.map((m) =>
            m.id === "intro" ? (
              <div key="intro" className="flex gap-3">
                <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full bg-brand-soft text-brand">
                  <Bot size={16} strokeWidth={1.75} />
                </div>
                <div className="max-w-xl rounded-lg rounded-tl-none border border-surface-border bg-surface-muted px-4 py-3 text-sm text-ink">
                  <p>Hello! I&apos;m your L1 Support AI Agent. I can help with:</p>
                  <ul className="mt-2 space-y-1">
                    {CAPABILITIES.map((c) => (
                      <li key={c.label}>
                        <span className="font-medium">{c.label}</span> —{" "}
                        <span className="text-ink-secondary">&quot;{c.example}&quot;</span>
                      </li>
                    ))}
                  </ul>
                  <p className="mt-2">How can I assist you today?</p>
                </div>
              </div>
            ) : (
              <div key={m.id} className={`flex gap-3 ${m.role === "user" ? "flex-row-reverse" : ""}`}>
                <div
                  className={`flex h-8 w-8 shrink-0 items-center justify-center rounded-full ${
                    m.role === "user" ? "bg-surface-muted text-ink-secondary" : "bg-brand-soft text-brand"
                  }`}
                >
                  {m.role === "user" ? <User size={16} strokeWidth={1.75} /> : <Bot size={16} strokeWidth={1.75} />}
                </div>
                <div
                  className={`max-w-xl rounded-lg px-4 py-3 text-sm ${
                    m.role === "user"
                      ? "rounded-tr-none bg-brand text-white"
                      : "rounded-tl-none border border-surface-border bg-surface-muted text-ink"
                  }`}
                >
                  {m.content}
                </div>
              </div>
            ),
          )}

          {waiting && (
            <div className="flex gap-3">
              <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full bg-brand-soft text-brand">
                <Bot size={16} strokeWidth={1.75} />
              </div>
              <div className="rounded-lg rounded-tl-none border border-surface-border bg-surface-muted px-3 py-2">
                <TypingDots />
              </div>
            </div>
          )}

          {showSuggestions && (
            <div className="ml-11 flex flex-wrap gap-2">
              {SUGGESTED_PROMPTS.map((prompt) => (
                <button
                  key={prompt}
                  onClick={() => sendPrompt(prompt)}
                  className="rounded-full border border-surface-border bg-surface px-3.5 py-1.5 text-xs font-medium text-ink-secondary transition-colors hover:border-brand hover:text-brand"
                >
                  {prompt}
                </button>
              ))}
            </div>
          )}

          <div ref={threadEndRef} />
        </div>

        <div className="border-t border-surface-border px-8 py-4">
          <form
            className="flex items-center gap-3"
            onSubmit={(e) => {
              e.preventDefault();
              sendPrompt(input);
            }}
          >
            <input
              value={input}
              onChange={(e) => setInput(e.target.value)}
              placeholder={connected ? "Type a message..." : "Connecting to agent..."}
              className="flex-1 rounded-md border border-surface-border bg-surface px-3.5 py-2.5 text-sm text-ink placeholder:text-ink-muted outline-none focus:border-brand"
            />
            <button
              type="submit"
              disabled={!input.trim()}
              className="flex h-10 w-10 shrink-0 items-center justify-center rounded-md bg-brand text-white transition-colors hover:bg-brand-hover disabled:opacity-50"
              aria-label="Send"
            >
              <Send size={16} strokeWidth={1.75} />
            </button>
          </form>
        </div>
      </main>
    </>
  );
}

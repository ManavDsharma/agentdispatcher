import { CheckCircle2 } from "lucide-react";

export default function ToastStack({ toasts }) {
  if (toasts.length === 0) return null;

  return (
    <div className="fixed bottom-6 right-6 z-50 flex flex-col gap-2">
      {toasts.map((toast) => (
        <div
          key={toast.id}
          className="flex items-start gap-2.5 rounded-md border border-surface-border bg-surface px-4 py-3 text-sm text-ink shadow-lg"
        >
          <CheckCircle2 size={16} className="mt-0.5 shrink-0 text-brand" strokeWidth={1.75} />
          <span>{toast.message}</span>
        </div>
      ))}
    </div>
  );
}

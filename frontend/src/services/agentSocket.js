import { BASE_URL } from "./apiClient";

const WS_URL = `${BASE_URL.replace(/^http/, "ws")}/ws/agent`;

// Thin wrapper around the native WebSocket so components never touch the
// transport directly — same convention as the fetch-based services.
export function createAgentSocket({ onMessage, onOpen, onClose, onError }) {
  const socket = new WebSocket(WS_URL);

  socket.onopen = () => onOpen?.();
  socket.onclose = () => onClose?.();
  socket.onerror = (event) => onError?.(event);
  socket.onmessage = (event) => {
    try {
      onMessage(JSON.parse(event.data));
    } catch {
      // ignore malformed frames rather than crashing the chat
    }
  };

  return {
    sendPrompt(prompt, sessionId) {
      if (socket.readyState === WebSocket.OPEN) {
        socket.send(JSON.stringify({ prompt, session_id: sessionId }));
        return true;
      }
      return false;
    },
    close() {
      socket.close();
    },
  };
}

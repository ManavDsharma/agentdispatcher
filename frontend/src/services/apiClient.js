const BASE_URL = import.meta.env.VITE_API_BASE_URL || "http://localhost:8010";

export async function apiGet(path) {
  const response = await fetch(`${BASE_URL}${path}`);
  if (!response.ok) {
    throw new Error(`Request to ${path} failed with status ${response.status}`);
  }
  return response.json();
}

export async function apiPost(path, body, { timeoutMs } = {}) {
  const controller = timeoutMs ? new AbortController() : null;
  const timer = timeoutMs
    ? setTimeout(() => controller.abort(), timeoutMs)
    : null;

  let response;
  try {
    response = await fetch(`${BASE_URL}${path}`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(body),
      signal: controller?.signal,
    });
  } catch (err) {
    if (err.name === "AbortError") {
      throw new Error(`Request to ${path} timed out`);
    }
    throw err;
  } finally {
    if (timer) clearTimeout(timer);
  }

  if (!response.ok) {
    const detail = await response.json().catch(() => null);
    throw new Error(
      detail?.detail ||
        `Request to ${path} failed with status ${response.status}`,
    );
  }
  return response.json();
}

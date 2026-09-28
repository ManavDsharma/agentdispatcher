import { apiGet } from "./apiClient";

export async function fetchHealth() {
  return apiGet("/api/health");
}

export async function fetchAgentHealth() {
  return apiGet("/api/agent/health");
}

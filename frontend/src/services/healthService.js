import { apiGet } from "./apiClient";

export async function fetchHealth() {
  return apiGet("/api/health");
}

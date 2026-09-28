import { apiGet } from "./apiClient";

export async function fetchCategorizationMatrix() {
  return apiGet("/api/reference/categorization-matrix");
}

export async function fetchRoster() {
  return apiGet("/api/reference/roster");
}

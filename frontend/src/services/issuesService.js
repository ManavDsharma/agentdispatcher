import { apiGet, apiPost } from "./apiClient";

export async function fetchIssues() {
  return apiGet("/api/issues");
}

export async function fetchIssueOptions() {
  return apiGet("/api/issues/options");
}

export async function createIssue(data) {
  return apiPost("/api/issues", data);
}

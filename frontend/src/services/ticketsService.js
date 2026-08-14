import { apiGet } from "./apiClient";

export async function fetchTickets() {
  return apiGet("/api/tickets");
}

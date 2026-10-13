import { apiGet, apiPatch } from "./apiClient";

export async function fetchTickets() {
  return apiGet("/api/tickets");
}

export async function updateTicket(ticketId, patch) {
  return apiPatch(`/api/tickets/${ticketId}`, patch);
}

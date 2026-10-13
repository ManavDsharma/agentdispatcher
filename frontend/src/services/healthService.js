import { apiGet } from "./apiClient";

/**
 * Check the health of the backend/database service.
 */
export async function checkHealth() {
  return apiGet("/api/health");
}

/**
 * Check the health of the AI Agent service.
 */
export async function checkAgentHealth() {
  return apiGet("/api/agent/health");
}

/**
 * Backward-compatible aliases.
 *
 * These allow existing components that use fetchHealth()
 * or fetchAgentHealth() to continue working.
 */
export const fetchHealth = checkHealth;
export const fetchAgentHealth = checkAgentHealth;

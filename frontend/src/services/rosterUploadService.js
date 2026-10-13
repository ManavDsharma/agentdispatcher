import { apiPost, apiPostForm } from "./apiClient";

export const ROSTER_ACCEPT = ".xlsx,.csv";
export const ROSTER_MAX_BYTES = 5 * 1024 * 1024;

// Cheap client-side pre-check so an obviously wrong file never leaves the
// browser. The backend repeats these checks and also inspects the content.
export function checkRosterFile(file) {
  const name = file.name.toLowerCase();
  if (!name.endsWith(".xlsx") && !name.endsWith(".csv")) {
    return "Only .xlsx and .csv files can be uploaded.";
  }
  if (file.size === 0) {
    return "That file is empty.";
  }
  if (file.size > ROSTER_MAX_BYTES) {
    return "That file is larger than 5 MB.";
  }
  return null;
}

// Validates only — nothing is written until commitRosterUpload.
export async function validateRosterUpload(file, uploadedBy) {
  const form = new FormData();
  form.append("file", file);
  form.append("uploaded_by", uploadedBy || "");
  return apiPostForm("/api/roster/uploads", form);
}

export async function commitRosterUpload(uploadId) {
  return apiPost(`/api/roster/uploads/${encodeURIComponent(uploadId)}/commit`);
}

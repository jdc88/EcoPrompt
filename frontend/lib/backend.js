/**
 * Python FastAPI base URL. Set in `.env.local`:
 * NEXT_PUBLIC_BACKEND_URL=http://localhost:8000
 */
export function getBackendUrl() {
  const url = process.env.NEXT_PUBLIC_BACKEND_URL;
  if (!url || typeof url !== "string") return "";
  return url.replace(/\/$/, "");
}

export function isBackendConfigured() {
  return Boolean(getBackendUrl());
}

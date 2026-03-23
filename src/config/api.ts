// Environment variable fallback and centralization for API URL
export const API_BASE_URL = import.meta.env.VITE_API_URL || '';

// Temporary debug logging to verify env is read correctly
console.log("API URL:", import.meta.env.VITE_API_URL);

// Safety fallback warning
if (!import.meta.env.VITE_API_URL) {
    console.warn("VITE_API_URL is not defined. API requests may fail or resolve to relative paths.");
}

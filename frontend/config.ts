// Dynamically resolve backend URL so the app works from both
// localhost (desktop) and LAN IP (phone testing).
// Backend always runs on port 3000.
const backendHost = window.location.hostname; // e.g. "localhost" or "192.168.1.86"
export const API_BASE = `http://${backendHost}:3000`;

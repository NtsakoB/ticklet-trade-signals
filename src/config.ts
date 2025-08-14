export const ALLOWED_EMAIL = "me@ticklet.ai";
export const IS_PROD = /(^|\\.)ticklet\\.dev$/.test(window.location.hostname);
export const REQUIRE_LOGIN = IS_PROD; // Preview bypasses auth
export const API_BASE = IS_PROD
  ? "https://api.ticklet.dev"
  : ((window as any).__API_BASE__ || "/");
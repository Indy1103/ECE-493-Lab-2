export const LOGIN_MESSAGES = {
  AUTHENTICATED: "Login successful.",
  INVALID_CREDENTIALS: "Invalid username or password.",
  ROLE_MAPPING_UNAVAILABLE:
    "Your account cannot be routed to a role home page. Contact support.",
  LOGIN_THROTTLED: "Too many failed login attempts. Please try again later.",
  AUTHENTICATION_UNAVAILABLE: "Authentication is temporarily unavailable. Please try again.",
  TLS_REQUIRED: "HTTPS is required for login requests."
} as const;

export const REGISTRATION_MESSAGES = {
  REGISTERED: "Account created successfully. You can now log in.",
  VALIDATION_FAILED: "Some registration information is invalid or missing.",
  DUPLICATE_EMAIL:
    "This email is already registered. Please use a different email address.",
  THROTTLED: "Too many failed registration attempts. Please try again later.",
  UNAVAILABLE: "Registration is temporarily unavailable. Please try again.",
  TLS_REQUIRED: "HTTPS is required for registration requests."
} as const;

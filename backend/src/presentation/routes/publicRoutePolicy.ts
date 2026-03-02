export const PUBLIC_REGISTRATION_ROUTE = "/api/public/registrations";

export function assertPublicRegistrationRoute(route: string): void {
  if (route !== PUBLIC_REGISTRATION_ROUTE) {
    throw new Error("Route must remain public for UC-02 registration flow.");
  }
}

const PUBLIC_ROUTES = new Set<string>([
  "/api/public/announcements",
  "/api/public/registrations",
  "/public/registration-prices"
]);

export function isPublicRoute(route: string): boolean {
  return PUBLIC_ROUTES.has(route);
}

export function assertRouteIsPublic(route: string): void {
  if (isPublicRoute(route)) {
    return;
  }

  throw new Error("Route must remain unauthenticated for public access.");
}

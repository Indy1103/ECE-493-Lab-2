const ROLE_HOME_MAP: Record<string, string> = {
  EDITOR: "/editor/home",
  AUTHOR: "/author/home",
  REVIEWER: "/reviewer/home",
  REGISTERED_USER: "/home"
};

const ROLE_PERMISSIONS: Record<string, string[]> = {
  EDITOR: ["edit_submissions", "view_reviews"],
  AUTHOR: ["submit_paper", "view_decisions"],
  REVIEWER: ["review_paper", "view_assignments"],
  REGISTERED_USER: ["view_profile"]
};

export class RolePolicyService {
  resolveHomePath(role: string): string | null {
    return ROLE_HOME_MAP[role] ?? null;
  }

  hasPermission(role: string, permission: string): boolean {
    const permissions = ROLE_PERMISSIONS[role] ?? [];
    return permissions.includes(permission);
  }
}

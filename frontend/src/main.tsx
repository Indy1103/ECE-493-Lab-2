import { type FormEvent, StrictMode, useEffect, useMemo, useState } from "react";
import { createRoot } from "react-dom/client";

import { submitLogin, type LoginSubmissionState } from "./business/login/login.service.js";
import { ChangePasswordForm } from "./presentation/account/change-password-form.js";
import { AuthorDecisionPage } from "./presentation/author-decision/author-decision-page.js";
import { ConferenceSchedulePage } from "./presentation/conference-schedule/conference-schedule-page.js";
import { FinalDecisionPage } from "./presentation/final-decision/final-decision-page.js";
import { SubmitManuscriptForm } from "./presentation/manuscripts/submit-manuscript-form.js";
import { BackendCapabilitiesDemoPage } from "./presentation/pages/BackendCapabilitiesDemoPage.js";
import { PublicAnnouncementsPage } from "./presentation/pages/PublicAnnouncementsPage.js";
import { RegisterPage } from "./presentation/pages/RegisterPage.js";
import { RegistrationPricesPage } from "./presentation/pages/RegistrationPricesPage.js";
import { AssignedPapersPage } from "./presentation/referee-access/AssignedPapersPage.js";
import { RefereeAssignmentPanel } from "./presentation/referee-assignments/RefereeAssignmentPanel.js";
import { ReviewInvitationResponsePanel } from "./presentation/review-invitations/ReviewInvitationResponsePanel.js";
import { ReviewFormPage } from "./presentation/review-submission/review-form-page.js";
import { ReviewVisibilityPage } from "./presentation/review-visibility/review-visibility-page.js";
import { AuthorScheduleView } from "./presentation/schedule/AuthorScheduleView.js";
import { ScheduleEditorView } from "./presentation/schedule/ScheduleEditorView.js";
import { SubmissionDraftEditor } from "./presentation/submission-drafts/SubmissionDraftEditor.js";

type RoleName = "ADMIN" | "EDITOR" | "AUTHOR" | "REFEREE" | "REGISTERED_USER";

interface AuthSession {
  role: RoleName;
  username: string;
  roleHomePath: string;
  loggedInAt: string;
}

interface DemoIds {
  conferenceId: string;
  paperId: string;
  submissionId: string;
  invitationId: string;
  assignmentId: string;
}

interface NavLink {
  label: string;
  path: string;
}

const AUTH_STORAGE_KEY = "cms.frontend.auth-session";

const ROLE_HOME_ROUTES: Record<RoleName, string> = {
  ADMIN: "/admin/dashboard",
  EDITOR: "/editor/dashboard",
  AUTHOR: "/author/dashboard",
  REFEREE: "/referee/dashboard",
  REGISTERED_USER: "/user/dashboard"
};

const DEMO_LOGIN_USERS: Record<RoleName, { username: string; password: string }> = {
  ADMIN: { username: "admin.ava", password: "Passw0rd88" },
  EDITOR: { username: "editor.jane", password: "Passw0rd88" },
  AUTHOR: { username: "author.alex", password: "Passw0rd88" },
  REFEREE: { username: "referee.riley", password: "Passw0rd88" },
  REGISTERED_USER: { username: "user.uma", password: "Passw0rd88" }
};

const DEFAULT_IDS: DemoIds = {
  conferenceId: "00000000-0000-4000-8000-000000000701",
  paperId: "00000000-0000-4000-8000-000000000301",
  submissionId: "00000000-0000-4000-8000-000000000201",
  invitationId: "00000000-0000-4000-8000-000000000401",
  assignmentId: "00000000-0000-4000-8000-000000000501"
};

const PUBLIC_LINKS: NavLink[] = [
  { label: "Announcements", path: "/announcements" },
  { label: "Registration Prices", path: "/registration-prices" },
  { label: "Create Account", path: "/register" },
  { label: "Login", path: "/login" },
  { label: "Backend Demo", path: "/demo" }
];

const AUTH_SHARED_LINKS: NavLink[] = [
  { label: "Dashboard", path: "__ROLE_HOME__" },
  { label: "Change Password", path: "/account/password-change" },
  { label: "Backend Demo", path: "/demo" },
  { label: "Announcements", path: "/announcements" },
  { label: "Registration Prices", path: "/registration-prices" }
];

const ROLE_LINKS: Record<RoleName, NavLink[]> = {
  ADMIN: [{ label: "Generate Schedule", path: "/admin/generate-schedule" }],
  EDITOR: [
    { label: "Assign Referees", path: "/editor/referee-assignments" },
    { label: "Completed Reviews", path: "/editor/completed-reviews" },
    { label: "Final Decision", path: "/editor/final-decision" },
    { label: "Schedule Editor", path: "/editor/schedule-editor" }
  ],
  AUTHOR: [
    { label: "Submit Manuscript", path: "/author/submit-manuscript" },
    { label: "Submission Drafts", path: "/author/submission-draft" },
    { label: "View Decision", path: "/author/final-decision" },
    { label: "View Schedule", path: "/author/schedule" }
  ],
  REFEREE: [
    { label: "Review Invitation", path: "/referee/invitation" },
    { label: "Assigned Papers", path: "/referee/assigned-papers" },
    { label: "Submit Review", path: "/referee/review-submission" }
  ],
  REGISTERED_USER: [{ label: "Registration Prices", path: "/user/registration-prices" }]
};

const KNOWN_ROUTES = new Set<string>([
  "/announcements",
  "/registration-prices",
  "/register",
  "/login",
  "/demo",
  "/account/password-change",
  "/admin/dashboard",
  "/admin/generate-schedule",
  "/editor/dashboard",
  "/editor/referee-assignments",
  "/editor/completed-reviews",
  "/editor/final-decision",
  "/editor/schedule-editor",
  "/author/dashboard",
  "/author/submit-manuscript",
  "/author/submission-draft",
  "/author/final-decision",
  "/author/schedule",
  "/referee/dashboard",
  "/referee/invitation",
  "/referee/assigned-papers",
  "/referee/review-submission",
  "/user/dashboard",
  "/user/registration-prices"
]);

function normalizePathname(pathname: string): string {
  if (pathname.length === 0) {
    return "/";
  }
  if (pathname !== "/" && pathname.endsWith("/")) {
    return pathname.slice(0, -1);
  }
  return pathname;
}

function roleFromHomePath(path: string): RoleName | null {
  if (path.startsWith("/admin")) {
    return "ADMIN";
  }
  if (path.startsWith("/editor")) {
    return "EDITOR";
  }
  if (path.startsWith("/author")) {
    return "AUTHOR";
  }
  if (path.startsWith("/referee")) {
    return "REFEREE";
  }
  if (path === "/home" || path.startsWith("/user")) {
    return "REGISTERED_USER";
  }
  return null;
}

function rolePrefix(pathname: string): RoleName | null {
  if (pathname === "/admin" || pathname.startsWith("/admin/")) {
    return "ADMIN";
  }
  if (pathname === "/editor" || pathname.startsWith("/editor/")) {
    return "EDITOR";
  }
  if (pathname === "/author" || pathname.startsWith("/author/")) {
    return "AUTHOR";
  }
  if (pathname === "/referee" || pathname.startsWith("/referee/")) {
    return "REFEREE";
  }
  if (pathname === "/user" || pathname.startsWith("/user/")) {
    return "REGISTERED_USER";
  }
  return null;
}

function isProtectedPath(pathname: string): boolean {
  if (pathname === "/account/password-change") {
    return true;
  }
  return rolePrefix(pathname) !== null;
}

function homeRouteForRole(role: RoleName): string {
  return ROLE_HOME_ROUTES[role];
}

function loadSessionFromStorage(): AuthSession | null {
  try {
    const raw = window.localStorage.getItem(AUTH_STORAGE_KEY);
    if (!raw) {
      return null;
    }
    const parsed = JSON.parse(raw) as Partial<AuthSession>;
    if (
      typeof parsed.role === "string" &&
      typeof parsed.username === "string" &&
      typeof parsed.roleHomePath === "string" &&
      typeof parsed.loggedInAt === "string" &&
      roleFromHomePath(parsed.roleHomePath) !== null
    ) {
      return parsed as AuthSession;
    }
    return null;
  } catch {
    return null;
  }
}

function persistSession(session: AuthSession | null): void {
  if (!session) {
    window.localStorage.removeItem(AUTH_STORAGE_KEY);
    return;
  }
  window.localStorage.setItem(AUTH_STORAGE_KEY, JSON.stringify(session));
}

function resolvePath(pathname: string, session: AuthSession | null): string {
  const normalized = normalizePathname(pathname);

  if (normalized === "/") {
    return session ? homeRouteForRole(session.role) : "/announcements";
  }

  if (!KNOWN_ROUTES.has(normalized)) {
    return session ? homeRouteForRole(session.role) : "/announcements";
  }

  if (!session && isProtectedPath(normalized)) {
    return "/login";
  }

  if (session && normalized === "/login") {
    return homeRouteForRole(session.role);
  }

  if (session) {
    const requiredRole = rolePrefix(normalized);
    if (requiredRole && requiredRole !== session.role) {
      return homeRouteForRole(session.role);
    }
  }

  return normalized;
}

function AppShell(): JSX.Element {
  const [pathname, setPathname] = useState<string>(() => normalizePathname(window.location.pathname));
  const [session, setSession] = useState<AuthSession | null>(() => loadSessionFromStorage());
  const [notice, setNotice] = useState<string>("");
  const [ids, setIds] = useState<DemoIds>(DEFAULT_IDS);

  useEffect(() => {
    const listener = (): void => {
      setPathname(normalizePathname(window.location.pathname));
    };
    window.addEventListener("popstate", listener);
    return () => {
      window.removeEventListener("popstate", listener);
    };
  }, []);

  useEffect(() => {
    persistSession(session);
  }, [session]);

  const navigate = (targetPath: string, replace = false): void => {
    const normalized = normalizePathname(targetPath);
    if (replace) {
      window.history.replaceState({}, "", normalized);
    } else {
      window.history.pushState({}, "", normalized);
    }
    setPathname(normalized);
  };

  useEffect(() => {
    const resolved = resolvePath(pathname, session);
    if (resolved !== pathname) {
      navigate(resolved, true);
    }
  }, [pathname, session]);

  const resolvedPath = resolvePath(pathname, session);

  const links = useMemo(() => {
    if (!session) {
      return PUBLIC_LINKS;
    }

    const shared = AUTH_SHARED_LINKS.map((entry) =>
      entry.path === "__ROLE_HOME__"
        ? { ...entry, path: homeRouteForRole(session.role) }
        : entry
    );
    return [...shared, ...ROLE_LINKS[session.role]];
  }, [session]);

  function handleAuthenticatedLogin(outcome: {
    role: RoleName;
    username: string;
    roleHomePath: string;
  }): void {
    setSession({
      role: outcome.role,
      username: outcome.username,
      roleHomePath: outcome.roleHomePath,
      loggedInAt: new Date().toISOString()
    });
    setNotice("");
    navigate(homeRouteForRole(outcome.role), true);
  }

  function clearBrowserSessionCookies(): void {
    document.cookie = "cms_session=; Max-Age=0; path=/";
    document.cookie = "session=; Max-Age=0; path=/";
  }

  function handleLogout(message?: string): void {
    clearBrowserSessionCookies();
    setSession(null);
    if (message) {
      setNotice(message);
    }
    navigate("/login", true);
  }

  function setIdValue<K extends keyof DemoIds>(key: K, value: DemoIds[K]): void {
    setIds((current) => ({
      ...current,
      [key]: value
    }));
  }

  return (
    <main
      style={{
        minHeight: "100vh",
        margin: 0,
        background: "linear-gradient(180deg, #f5f7fb 0%, #eef2f7 100%)",
        color: "#16212e",
        fontFamily: "system-ui, -apple-system, Segoe UI, Roboto, sans-serif",
        padding: "16px"
      }}
    >
      <header
        style={{
          backgroundColor: "#ffffff",
          border: "1px solid #d6deea",
          borderRadius: "12px",
          padding: "16px",
          marginBottom: "16px"
        }}
      >
        <h1 style={{ margin: "0 0 6px 0" }}>Conference Management System</h1>
        <p style={{ margin: 0 }}>
          Role-based workspace with automatic redirects and guarded navigation.
        </p>
        {session ? (
          <p style={{ marginTop: "8px", marginBottom: 0 }}>
            Signed in as <strong>{session.username}</strong> ({session.role})
          </p>
        ) : (
          <p style={{ marginTop: "8px", marginBottom: 0 }}>Not signed in.</p>
        )}
      </header>

      {notice.length > 0 ? (
        <section
          style={{
            backgroundColor: "#fff7db",
            border: "1px solid #f0d98a",
            borderRadius: "10px",
            padding: "10px 12px",
            marginBottom: "16px"
          }}
        >
          {notice}
        </section>
      ) : null}

      <div
        style={{
          display: "grid",
          gridTemplateColumns: "minmax(220px, 260px) minmax(0, 1fr)",
          gap: "16px"
        }}
      >
        <aside
          style={{
            backgroundColor: "#ffffff",
            border: "1px solid #d6deea",
            borderRadius: "12px",
            padding: "12px",
            alignSelf: "start"
          }}
        >
          <h2 style={{ marginTop: 0, marginBottom: "10px" }}>Navigation</h2>
          <nav style={{ display: "grid", gap: "8px" }}>
            {links.map((link) => (
              <button
                key={link.path}
                type="button"
                onClick={() => navigate(link.path)}
                style={{
                  textAlign: "left",
                  border: "1px solid #c8d1df",
                  borderRadius: "8px",
                  backgroundColor: resolvedPath === link.path ? "#dce8ff" : "#f8fafc",
                  padding: "8px 10px",
                  cursor: "pointer"
                }}
              >
                {link.label}
              </button>
            ))}
          </nav>
          {session ? (
            <button
              type="button"
              onClick={() => handleLogout("You have been signed out.")}
              style={{
                marginTop: "12px",
                width: "100%",
                border: "1px solid #c8d1df",
                borderRadius: "8px",
                backgroundColor: "#fff1f1",
                padding: "8px 10px",
                cursor: "pointer"
              }}
            >
              Log Out
            </button>
          ) : null}
        </aside>

        <section
          style={{
            backgroundColor: "#ffffff",
            border: "1px solid #d6deea",
            borderRadius: "12px",
            padding: "16px",
            minHeight: "520px"
          }}
        >
          {shouldShowEntityContext(resolvedPath) ? (
            <EntityContextPanel ids={ids} onChange={setIdValue} />
          ) : null}
          {renderRouteContent(resolvedPath, ids, {
            onNavigate: (path) => navigate(path),
            onAuthenticated: handleAuthenticatedLogin,
            onPasswordReauthentication: () =>
              handleLogout("Password changed successfully. Please sign in again.")
          })}
        </section>
      </div>
    </main>
  );
}

function shouldShowEntityContext(pathname: string): boolean {
  return (
    pathname.startsWith("/admin/") ||
    pathname.startsWith("/editor/") ||
    pathname.startsWith("/author/") ||
    pathname.startsWith("/referee/")
  );
}

function renderRouteContent(
  pathname: string,
  ids: DemoIds,
  handlers: {
    onNavigate: (path: string) => void;
    onAuthenticated: (outcome: { role: RoleName; username: string; roleHomePath: string }) => void;
    onPasswordReauthentication: () => void;
  }
): JSX.Element {
  switch (pathname) {
    case "/announcements":
      return <PublicAnnouncementsPage />;
    case "/registration-prices":
    case "/user/registration-prices":
      return <RegistrationPricesPage />;
    case "/register":
      return <RegisterPage />;
    case "/login":
      return <RoleLoginPage onAuthenticated={handlers.onAuthenticated} />;
    case "/demo":
      return <BackendCapabilitiesDemoPage />;
    case "/account/password-change":
      return (
        <section>
          <h2>Change Password</h2>
          <ChangePasswordForm onRequireReauthentication={handlers.onPasswordReauthentication} />
        </section>
      );
    case "/admin/dashboard":
      return (
        <RoleDashboard
          title="Admin Workspace"
          subtitle="Manage top-level conference operations."
          links={[{ label: "Generate Conference Schedule", path: "/admin/generate-schedule" }]}
          onNavigate={handlers.onNavigate}
        />
      );
    case "/admin/generate-schedule":
      return <ConferenceSchedulePage conferenceId={ids.conferenceId} />;
    case "/editor/dashboard":
      return (
        <RoleDashboard
          title="Editor Workspace"
          subtitle="Handle referee assignments, reviews, decisions, and schedule edits."
          links={[
            { label: "Assign Referees", path: "/editor/referee-assignments" },
            { label: "View Completed Reviews", path: "/editor/completed-reviews" },
            { label: "Record Final Decision", path: "/editor/final-decision" },
            { label: "Edit Schedule", path: "/editor/schedule-editor" }
          ]}
          onNavigate={handlers.onNavigate}
        />
      );
    case "/editor/referee-assignments":
      return <RefereeAssignmentPanel paperId={ids.paperId} />;
    case "/editor/completed-reviews":
      return <ReviewVisibilityPage paperId={ids.paperId} />;
    case "/editor/final-decision":
      return <FinalDecisionPage paperId={ids.paperId} />;
    case "/editor/schedule-editor":
      return <ScheduleEditorView conferenceId={ids.conferenceId} />;
    case "/author/dashboard":
      return (
        <RoleDashboard
          title="Author Workspace"
          subtitle="Submit manuscripts, manage drafts, and track outcomes."
          links={[
            { label: "Submit Manuscript", path: "/author/submit-manuscript" },
            { label: "Submission Drafts", path: "/author/submission-draft" },
            { label: "View Decision", path: "/author/final-decision" },
            { label: "View Schedule", path: "/author/schedule" }
          ]}
          onNavigate={handlers.onNavigate}
        />
      );
    case "/author/submit-manuscript":
      return <SubmitManuscriptForm />;
    case "/author/submission-draft":
      return <SubmissionDraftEditor submissionId={ids.submissionId} />;
    case "/author/final-decision":
      return <AuthorDecisionPage paperId={ids.paperId} />;
    case "/author/schedule":
      return <AuthorScheduleView />;
    case "/referee/dashboard":
      return (
        <RoleDashboard
          title="Referee Workspace"
          subtitle="Respond to invitations, access assigned papers, and submit reviews."
          links={[
            { label: "Review Invitation", path: "/referee/invitation" },
            { label: "Assigned Papers", path: "/referee/assigned-papers" },
            { label: "Submit Review", path: "/referee/review-submission" }
          ]}
          onNavigate={handlers.onNavigate}
        />
      );
    case "/referee/invitation":
      return <ReviewInvitationResponsePanel invitationId={ids.invitationId} />;
    case "/referee/assigned-papers":
      return <AssignedPapersPage />;
    case "/referee/review-submission":
      return <ReviewFormPage assignmentId={ids.assignmentId} />;
    case "/user/dashboard":
      return (
        <RoleDashboard
          title="Registered User Workspace"
          subtitle="Browse public conference information and registration pricing."
          links={[
            { label: "Registration Prices", path: "/user/registration-prices" },
            { label: "Conference Announcements", path: "/announcements" }
          ]}
          onNavigate={handlers.onNavigate}
        />
      );
    default:
      return <PublicAnnouncementsPage />;
  }
}

function EntityContextPanel(props: {
  ids: DemoIds;
  onChange: <K extends keyof DemoIds>(key: K, value: DemoIds[K]) => void;
}): JSX.Element {
  return (
    <section
      style={{
        border: "1px solid #e1e7f0",
        borderRadius: "10px",
        padding: "12px",
        marginBottom: "16px",
        backgroundColor: "#f8fafc"
      }}
    >
      <h3 style={{ marginTop: 0, marginBottom: "8px" }}>Workflow Context</h3>
      <p style={{ marginTop: 0 }}>Update IDs to work with specific records during demos.</p>
      <div
        style={{
          display: "grid",
          gridTemplateColumns: "repeat(auto-fit, minmax(220px, 1fr))",
          gap: "10px"
        }}
      >
        <label>
          Conference ID
          <input
            value={props.ids.conferenceId}
            onChange={(event) => props.onChange("conferenceId", event.target.value)}
            style={{ width: "100%" }}
          />
        </label>
        <label>
          Paper ID
          <input
            value={props.ids.paperId}
            onChange={(event) => props.onChange("paperId", event.target.value)}
            style={{ width: "100%" }}
          />
        </label>
        <label>
          Submission ID
          <input
            value={props.ids.submissionId}
            onChange={(event) => props.onChange("submissionId", event.target.value)}
            style={{ width: "100%" }}
          />
        </label>
        <label>
          Invitation ID
          <input
            value={props.ids.invitationId}
            onChange={(event) => props.onChange("invitationId", event.target.value)}
            style={{ width: "100%" }}
          />
        </label>
        <label>
          Assignment ID
          <input
            value={props.ids.assignmentId}
            onChange={(event) => props.onChange("assignmentId", event.target.value)}
            style={{ width: "100%" }}
          />
        </label>
      </div>
    </section>
  );
}

function RoleDashboard(props: {
  title: string;
  subtitle: string;
  links: NavLink[];
  onNavigate: (path: string) => void;
}): JSX.Element {
  return (
    <section>
      <h2>{props.title}</h2>
      <p>{props.subtitle}</p>
      <div
        style={{
          display: "grid",
          gridTemplateColumns: "repeat(auto-fit, minmax(220px, 1fr))",
          gap: "12px"
        }}
      >
        {props.links.map((link) => (
          <button
            key={link.path}
            type="button"
            onClick={() => props.onNavigate(link.path)}
            style={{
              border: "1px solid #c8d1df",
              borderRadius: "10px",
              backgroundColor: "#f8fafc",
              textAlign: "left",
              padding: "12px",
              cursor: "pointer"
            }}
          >
            <strong>{link.label}</strong>
            <p style={{ marginBottom: 0, color: "#334155" }}>{link.path}</p>
          </button>
        ))}
      </div>
    </section>
  );
}

function RoleLoginPage(props: {
  onAuthenticated: (outcome: { role: RoleName; username: string; roleHomePath: string }) => void;
}): JSX.Element {
  const [username, setUsername] = useState("editor.jane");
  const [password, setPassword] = useState("Passw0rd88");
  const [state, setState] = useState<{ status: "IDLE" } | { status: "SUBMITTING" } | LoginSubmissionState>(
    { status: "IDLE" }
  );

  async function onSubmit(event: FormEvent<HTMLFormElement>): Promise<void> {
    event.preventDefault();
    setState({ status: "SUBMITTING" });

    const outcome = await submitLogin({ username, password });
    setState(outcome);

    if (outcome.status === "AUTHENTICATED") {
      const role = roleFromHomePath(outcome.roleHomePath);
      if (role) {
        props.onAuthenticated({
          role,
          username,
          roleHomePath: outcome.roleHomePath
        });
      } else {
        setState({
          status: "UNAVAILABLE",
          message: "Login succeeded but role mapping is unavailable for this account."
        });
      }
    }
  }

  return (
    <section>
      <h2>Login</h2>
      <p>Sign in and you will be redirected automatically to your role dashboard.</p>
      <div style={{ display: "flex", gap: "8px", flexWrap: "wrap", marginBottom: "10px" }}>
        {(Object.keys(DEMO_LOGIN_USERS) as RoleName[]).map((role) => (
          <button
            key={role}
            type="button"
            onClick={() => {
              setUsername(DEMO_LOGIN_USERS[role].username);
              setPassword(DEMO_LOGIN_USERS[role].password);
            }}
          >
            Use {role}
          </button>
        ))}
      </div>
      <form onSubmit={onSubmit}>
        <label style={{ display: "block", marginBottom: "8px" }}>
          Username
          <input
            value={username}
            onChange={(event) => setUsername(event.target.value)}
            style={{ display: "block", width: "100%" }}
          />
        </label>
        <label style={{ display: "block", marginBottom: "8px" }}>
          Password
          <input
            type="password"
            value={password}
            onChange={(event) => setPassword(event.target.value)}
            style={{ display: "block", width: "100%" }}
          />
        </label>
        <button type="submit" disabled={state.status === "SUBMITTING"}>
          {state.status === "SUBMITTING" ? "Signing in..." : "Sign in"}
        </button>
      </form>

      {state.status === "AUTHENTICATED" ? <p>{state.message}</p> : null}
      {state.status === "INVALID_CREDENTIALS" ? <p>{state.message}</p> : null}
      {state.status === "ROLE_MAPPING_UNAVAILABLE" ? <p>{state.message}</p> : null}
      {state.status === "THROTTLED" ? <p>{state.message}</p> : null}
      {state.status === "UNAVAILABLE" ? <p>{state.message}</p> : null}
    </section>
  );
}

function App(): JSX.Element {
  return <AppShell />;
}

const rootElement = document.getElementById("root");

if (!rootElement) {
  throw new Error("Missing root element");
}

createRoot(rootElement).render(
  <StrictMode>
    <App />
  </StrictMode>
);

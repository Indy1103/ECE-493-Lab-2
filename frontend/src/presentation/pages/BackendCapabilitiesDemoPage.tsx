import { useMemo, useState } from "react";

type HttpMethod = "GET" | "POST" | "PUT";
type RoleName = "ADMIN" | "EDITOR" | "AUTHOR" | "REFEREE" | "REGISTERED_USER";
type AccessLevel = "PUBLIC" | "AUTHENTICATED" | RoleName;

interface CapabilitySpec {
  id: string;
  title: string;
  method: HttpMethod;
  pathTemplate: string;
  description: string;
  access: AccessLevel;
  defaultParams?: Record<string, string>;
  defaultBody?: string;
}

interface CapabilityResponse {
  status: number;
  statusText: string;
  body: string;
}

interface RoleCredential {
  role: RoleName;
  username: string;
  password: string;
}

interface RbacCheck {
  role: RoleName;
  allowedCapabilityId: string;
  forbiddenCapabilityId: string;
}

interface RbacCheckResult {
  role: RoleName;
  loginStatus: number;
  allowedStatus: number;
  forbiddenStatus: number;
  passed: boolean;
}

const INITIAL_ROLE_CREDENTIALS: RoleCredential[] = [
  { role: "ADMIN", username: "admin.ava", password: "Passw0rd88" },
  { role: "EDITOR", username: "editor.jane", password: "Passw0rd88" },
  { role: "AUTHOR", username: "author.alex", password: "Passw0rd88" },
  { role: "REFEREE", username: "referee.riley", password: "Passw0rd88" },
  { role: "REGISTERED_USER", username: "user.uma", password: "Passw0rd88" }
];

const CAPABILITIES: CapabilitySpec[] = [
  {
    id: "uc01-announcements",
    title: "UC-01 View Conference Announcements",
    method: "GET",
    pathTemplate: "/api/public/announcements",
    description: "Reads public conference announcements.",
    access: "PUBLIC"
  },
  {
    id: "uc02-register",
    title: "UC-02 User Account Registration",
    method: "POST",
    pathTemplate: "/api/public/registrations",
    description: "Creates a user account.",
    access: "PUBLIC",
    defaultBody: JSON.stringify(
      {
        fullName: "Jane Editor",
        email: "jane@example.com",
        password: "Passw0rd88"
      },
      null,
      2
    )
  },
  {
    id: "uc03-login",
    title: "UC-03 User Login",
    method: "POST",
    pathTemplate: "/api/public/login",
    description: "Authenticates a user and sets session cookies.",
    access: "PUBLIC",
    defaultBody: JSON.stringify(
      {
        username: "editor.jane",
        password: "Passw0rd88"
      },
      null,
      2
    )
  },
  {
    id: "uc04-password-change",
    title: "UC-04 Change Password",
    method: "POST",
    pathTemplate: "/api/v1/account/password-change",
    description: "Changes password for an authenticated session.",
    access: "AUTHENTICATED",
    defaultBody: JSON.stringify(
      {
        currentPassword: "Passw0rd88",
        newPassword: "Passw0rd88AA",
        confirmNewPassword: "Passw0rd88AA"
      },
      null,
      2
    )
  },
  {
    id: "uc05-manuscript-requirements",
    title: "UC-05 Manuscript Submission Requirements",
    method: "GET",
    pathTemplate: "/api/v1/manuscript-submissions/requirements",
    description: "Fetches active submission requirements.",
    access: "AUTHOR"
  },
  {
    id: "uc05-manuscript-submit",
    title: "UC-05 Submit Manuscript",
    method: "POST",
    pathTemplate: "/api/v1/manuscript-submissions",
    description: "Submits manuscript metadata and file payload.",
    access: "AUTHOR",
    defaultBody: JSON.stringify(
      {
        metadata: {
          title: "A Sample Manuscript",
          abstract: "Short abstract for demo.",
          keywords: ["conference", "systems"],
          fullAuthorList: [{ name: "Alex Author", affiliation: "ECE" }],
          correspondingAuthorEmail: "author@example.com",
          primarySubjectArea: "Distributed Systems"
        },
        manuscriptFile: {
          filename: "paper.pdf",
          mediaType: "application/pdf",
          byteSize: 1024,
          sha256Digest: "a".repeat(64)
        }
      },
      null,
      2
    )
  },
  {
    id: "uc06-get-draft",
    title: "UC-06 Get Submission Draft",
    method: "GET",
    pathTemplate: "/api/v1/submission-drafts/:submissionId",
    description: "Loads a saved submission draft.",
    access: "AUTHOR",
    defaultParams: { submissionId: "00000000-0000-4000-8000-000000000201" }
  },
  {
    id: "uc06-save-draft",
    title: "UC-06 Save Submission Draft",
    method: "PUT",
    pathTemplate: "/api/v1/submission-drafts/:submissionId",
    description: "Saves or updates a submission draft.",
    access: "AUTHOR",
    defaultParams: { submissionId: "00000000-0000-4000-8000-000000000201" },
    defaultBody: JSON.stringify(
      {
        title: "Draft Title",
        draftPayload: {
          abstract: "Draft abstract",
          keywords: ["conference", "demo"],
          correspondingAuthorEmail: "author@example.com"
        }
      },
      null,
      2
    )
  },
  {
    id: "uc07-options",
    title: "UC-07 Referee Assignment Options",
    method: "GET",
    pathTemplate: "/api/v1/papers/:paperId/referee-assignment-options",
    description: "Retrieves assignment options for a paper.",
    access: "EDITOR",
    defaultParams: { paperId: "00000000-0000-4000-8000-000000000301" }
  },
  {
    id: "uc07-assign",
    title: "UC-07 Assign Referees",
    method: "POST",
    pathTemplate: "/api/v1/papers/:paperId/referee-assignments",
    description: "Assigns referees to a paper.",
    access: "EDITOR",
    defaultParams: { paperId: "00000000-0000-4000-8000-000000000301" },
    defaultBody: JSON.stringify(
      {
        refereeIds: [
          "00000000-0000-4000-8000-000000000104",
          "00000000-0000-4000-8000-000000000106"
        ]
      },
      null,
      2
    )
  },
  {
    id: "uc08-get-invitation",
    title: "UC-08 Get Review Invitation",
    method: "GET",
    pathTemplate: "/api/v1/review-invitations/:invitationId",
    description: "Fetches invitation details.",
    access: "REFEREE",
    defaultParams: { invitationId: "00000000-0000-4000-8000-000000000401" }
  },
  {
    id: "uc08-respond-invitation",
    title: "UC-08 Respond to Invitation",
    method: "POST",
    pathTemplate: "/api/v1/review-invitations/:invitationId/response",
    description: "Accepts or rejects a review invitation.",
    access: "REFEREE",
    defaultParams: { invitationId: "00000000-0000-4000-8000-000000000401" },
    defaultBody: JSON.stringify(
      {
        decision: "ACCEPT"
      },
      null,
      2
    )
  },
  {
    id: "uc09-list-assignments",
    title: "UC-09 List Assigned Papers",
    method: "GET",
    pathTemplate: "/api/referee/assignments",
    description: "Lists assignments for a referee.",
    access: "REFEREE"
  },
  {
    id: "uc09-access-assignment",
    title: "UC-09 Access Assigned Paper",
    method: "POST",
    pathTemplate: "/api/referee/assignments/:assignmentId/access",
    description: "Requests access to an assigned paper.",
    access: "REFEREE",
    defaultParams: { assignmentId: "00000000-0000-4000-8000-000000000501" }
  },
  {
    id: "uc10-review-form",
    title: "UC-10 Get Review Form",
    method: "GET",
    pathTemplate: "/api/referee/assignments/:assignmentId/review-form",
    description: "Fetches review form data.",
    access: "REFEREE",
    defaultParams: { assignmentId: "00000000-0000-4000-8000-000000000501" }
  },
  {
    id: "uc10-submit-review",
    title: "UC-10 Submit Review",
    method: "POST",
    pathTemplate: "/api/referee/assignments/:assignmentId/review-submissions",
    description: "Submits a paper review.",
    access: "REFEREE",
    defaultParams: { assignmentId: "00000000-0000-4000-8000-000000000501" },
    defaultBody: JSON.stringify(
      {
        responses: {
          summary: "Overall strong contribution and clear evaluation.",
          score: 4,
          confidence: 3,
          recommendation: "ACCEPT"
        }
      },
      null,
      2
    )
  },
  {
    id: "uc11-view-reviews",
    title: "UC-11 View Completed Reviews",
    method: "GET",
    pathTemplate: "/api/editor/papers/:paperId/reviews",
    description: "Loads anonymized completed reviews for an editor.",
    access: "EDITOR",
    defaultParams: { paperId: "00000000-0000-4000-8000-000000000301" }
  },
  {
    id: "uc12-final-decision",
    title: "UC-12 Record Final Decision",
    method: "POST",
    pathTemplate: "/api/editor/papers/:paperId/decision",
    description: "Records ACCEPT/REJECT decision.",
    access: "EDITOR",
    defaultParams: { paperId: "00000000-0000-4000-8000-000000000301" },
    defaultBody: JSON.stringify(
      {
        decision: "ACCEPT"
      },
      null,
      2
    )
  },
  {
    id: "uc13-author-decision",
    title: "UC-13 Author Receives Decision",
    method: "GET",
    pathTemplate: "/api/author/papers/:paperId/decision",
    description: "Fetches final decision for an author.",
    access: "AUTHOR",
    defaultParams: { paperId: "00000000-0000-4000-8000-000000000301" }
  },
  {
    id: "uc14-generate-schedule",
    title: "UC-14 Generate Conference Schedule",
    method: "POST",
    pathTemplate: "/api/admin/conference/:conferenceId/schedule",
    description: "Generates conference schedule from accepted papers.",
    access: "ADMIN",
    defaultParams: { conferenceId: "00000000-0000-4000-8000-000000000701" }
  },
  {
    id: "uc15-get-schedule",
    title: "UC-15 Get Editable Schedule",
    method: "GET",
    pathTemplate: "/api/editor/conferences/:conferenceId/schedule",
    description: "Gets editable schedule snapshot for editors.",
    access: "EDITOR",
    defaultParams: { conferenceId: "00000000-0000-4000-8000-000000000701" }
  },
  {
    id: "uc15-update-schedule",
    title: "UC-15 Update Schedule",
    method: "PUT",
    pathTemplate: "/api/editor/conferences/:conferenceId/schedule",
    description: "Applies schedule edits and finalizes schedule.",
    access: "EDITOR",
    defaultParams: { conferenceId: "00000000-0000-4000-8000-000000000701" },
    defaultBody: JSON.stringify(
      {
        scheduleId: "00000000-0000-4000-8000-000000000702",
        entries: [
          {
            paperId: "00000000-0000-4000-8000-000000000301",
            sessionId: "00000000-0000-4000-8000-000000000801",
            roomId: "00000000-0000-4000-8000-000000000802",
            timeSlotId: "00000000-0000-4000-8000-000000000803"
          }
        ]
      },
      null,
      2
    )
  },
  {
    id: "uc16-author-schedule",
    title: "UC-16 Author Receives Schedule",
    method: "GET",
    pathTemplate: "/api/author/schedule",
    description: "Retrieves published schedule for author.",
    access: "AUTHOR"
  },
  {
    id: "uc17-registration-prices",
    title: "UC-17 View Registration Prices",
    method: "GET",
    pathTemplate: "/public/registration-prices",
    description: "Fetches current public registration prices.",
    access: "PUBLIC"
  }
];

const RBAC_CHECKS: RbacCheck[] = [
  {
    role: "EDITOR",
    allowedCapabilityId: "uc07-options",
    forbiddenCapabilityId: "uc14-generate-schedule"
  },
  {
    role: "AUTHOR",
    allowedCapabilityId: "uc05-manuscript-requirements",
    forbiddenCapabilityId: "uc11-view-reviews"
  },
  {
    role: "REFEREE",
    allowedCapabilityId: "uc09-list-assignments",
    forbiddenCapabilityId: "uc12-final-decision"
  },
  {
    role: "ADMIN",
    allowedCapabilityId: "uc14-generate-schedule",
    forbiddenCapabilityId: "uc16-author-schedule"
  },
  {
    role: "REGISTERED_USER",
    allowedCapabilityId: "uc17-registration-prices",
    forbiddenCapabilityId: "uc05-manuscript-requirements"
  }
];

function extractPathParams(pathTemplate: string): string[] {
  return [...pathTemplate.matchAll(/:([a-zA-Z0-9_]+)/g)].map((match) => match[1] ?? "");
}

function safeJsonPrettyPrint(input: string): string {
  try {
    return JSON.stringify(JSON.parse(input), null, 2);
  } catch {
    return input;
  }
}

function isForbiddenStatus(status: number): boolean {
  return status === 401 || status === 403;
}

function isRoleName(role: string): role is RoleName {
  return (
    role === "ADMIN" ||
    role === "EDITOR" ||
    role === "AUTHOR" ||
    role === "REFEREE" ||
    role === "REGISTERED_USER"
  );
}

function getNextPassword(currentPassword: string): string {
  return currentPassword === "Passw0rd88AA" ? "Passw0rd88BB" : "Passw0rd88AA";
}

export function BackendCapabilitiesDemoPage(): JSX.Element {
  const [baseUrl, setBaseUrl] = useState("");
  const [sessionCookieValue, setSessionCookieValue] = useState(
    "00000000-0000-4000-8000-000000000100"
  );
  const [includeTlsHeader, setIncludeTlsHeader] = useState(true);
  const [includeCredentials, setIncludeCredentials] = useState(true);
  const [paramsById, setParamsById] = useState<Record<string, Record<string, string>>>({});
  const [bodyById, setBodyById] = useState<Record<string, string>>({});
  const [responseById, setResponseById] = useState<Record<string, CapabilityResponse>>({});
  const [isRunningById, setIsRunningById] = useState<Record<string, boolean>>({});
  const [activeRole, setActiveRole] = useState<RoleName | "None">("None");
  const [roleCredentials, setRoleCredentials] = useState<RoleCredential[]>(
    INITIAL_ROLE_CREDENTIALS
  );
  const [loginMessage, setLoginMessage] = useState<string>("Not authenticated.");
  const [cookieSnapshot, setCookieSnapshot] = useState<string>(() => document.cookie || "(empty)");
  const [isRbacChecking, setIsRbacChecking] = useState(false);
  const [rbacResults, setRbacResults] = useState<RbacCheckResult[]>([]);

  const capabilityById = useMemo(() => {
    const map = new Map<string, CapabilitySpec>();
    for (const capability of CAPABILITIES) {
      map.set(capability.id, capability);
    }
    return map;
  }, []);

  function refreshCookieSnapshot(): void {
    setCookieSnapshot(document.cookie || "(empty)");
  }

  function getParamValue(capability: CapabilitySpec, key: string): string {
    return paramsById[capability.id]?.[key] ?? capability.defaultParams?.[key] ?? "";
  }

  function getBodyValue(capability: CapabilitySpec): string {
    if (capability.id === "uc04-password-change" && activeRole !== "None") {
      const roleCredential = roleCredentials.find((entry) => entry.role === activeRole);
      if (roleCredential && bodyById[capability.id] === undefined) {
        const nextPassword = getNextPassword(roleCredential.password);
        return JSON.stringify(
          {
            currentPassword: roleCredential.password,
            newPassword: nextPassword,
            confirmNewPassword: nextPassword
          },
          null,
          2
        );
      }
    }

    return bodyById[capability.id] ?? capability.defaultBody ?? "";
  }

  function setParamValue(capabilityId: string, key: string, value: string): void {
    setParamsById((current) => ({
      ...current,
      [capabilityId]: {
        ...(current[capabilityId] ?? {}),
        [key]: value
      }
    }));
  }

  function setBodyValue(capabilityId: string, value: string): void {
    setBodyById((current) => ({
      ...current,
      [capabilityId]: value
    }));
  }

  function buildPath(capability: CapabilitySpec): string {
    let path = capability.pathTemplate;
    for (const key of extractPathParams(capability.pathTemplate)) {
      const value = getParamValue(capability, key);
      path = path.replace(`:${key}`, encodeURIComponent(value));
    }
    return path;
  }

  function applySessionCookie(): void {
    document.cookie = `cms_session=${sessionCookieValue}; path=/`;
    document.cookie = `session=${sessionCookieValue}; path=/`;
    refreshCookieSnapshot();
  }

  function clearSessionCookie(): void {
    document.cookie = "cms_session=; Max-Age=0; path=/";
    document.cookie = "session=; Max-Age=0; path=/";
    setActiveRole("None");
    setLoginMessage("Session cleared.");
    refreshCookieSnapshot();
  }

  async function requestCapability(capability: CapabilitySpec): Promise<CapabilityResponse> {
    const path = buildPath(capability);
    const url = `${baseUrl}${path}`;
    const headers: Record<string, string> = {
      Accept: "application/json"
    };

    if (includeTlsHeader) {
      headers["x-forwarded-proto"] = "https";
    }

    const bodyValue = getBodyValue(capability).trim();
    const requestInit: RequestInit = {
      method: capability.method,
      headers,
      credentials: includeCredentials ? "include" : "same-origin"
    };

    if (capability.method !== "GET" && bodyValue.length > 0) {
      headers["content-type"] = "application/json";
      requestInit.body = safeJsonPrettyPrint(bodyValue);
    }

    const response = await fetch(url, requestInit);
    const raw = await response.text();

    return {
      status: response.status,
      statusText: response.statusText,
      body: safeJsonPrettyPrint(raw)
    };
  }

  async function runCapability(capability: CapabilitySpec): Promise<void> {
    setIsRunningById((current) => ({ ...current, [capability.id]: true }));
    try {
      const submittedBody = getBodyValue(capability);
      const response = await requestCapability(capability);
      setResponseById((current) => ({
        ...current,
        [capability.id]: response
      }));

      if (capability.id === "uc04-password-change" && response.status === 200 && isRoleName(activeRole)) {
        try {
          const parsedBody = JSON.parse(submittedBody) as Record<string, unknown>;
          const newPassword =
            typeof parsedBody.newPassword === "string" ? parsedBody.newPassword : "";

          if (newPassword.length > 0) {
            setRoleCredentials((current) =>
              current.map((entry) =>
                entry.role === activeRole ? { ...entry, password: newPassword } : entry
              )
            );
            setLoginMessage(`${activeRole} password updated. Re-login uses the new password.`);
          }
        } catch {
          // Ignore non-JSON request bodies entered manually.
        }
      }
    } catch (error) {
      const message = error instanceof Error ? error.message : "Unknown request error";
      setResponseById((current) => ({
        ...current,
        [capability.id]: {
          status: 0,
          statusText: "REQUEST_FAILED",
          body: message
        }
      }));
    } finally {
      setIsRunningById((current) => ({ ...current, [capability.id]: false }));
      refreshCookieSnapshot();
    }
  }

  async function loginAsRole(role: RoleName): Promise<number> {
    const credential = roleCredentials.find((entry) => entry.role === role);
    if (!credential) {
      setLoginMessage(`Missing credential for ${role}.`);
      return 0;
    }

    try {
      const headers: Record<string, string> = {
        Accept: "application/json",
        "content-type": "application/json"
      };

      if (includeTlsHeader) {
        headers["x-forwarded-proto"] = "https";
      }

      const response = await fetch(`${baseUrl}/api/public/login`, {
        method: "POST",
        headers,
        credentials: includeCredentials ? "include" : "same-origin",
        body: JSON.stringify({
          username: credential.username,
          password: credential.password
        })
      });

      const payload = await response.text();
      const pretty = safeJsonPrettyPrint(payload);

      if (response.ok) {
        setActiveRole(role);
        setLoginMessage(`${role} authenticated via /api/public/login.`);
      } else {
        setLoginMessage(`${role} login failed (${response.status}). ${pretty}`);
      }

      refreshCookieSnapshot();
      return response.status;
    } catch (error) {
      const message = error instanceof Error ? error.message : "Unknown login error";
      setLoginMessage(`${role} login request failed: ${message}`);
      refreshCookieSnapshot();
      return 0;
    }
  }

  async function runRbacChecks(): Promise<void> {
    setIsRbacChecking(true);
    setRbacResults([]);

    const results: RbacCheckResult[] = [];

    for (const check of RBAC_CHECKS) {
      const allowedCapability = capabilityById.get(check.allowedCapabilityId);
      const forbiddenCapability = capabilityById.get(check.forbiddenCapabilityId);

      if (!allowedCapability || !forbiddenCapability) {
        continue;
      }

      const loginStatus = await loginAsRole(check.role);
      const allowedResponse =
        loginStatus === 200
          ? await requestCapability(allowedCapability)
          : { status: 0, statusText: "SKIPPED", body: "login failed" };
      const forbiddenResponse =
        loginStatus === 200
          ? await requestCapability(forbiddenCapability)
          : { status: 0, statusText: "SKIPPED", body: "login failed" };

      const passed =
        loginStatus === 200 &&
        allowedResponse.status >= 200 &&
        allowedResponse.status < 300 &&
        isForbiddenStatus(forbiddenResponse.status);

      results.push({
        role: check.role,
        loginStatus,
        allowedStatus: allowedResponse.status,
        forbiddenStatus: forbiddenResponse.status,
        passed
      });
    }

    setRbacResults(results);
    setIsRbacChecking(false);
    refreshCookieSnapshot();
  }

  return (
    <section>
      <h2>Backend Capability Demo</h2>
      <p>
        This panel exposes every user-facing backend endpoint (UC-01 through UC-17), provides
        one-click role logins, and supports RBAC smoke verification.
      </p>

      <div style={{ border: "1px solid #ddd", padding: "12px", marginBottom: "16px" }}>
        <h3>Global Controls</h3>
        <label style={{ display: "block", marginBottom: "8px" }}>
          Base URL (recommended: leave blank to use Vite proxy)
          <input
            value={baseUrl}
            onChange={(event) => setBaseUrl(event.target.value)}
            placeholder="http://localhost:3000"
            style={{ display: "block", width: "100%" }}
          />
        </label>
        <label style={{ display: "block", marginBottom: "8px" }}>
          Session Cookie Value
          <input
            value={sessionCookieValue}
            onChange={(event) => setSessionCookieValue(event.target.value)}
            style={{ display: "block", width: "100%" }}
          />
        </label>
        <div style={{ display: "flex", gap: "8px", flexWrap: "wrap", marginBottom: "8px" }}>
          <button type="button" onClick={applySessionCookie}>
            Apply Manual Session Cookie
          </button>
          <button type="button" onClick={clearSessionCookie}>
            Clear Session Cookie
          </button>
        </div>
        <label style={{ display: "block", marginBottom: "4px" }}>
          <input
            type="checkbox"
            checked={includeTlsHeader}
            onChange={(event) => setIncludeTlsHeader(event.target.checked)}
          />{" "}
          Send `x-forwarded-proto: https`
        </label>
        <label style={{ display: "block", marginBottom: "4px" }}>
          <input
            type="checkbox"
            checked={includeCredentials}
            onChange={(event) => setIncludeCredentials(event.target.checked)}
          />{" "}
          Send browser cookies (`credentials: include`)
        </label>
        <small>Current cookie snapshot: {cookieSnapshot}</small>
      </div>

      <div style={{ border: "1px solid #ddd", padding: "12px", marginBottom: "16px" }}>
        <h3>Role Login (RBAC)</h3>
        <p style={{ marginTop: 0 }}>
          Active role: <strong>{activeRole}</strong>
        </p>
        <p style={{ marginTop: 0 }}>{loginMessage}</p>
        <div style={{ display: "flex", gap: "8px", flexWrap: "wrap", marginBottom: "8px" }}>
          {roleCredentials.map((credential) => (
            <button
              key={credential.role}
              type="button"
              onClick={() => void loginAsRole(credential.role)}
            >
              Login as {credential.role}
            </button>
          ))}
        </div>
        <small>
          Demo credentials:{" "}
          {roleCredentials
            .map((entry) => `${entry.role}=${entry.username} (${entry.password})`)
            .join(" | ")}
        </small>
      </div>

      <div style={{ border: "1px solid #ddd", padding: "12px", marginBottom: "16px" }}>
        <h3>RBAC Smoke Test</h3>
        <p style={{ marginTop: 0 }}>
          Verifies each role can access one allowed endpoint and is blocked (401/403) from one
          unauthorized endpoint.
        </p>
        <button type="button" disabled={isRbacChecking} onClick={() => void runRbacChecks()}>
          {isRbacChecking ? "Running RBAC checks..." : "Run RBAC Smoke Test"}
        </button>

        {rbacResults.length > 0 ? (
          <table style={{ marginTop: "8px", width: "100%", borderCollapse: "collapse" }}>
            <thead>
              <tr>
                <th style={{ textAlign: "left", borderBottom: "1px solid #ddd" }}>Role</th>
                <th style={{ textAlign: "left", borderBottom: "1px solid #ddd" }}>Login</th>
                <th style={{ textAlign: "left", borderBottom: "1px solid #ddd" }}>Allowed</th>
                <th style={{ textAlign: "left", borderBottom: "1px solid #ddd" }}>Forbidden</th>
                <th style={{ textAlign: "left", borderBottom: "1px solid #ddd" }}>Result</th>
              </tr>
            </thead>
            <tbody>
              {rbacResults.map((result) => (
                <tr key={result.role}>
                  <td>{result.role}</td>
                  <td>{result.loginStatus}</td>
                  <td>{result.allowedStatus}</td>
                  <td>{result.forbiddenStatus}</td>
                  <td>{result.passed ? "PASS" : "FAIL"}</td>
                </tr>
              ))}
            </tbody>
          </table>
        ) : null}
      </div>

      {CAPABILITIES.map((capability) => {
        const params = extractPathParams(capability.pathTemplate);
        const response = responseById[capability.id];
        const isRunning = isRunningById[capability.id] === true;
        const bodyValue = getBodyValue(capability);

        return (
          <article
            key={capability.id}
            style={{
              border: "1px solid #ccc",
              borderRadius: "6px",
              padding: "12px",
              marginBottom: "12px"
            }}
          >
            <h3 style={{ marginTop: 0 }}>{capability.title}</h3>
            <p style={{ marginTop: 0 }}>{capability.description}</p>
            <p style={{ margin: "6px 0" }}>
              <strong>Expected Access:</strong> {capability.access}
            </p>
            <code>
              {capability.method} {capability.pathTemplate}
            </code>

            {params.length > 0 ? (
              <div style={{ marginTop: "8px" }}>
                {params.map((paramKey) => (
                  <label key={paramKey} style={{ display: "block", marginBottom: "6px" }}>
                    {paramKey}
                    <input
                      value={getParamValue(capability, paramKey)}
                      onChange={(event) =>
                        setParamValue(capability.id, paramKey, event.target.value)
                      }
                      style={{ display: "block", width: "100%" }}
                    />
                  </label>
                ))}
              </div>
            ) : null}

            {capability.method !== "GET" ? (
              <label style={{ display: "block", marginTop: "8px" }}>
                JSON Body
                <textarea
                  rows={8}
                  value={bodyValue}
                  onChange={(event) => setBodyValue(capability.id, event.target.value)}
                  style={{ display: "block", width: "100%", fontFamily: "monospace" }}
                />
              </label>
            ) : null}

            <div style={{ marginTop: "8px", display: "flex", gap: "8px", flexWrap: "wrap" }}>
              <button
                type="button"
                onClick={() => void runCapability(capability)}
                disabled={isRunning}
              >
                {isRunning ? "Running..." : "Run Request"}
              </button>
              <small>Resolved path: {buildPath(capability)}</small>
            </div>

            {response ? (
              <div style={{ marginTop: "8px" }}>
                <strong>
                  Response: {response.status} {response.statusText}
                </strong>
                <pre
                  style={{
                    marginTop: "6px",
                    backgroundColor: "#f6f8fa",
                    padding: "8px",
                    overflowX: "auto"
                  }}
                >
                  {response.body || "(empty response body)"}
                </pre>
              </div>
            ) : null}
          </article>
        );
      })}
    </section>
  );
}

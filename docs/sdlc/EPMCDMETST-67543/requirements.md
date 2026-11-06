# Requirements Specification — EPMCDMETST-67543

- **Work item:** EPMCDMETST-67543
- **Source status:** Local-only analysis. Jira MCP is unavailable; story summary, description, Jira acceptance criteria, status, labels, and Epic Link are **Not Found**. This document records the requested baseline of existing user/auth/todo behavior, not an assertion that these details were Jira-approved acceptance criteria.

## Executive Summary

Document the ToDo application's current user registration, authentication/session, and per-user todo management behavior as a traceable baseline for downstream review. No new or changed product behavior was specified.

## Business Objective and Scope

**Supplied request:** create a requirements document for issue EPMCDMETST-67543 based on this ToDo app's user/auth/todo behavior, and keep the workflow local-only. **Observed scope:** signup/login/logout, authorization and user-scoped todos, CRUD and completion, search/filter/sort, and the UI behavior directly supporting these. Excludes feature changes and unverified business goals.

## Actors and Stakeholders

- Visitor: may sign up or log in; todo endpoints are not available without an authenticated session.
- Registered user: accesses and manages their own todo list.
- Product owner/Jira requester: identity and desired feature outcome **Not Found** (Jira unavailable).

## Functional Requirements (observed baseline)

- **FR-01 Registration:** A visitor can submit name, email, and password. Missing/falsy values yield HTTP 400; an already-used exact email yields HTTP 409. Successful registration yields HTTP 201 and creates an initial incomplete welcome todo if the user has no todos.
- **FR-02 Login:** A registered user can log in with email/password. Success yields HTTP 200 and a session token plus name/email; invalid credentials yield HTTP 401. The UI stores token/name/email in browser local storage and displays name/email.
- **FR-03 Logout/session:** Logout removes the presented token from sessions; missing token returns HTTP 400; a request with a token returns HTTP 200. The client clears local auth state and returns to login. Todo API requires a valid session; missing/invalid session returns HTTP 401. The client reacts to HTTP 401 by clearing auth and showing login.
- **FR-04 User isolation:** List, read, update, toggle, and delete operations act only on todos owned by the authenticated user. Another user's or nonexistent todo ID is not found (HTTP 404).
- **FR-05 Create todo:** The authenticated user can create a todo with a title, description, and completion state. The UI's create form submits an incomplete todo. Title must be a non-empty string after trimming; description must be a non-empty string in the current server validation; the server normalizes the completion input to a boolean. Success returns HTTP 201 with ID and created/updated timestamps.
- **FR-06 Read todo list/item:** The user can list their own todos and retrieve an own todo by ID. Todo cards display title, description, completion status, created and updated times. An empty result shows an empty state.
- **FR-07 Update todo:** The user can edit title, description, and completion state for an owned todo; successful update refreshes the updated timestamp. Invalid input returns HTTP 400; missing/not-owned item returns HTTP 404.
- **FR-08 Toggle/delete:** The user can toggle completion state; toggling updates the updated timestamp. The user can delete an owned todo after confirming in the UI. Missing/not-owned item returns HTTP 404.
- **FR-09 Find and organize:** The list supports case-insensitive substring search across title and description; active/completed filters; sort by title ascending, created timestamp descending, or updated timestamp descending. The UI offers clearing search and resetting filter/sort.

## Acceptance Criteria (derived baseline checks, not Jira AC)

- **AC-01:** Signup with required values creates an account; duplicate exact email is rejected; successful account has a welcome todo unless one already exists for it.
- **AC-02:** Correct credentials establish an authenticated session and expose user name/email; incorrect credentials are rejected; logout invalidates that token.
- **AC-03:** Unauthenticated requests to todo endpoints are rejected, and an authenticated user cannot read or mutate another user's todo.
- **AC-04:** Create/read/update/toggle/delete operate on owned todos and return the described status/error for invalid input or unavailable ownership/ID.
- **AC-05:** Search, filters, and sort return only matching current-user todos in the selected order, and clear controls restore the default list settings.

## Non-Functional Requirements / Constraints (observed only)

- The application persists accounts, sessions, and todos in JSON files; no database behavior is specified.
- The UI is a browser-based responsive HTML/CSS/vanilla JavaScript app (README statement); no measurable performance, accessibility, availability, retention, or scaling targets were supplied.
- Credential/session handling details are implementation observations, not security requirements: current server hashes passwords with SHA-256 and the client stores the session token in localStorage. No security assurance or target was supplied; security review is outside this baseline.

## Validation Rules, Edge Cases, and Negative Scenarios

- Signup requires truthy name/email/password; the client trims name/email but the backend does not normalize email. Duplicate check is exact/case-sensitive as implemented.
- Login with unmatched email/password returns invalid credentials. Email format/password complexity/length rules are **Not Found** beyond browser email input validation.
- Todo title cannot be blank after trimming; server validation rejects a missing, non-string, or empty description (including empty string); the UI also requires description. Completion input is coerced to boolean by the server.
- Search is case-insensitive and matches title or description; supported filter values are all/active/completed in UI, while only active/completed add server filters. Supported sorting options are title/createdAt/updatedAt.
- Todo IDs not found or owned by another user are indistinguishable as not found.
- File read failures fall back to empty data in current implementation; file-write failures can prevent persistence. Product-level recovery expectations are **Not Found**.

## Dependencies and Constraints

- Local-only workflow; Jira MCP unavailable, so Jira source details cannot be verified.
- Current behavior depends on the existing Node.js/Express app and JSON data files; this document does not request code changes or data migration.
- Existing unrelated local changes must remain untouched.

## Assumptions

- The user's phrase “based on the ToDo app's user/auth/todo behavior” authorizes documenting observed current behavior as a baseline, not treating it as a new feature request or a Jira-approved scope.
- Derived acceptance criteria translate directly observed behavior into checks; they are not sourced from Jira.

## Clarifications

- Jira story summary, description, acceptance criteria, status, labels, and Epic Link: **Not Found** because Jira MCP is unavailable. Effect: feature intent and authoritative acceptance criteria remain unverified; this artifact is limited to observed baseline behavior.
- Desired changes versus documentation-only baseline: **Not Found**. Effect: no new behavior is proposed.
- Email normalization, password rules, session expiry/revocation expectations beyond explicit logout, todo text limits, data retention, and error/recovery expectations: **Not Found**. Effect: no additional business rules are inferred.

## Traceability to Source Requirement

- User request in this session: issue key EPMCDMETST-67543; local-only workflow; requirements based on ToDo app user/auth/todo behavior.
- Code sources inspected: `todoServer.js` (API/session/validation/persistence behavior), `index.html` and `public/script.js` (forms, controls, client flows), `README.md` (feature overview).
- Jira source: unavailable; Jira fields and original acceptance criteria are explicitly marked Not Found.

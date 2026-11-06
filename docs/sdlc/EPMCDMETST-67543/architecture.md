# Architecture — EPMCDMETST-67543

## Architecture recommendation

Document the current application as a single-process Node.js/Express service that serves a vanilla HTML/CSS/JavaScript client and exposes JSON endpoints. Account, session, and todo records are stored in three local JSON files. This is a description of observed behavior, not a proposal to change the product: Jira details are unavailable and the companion `requirements.md` explicitly records the baseline as locally observed.

The browser is served by the same Express application and calls it at `window.location.origin`. Authentication and todo ownership are enforced in the Express process. Search, filter, and sort are applied by the `/todos` endpoint, not solely in browser memory. The client stores presentation state and renders the endpoint's results.

No new frameworks, dependencies, database, or infrastructure are required or implied by this documentation.

## System components

```text
                         same origin (observed client setup)
┌───────────────────────────────────────────────────────────────┐
│ Browser                                                       │
│ index.html + public/styles.css + public/script.js             │
│ Forms, local UI state, localStorage token, DOM rendering      │
└──────────────────────────────┬────────────────────────────────┘
                               │ HTTP JSON + Authorization header
                               ▼
┌───────────────────────────────────────────────────────────────┐
│ Node.js process: todoServer.js (Express, port 3000)           │
│ Static/content routes → auth middleware → API handlers        │
│ Search/filter/sort; ownership checks; validation; timestamps   │
└───────────────┬──────────────────┬─────────────────┬─────────┘
                │                  │                 │ synchronous
                ▼                  ▼                 ▼ file I/O
           users.json         sessions.json       todos.json
           accounts            token → user ID    user-owned items
```

### STORY-ID components & responsibilities

| Component | Current responsibility / evidence |
|---|---|
| `todoServer.js` / Express app | Serves `public/` as static assets, parses JSON bodies, enables CORS, serves `/` from the repository-root `index.html`, listens on port `3000`, and defines all API handlers. |
| Authentication handlers | `POST /signup`, `/login`, and `/logout`; account/session persistence and token-to-user lookup are implemented in the same file. |
| `requireAuth` middleware | Resolves the raw `Authorization` header against `sessions.json`; sets `req.userId` or returns HTTP 401. Applied to todo routes. |
| Todo handlers | List/read/create/update/toggle/delete; select by both todo ID and authenticated user ID; validate create/update input; apply list search/filter/sort. |
| JSON persistence helpers | Synchronous `fs.readFileSync` / `writeFileSync` of `users.json`, `sessions.json`, and `todos.json` under `__dirname`. Read/parse errors fall back to empty structures; write errors are handled inconsistently by the callers. |
| `index.html` | Browser page, authentication and todo forms/modals, search/filter/sort controls, and script/style references. |
| `public/script.js` | Vanilla JavaScript client: auth and todo fetches, token/name/email localStorage, local interaction state, status handling, and DOM updates. Uses `window.location.origin` as the API base. |
| `public/styles.css` | UI styling. Referenced by `index.html`; no server-side role. |
| `package.json` | Runtime dependencies Express 4, CORS, UUID; `npm start` runs `npx nodemon todoServer.js`. `uuid` is declared but is not used by the inspected server code. |

This repository does not have a separate controller/service/repository layering: routes, request handling, authentication, business rules, and persistence functions are colocated in `todoServer.js`.

## Technology choices and rationale

| Choice | Observed reason / rationale | Alternatives not selected |
|---|---|---|
| Node.js + Express 4 | Existing server and route implementation. | No framework migration is requested or evidenced. |
| Vanilla HTML/CSS/JavaScript | Existing client is served as static files; no frontend build step is present in `package.json`. | No React or client framework is needed to describe this baseline. |
| JSON files | README and code identify `users.json`, `sessions.json`, and `todos.json` as persistence. | No database is configured or evidenced. |
| Same-origin API URL | Client derives its API base from `window.location.origin`, and Express serves the UI. | A separately hosted API is not evidenced. |
| CORS middleware | `cors()` is enabled without options in the server. | No explicit origin allowlist is configured. |

## Data flow

1. **Page delivery:** The browser requests `/`; Express responds with repository-root `index.html`. The page loads `public/script.js` and `public/styles.css` from the static middleware. Google Fonts and Material Icons are referenced from Google-hosted URLs in the HTML.
2. **Registration:** The browser submits name, email, and password JSON to `/signup`. The server validates required truthy values, compares email by exact string equality, hashes the password, writes the user record, and adds a welcome todo if that user has no todo. The response is HTTP 201. The client then prompts the visitor to log in.
3. **Login/session:** The browser posts email/password to `/login`. The server hashes the supplied password for comparison, generates a 32-byte random token encoded as hex, writes token → user ID to `sessions.json`, and returns token/name/email. The client stores these values in localStorage. The token is sent verbatim in `Authorization`.
4. **Todo access:** For a todo request, `requireAuth` looks up the authorization-header value in `sessions.json`. The handler loads `todos.json` and scopes results or mutations to `req.userId`. The `/todos` GET handler applies optional case-insensitive substring search across title and description, `active`/`completed` filtering, and supported ordering (`title`, `createdAt`, `updatedAt`) on the server.
5. **Mutation:** Create/update/toggle/delete handlers modify the in-memory array and synchronously write the JSON file. Create/update set ISO timestamps; toggle updates `updatedAt`. A successful operation returns the created/changed/deleted todo representation.
6. **Client rendering/logout:** The client creates todo DOM nodes and renders titles/descriptions with `textContent`. A 401 from todo listing clears local auth state and returns to login. Logout posts the token to `/logout`, which deletes it from persisted sessions, then clears browser localStorage.

## API contract (observed)

All responses and request bodies below are JSON unless noted; the server does not define a versioned API prefix.

| Method and path | Auth | Behavior and observed responses |
|---|---|---|
| `POST /signup` | No | Body `{name,email,password}`. `201` `{message}`; `400` for missing/falsy required fields; `409` for exact duplicate email. |
| `POST /login` | No | Body `{email,password}`. `200` `{token,name,email}`; `401` `{error}` for invalid credentials. |
| `POST /logout` | Token required in header, but not `requireAuth`-protected | Deletes the supplied token if present. `400` if no header; otherwise `200` `{message}` even if token was unknown. |
| `GET /todos` | Yes | Own todos only. Optional query parameters: `search`, `filter` (`active`/`completed`; other values add no filter), `sort` (`title`, `createdAt`, `updatedAt`). Returns `200` array. |
| `GET /todos/:id` | Yes | Own todo only; `200` item or `404` if absent/not owned. |
| `POST /todos` | Yes | Body `{title,description,completed}`. Completion is coerced to boolean. Requires nonblank string title, string non-empty description, and boolean completion after coercion. `201` item; `400` invalid input. |
| `PUT /todos/:id` | Yes | Replaces title/description/completion using the request body and updates timestamp. `200` item; `400` invalid input; `404` absent/not owned. |
| `PATCH /todos/:id/toggle` | Yes | Flips completion and updates timestamp. `200` item; `404` absent/not owned. |
| `DELETE /todos/:id` | Yes | Deletes own todo. `200` deleted item; `404` absent/not owned. |

Todo endpoints return `401` when the token is missing or not present in the session map. Existing routes and response shapes are recorded for context; this task does not request API changes.

## Security concerns and boundaries

These are implementation observations and risks, not claims that the current application is production-secure or that controls exist beyond those noted.

- **Password storage:** `hashPassword` uses unsalted SHA-256, which is not a password-hashing scheme designed to resist offline guessing. Password policy, throttling, and account recovery are not implemented in the inspected code.
- **Token handling:** Tokens are generated with `crypto.randomBytes(32)`, but are stored in browser `localStorage` and sent in a custom raw `Authorization` header. JavaScript-accessible storage increases the impact of a client-side script injection. No expiry, rotation, or periodic cleanup is implemented; explicit logout removes a token.
- **Transport:** The application code does not configure TLS/HTTPS. Credentials and bearer tokens therefore require a trusted TLS-terminating deployment in any non-local network use; no such deployment is documented here.
- **Cross-origin policy:** `cors()` is enabled with default options, which does not establish an application-specific origin allowlist. CORS is not an authentication control.
- **Request handling:** `express.json()` is configured without app-specific options in the inspected code. No explicit rate limiting, security-header middleware, or centralized request schema validation is present.
- **Data isolation:** Todo routes scope by `userId`, and item lookup/mutation combines ID with the authenticated user. This is the primary observed authorization boundary. IDs are predictable sequential integers; authorization must continue to be enforced server-side.
- **Persistence integrity/availability:** JSON reads are synchronous and malformed/unreadable files are treated as empty data. Writes are synchronous in-place and generally lack atomic replacement/locking. Concurrent processes, interrupted writes, or write failures can lose/corrupt state. Some user/session write return values are not checked before success responses.
- **Client rendering:** Todo title and description are placed into text nodes using `textContent`, avoiding HTML interpretation at those render points. Other future rendering paths must preserve safe output handling.
- **Secrets/data exposure:** User JSON includes password hashes and sessions JSON includes active bearer tokens. These files must be treated as sensitive persistent data and excluded from public artifacts/backups or source control as appropriate. This document contains no data-file contents.

Security hardening is outside the documentation-only scope; no new control is asserted or prescribed as already implemented.

## Deployment and runtime assumptions

### Verified from repository

- README recommends Node.js v14 or higher and npm; package metadata pins dependency ranges, not a Node engine version.
- `npm start` invokes `npx nodemon todoServer.js`, so the documented start command uses nodemon rather than a production process manager.
- The server listens on fixed port `3000`; the port is not read from an environment variable in `todoServer.js`.
- The app serves static assets from relative path `public` and sends `index.html` from `__dirname`. The three JSON persistence paths are also rooted at `__dirname`.
- The app requires write access to its directory for the data files. Those files hold the only observed persistent accounts, sessions, and todos; process restart does not itself clear them.
- No deployment manifest, container, cloud configuration, TLS setup, health check, or production start script is present in the inspected repository.

### Operational assumptions and limitations

- The observed persistence model assumes one application process writing the same local files. Multiple replicas or concurrent independent writers are not safe to assume because there is no shared datastore, locking, or distributed session store.
- Deployment must preserve the JSON files and make them writable if data is expected to survive restarts. Backups and recovery are operational concerns not specified by the application.
- A reverse proxy or other TLS termination would be an external deployment responsibility; none is configured in the app.
- The same-origin UI/API arrangement assumes the browser is served from the Express application's origin. CORS is enabled, but the code does not document a separate frontend/API topology.
- The README provides a local startup flow (`npm install`, `npm start`, browse to `http://localhost:3000`); production topology, availability, scaling, backup cadence, and retention are unspecified.

## Error handling and known constraints

- Invalid signup fields produce `400`; duplicate exact email produces `409`; failed login produces `401`; missing/invalid todo auth produces `401`; validation failures produce `400`; missing or non-owned todo IDs produce `404`.
- JSON read and parse errors fall back to empty arrays/maps. Todo write failure can return `500` in create/update/toggle/delete handlers. Signup and session writes log write errors but callers do not consistently abort with an error response.
- Error response text and shape vary by route. No centralized error handler or structured logging configuration was found.
- Jira summary, description, and acceptance criteria remain unverified per `requirements.md`. This architecture records the implementation baseline and does not infer a feature change.

## Risks

| Risk | Impact / constraint |
|---|---|
| JSON files used as the system of record | Data integrity, write contention, and scaling are constrained; multi-instance deployment is unsupported by observed design. |
| Weak password hashing and persistent browser token | Increased account/session compromise impact; there is no expiry or TLS configuration in the application. |
| Fixed port and local filesystem coupling | Deployment requires port mapping and a persistent writable filesystem; these are not environment-configurable in current code. |
| Success responses despite some persistence write failures | Client can believe account/session state was saved when it may not have been. |
| Jira acceptance criteria unavailable | No additional product scope or target behavior can be validated or designed from this repository alone. |

## FR → design traceability

| Requirement baseline | Architecture location |
|---|---|
| FR-01 registration | `POST /signup`; Authentication handlers; data flow step 2. |
| FR-02 login | `POST /login`; Authentication handlers; data flow step 3. |
| FR-03 logout/session | `POST /logout`, `requireAuth`; data flow steps 3 and 6; Security concerns. |
| FR-04 user isolation | `requireAuth`, todo handlers; data flow step 4; Security concerns. |
| FR-05 create todo | `POST /todos`; data flow step 5. |
| FR-06 read list/item | `GET /todos`, `GET /todos/:id`; data flow steps 4 and 6. |
| FR-07 update todo | `PUT /todos/:id`; data flow step 5. |
| FR-08 toggle/delete | `PATCH /todos/:id/toggle`, `DELETE /todos/:id`; data flow step 5. |
| FR-09 find and organize | Server-side query processing in `GET /todos`; data flow step 4. |

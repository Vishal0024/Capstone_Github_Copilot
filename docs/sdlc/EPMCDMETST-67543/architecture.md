# Architecture - EPMCDMETST-67543

## Architecture recommendation

Implement the date presentation entirely in the existing browser-side todo-card rendering path in `public/script.js`. Keep `GET /todos`, create/update requests, the persisted todo shape, filtering, sorting, and all server behavior unchanged. The client already receives `createdAt` and `updatedAt`, builds each card in `renderTodos(data)`, and refreshes the list after successful create/edit operations. Format and validate those existing values when rendering, and replace the existing single timestamp string with separately labeled Created and conditional Edited text nodes.

Use the built-in `Date` and `Intl.DateTimeFormat` APIs (no dependency). Format in the browser's local time zone as `DD Mon YYYY`; emit all user-visible date strings through `textContent`. Keep date nodes within `.todo-timestamp` so existing card metadata styling applies. Ensure the metadata can wrap at narrow widths rather than forcing horizontal scrolling; add the smallest possible responsive style adjustment in existing `public/styles.css` if the rendered labels need it. Preserve all unrelated interactions and the existing post-create/edit refresh flow.

There is no React or Spring Boot application in this checkout; this is a vanilla HTML/CSS/JavaScript client and Express API. Architecture responsibilities below reflect the actual repository and do not propose new framework layers. The requested artifact is the only file to change for this design step.

## Component diagram

```text
+------------------- Browser / index.html ----------------------+
|                                                               |
| controls and .outputData                                      |
|        |                                                      |
|        v                                                      |
| public/script.js                                              |
|   - fetchAndRenderTodos() ------+                             |
|   - renderTodos(data)            |                             |
|       - validate/format dates    |                             |
|       - create safe card DOM     |                             |
|   - create/edit success -> refresh                            |
|        |                                                      |
+--------|------------------------------------------------------+
         | authenticated HTTP; existing API contract
         v
+------------------- todoServer.js (Express) -------------------+
| GET /todos returns todos including createdAt / updatedAt      |
| POST /todos and PUT /todos/:id assign/preserve timestamps     |
| Existing filtering, sorting, persistence, auth remain intact  |
+---------------------------------------------------------------+
```

## EPMCDMETST-67543 components & responsibilities

| Component | Responsibility for this story |
|---|---|
| `public/script.js` - `fetchAndRenderTodos()` | Continue requesting the same filtered/sorted todo array. On successful create/edit the current implementation calls it again, so server-generated timestamp changes are reflected without a page reload. No endpoint or query changes. |
| `public/script.js` - `renderTodos(data)` | Retain card construction and existing title/description/actions behavior. For each todo, create `.todo-timestamp` metadata and independently render Created and (when eligible) Edited labels. Parse and validate raw timestamp values before formatting. |
| Date presentation helper in `public/script.js` | A small pure helper (or equivalent local logic) accepts a timestamp, returns a formatted string only for a valid date, and uses built-in formatting with local timezone. For a stable two-digit day and English abbreviated month, use `Intl.DateTimeFormat('en-GB', { day: '2-digit', month: 'short', year: 'numeric' })`; do not set `timeZone`, so the user's local zone is used. Compare parsed epoch values, not formatted strings. |
| `index.html` | No structural change is expected: the card list remains mounted under `.outputData`; existing stylesheet and script links remain. Additions are not required to the static page markup. |
| `public/styles.css` | Reuse `.output .todo-timestamp` metadata typography. If needed, allow it to wrap (for example `overflow-wrap: anywhere` or a flex/grid wrapping layout) and verify at viewport widths <= 480px; avoid fixed-width metadata or horizontal overflow. No new stylesheet or dependency. |
| Existing todo API in `todoServer.js` | No story implementation change. It remains source of timestamp values and owns timestamp creation/update. Existing `/todos` response already includes both fields. |
| Automated tests | Use Node's built-in `node:test` runner and `node:assert` with a minimal test DOM to exercise the production `renderTodos` path. Run with `npm test`; cover formatting, Edited eligibility, invalid/missing values, and safe text rendering. No framework or dependency is added. |

### Rendering rules

1. A valid `createdAt` produces `Created <DD Mon YYYY>` (examples in the Story use `Created 05 Oct 2026`). Missing, empty, or invalid `createdAt` produces exactly `Created: Not available`.
2. Render `Edited <DD Mon YYYY>` only when both dates are valid and parsed `updatedAt` is strictly later than parsed `createdAt`. Otherwise omit the Edited node entirely. In particular, if creation time is invalid, an Edited date cannot be proven later and is omitted.
3. Create each label as a DOM text node/element and set its `textContent`; do not interpolate date or API-provided values into HTML.
4. Keep date formatting to date precision; do not show time or relative time.

## Technology choices

| Choice | Reason | Rejected alternative |
|---|---|---|
| Browser-side formatting during existing card rendering | Date metadata is presentation-only; the current UI owns card rendering and already receives both source fields. Avoids coupling server query/API to display format. | Backend formatting or a new date endpoint: duplicates presentation logic and changes an API/data contract without requirement. |
| Native `Date` parsing plus `Intl.DateTimeFormat` | Meets built-in API and no-dependency constraints; local timezone is the default when no `timeZone` is supplied. | Third-party date library or fixed UTC output: adds dependency or violates local-time requirement. |
| DOM elements plus `textContent` | Safely displays labels and handles untrusted/malformed input as text. | `innerHTML` string templates for user/API-derived data. |
| Existing `.todo-timestamp` styles and responsive stylesheet | Consistent visual language, minimal surface area, mobile-safe wrapping. | New component framework, design system, or fixed-width/overflowing metadata. |
| Existing refresh-after-mutation behavior | Backend remains authoritative for timestamps and the updated list is fetched without reloading the document. | Client-generated timestamps or optimistic replacement with incomplete server data. |

## Data flow

1. `fetchAndRenderTodos()` makes the existing authenticated `GET /todos` call with the current filter, sort, and optional search.
2. Express returns an array of todo objects; each may contain ISO timestamp strings `createdAt` and `updatedAt`.
3. `renderTodos(data)` clears and reconstructs `.outputData` as today. For each item, it validates dates, formats valid dates for the local timezone, and builds metadata text using safe DOM APIs.
4. After a successful create or edit, existing submission handlers close the modal and call `fetchAndRenderTodos()`. The server response/list supplies its authoritative new `createdAt`/`updatedAt`; the card date text updates without a full page reload.
5. Search, filtering, sorting, completion, delete, authentication, and modal flows remain unchanged. Completion can update `updatedAt` on the server; the existing refresh then displays Edited if the timestamp is later than creation, in accordance with the specified timestamp rule.

## Low-level design

### Backend

No backend implementation is proposed. There are no Spring layers in this repository. Existing Express `todoServer.js` behavior is sufficient:

- `GET /todos`: returns the authenticated user's todos with existing `createdAt` and `updatedAt` fields.
- `POST /todos`: creates timestamps server-side and returns the created todo.
- `PUT /todos/:id`: updates `updatedAt` server-side and returns the updated todo.
- No entity/schema, repository, service, controller, validation, error, persistence, or API changes are required.

### Frontend

- **State:** Keep `currentTodos` and the existing search/filter/sort state unchanged. Do not create a second timestamp cache or client-owned timestamp state.
- **API module:** There is no separate API module in the current client. Keep use of `fetchWithAuth()`/`fetchAndRenderTodos()`; do not add one for this display-only story.
- **Rendering:** Add a pure formatter/validation helper in `public/script.js` near the existing rendering utilities. It should reject absent/invalid dates (e.g. check `Number.isNaN(date.getTime())`) and return a date string or a null/invalid result. Compare milliseconds before formatting for Edited eligibility. Create `.todo-timestamp` children and set `textContent`.
- **Timestamp input guard (D-2 / F-02):** Before constructing or parsing a `Date`, accept only string inputs whose trimmed value is non-empty. Reject missing/absent, `null`, empty, whitespace-only, and all non-string values; then reject any parsed invalid date. An invalid creation value uses the fallback and prevents Edited from rendering.
- **Test strategy (D-1 / F-01):** Add focused tests in `tests/` using only Node's built-in `node:test` and `node:assert`, plus a minimal DOM harness that runs the actual `renderTodos` implementation and inspects rendered nodes/text. Expose the tests through `npm test` (`node --test`); do not add dependencies.
- **Testing hooks:** Add stable attributes to date labels for automated selection, e.g. `data-testid="todo-created-at"` to the Created element and `data-testid="todo-edited-at"` only when Edited is rendered. If a card-level hook is needed, use `data-testid="todo-card"`; repeated values are appropriate for repeated cards. Tests should assert rendered text and node absence/presence, not implementation-specific helper names.
- **CSS:** Reuse `.todo-timestamp`; allow labels to wrap and maintain metadata contrast/readability on widths <= 480px. Preserve card action layout and avoid horizontal scrolling.
- **No new dependencies/frameworks:** Use only browser-native APIs and current app assets.

## API contract

No API change; existing clients and server remain compatible.

| Operation | Existing contract relevant to this feature | Story impact |
|---|---|---|
| `GET /todos` | Authenticated `200` with an array of todo objects, including `createdAt` and `updatedAt` where present; existing filter/sort/search query parameters are unchanged. | Client reads the two existing fields. Missing/invalid values are tolerated client-side. |
| `POST /todos` | Existing authenticated create request; server assigns timestamps and responds with created todo. | Existing client refetches list after success; no request/response change. |
| `PUT /todos/:id` | Existing authenticated update request; server updates `updatedAt` and responds with updated todo. | Existing client refetches list after success; no request/response change. |

No new query parameter, response property, timestamp mutation, or format guarantee is added at the API boundary. `createdAt`/`updatedAt` remain API data values; formatting is strictly a frontend presentation concern.

## ASCII wireframe

```text
+----------------------------- todo card ------------------------------+
| Active                                                               |
| Task title                                                           |
| Task description                                                     |
| Created 05 Oct 2026                                                   |
| Edited 06 Oct 2026        (only if updatedAt > createdAt)              |
| [Edit] [Delete] [Mark Complete]                                      |
+------------------------------------------------------------------------+

Mobile (width <= 480px; metadata wraps, no horizontal scroll):
+----------------------+
| Active               |
| Task title           |
| Task description     |
| Created 05 Oct 2026  |
| Edited 06 Oct 2026   |
| [Edit] [Delete]      |
| [Mark Complete]      |
+----------------------+
```

## Error handling

- Missing, empty, or unparsable `createdAt`: render `Created: Not available`; do not throw or prevent other cards from rendering.
- Missing, empty, or unparsable `updatedAt`: omit Edited.
- `updatedAt` earlier than or equal to `createdAt`: omit Edited.
- Invalid creation value with otherwise valid updated value: render creation fallback and omit Edited because comparison is not meaningful.
- Invalid timestamps must be isolated to the affected card; the rest of the response continues to render.
- Existing network/auth/API error handling remains unchanged. This story adds no new requests or failure modes.
- Use `textContent`; do not allow malformed timestamp strings or labels to be interpreted as markup.

## Risks and mitigations

| Risk | Mitigation |
|---|---|
| Browser local timezone can cause the calendar date to differ from UTC | This is explicitly required: omit an explicit timezone from the formatter and test using a controlled timezone where the test environment supports it. |
| Locale output can vary between runtimes | Use an explicit `en-GB` formatter with two-digit day, short month, and numeric year; verify output contract `DD Mon YYYY`. |
| Bad legacy data can break date parsing | Validate each parsed date and use the specified fallback/omission behavior rather than throwing. |
| Metadata may wrap or crowd card actions on narrow screens | Keep the current metadata class, allow wrapping, and verify at <= 480px; do not constrain it to a single line. |
| No automated test command/framework is declared in current `package.json` | Confirm test tooling before implementation; add focused tests using existing approved setup. Do not add a dependency without requirement/approval. |
| Repository has no `docs/KNOWN-ISSUES.md` or architecture-design template | Design is based on the provided requirements and checked current source. No blocker for this frontend-only design; record as an artifact/input limitation. |

## FR - design traceability

| Requirement | Design response |
|---|---|
| FR-001 / AC-001 - show creation date in card metadata | `renderTodos` adds a Created metadata element for every card; invalid data uses the explicit fallback (FR-004). |
| FR-002 / AC-002 - `DD Mon YYYY`, user's local timezone | Browser-side native `Date` + `Intl.DateTimeFormat` with explicit day/month/year and no timezone override. |
| FR-003 / AC-003 - show Edited only when update is later | Compare valid parsed epoch values and render Edited only for strict `updatedAt > createdAt`. |
| FR-004 / AC-004 - fallback/omission and list resilience | Validate timestamps per card; creation fallback; omit invalid/missing update label; isolate invalid records from list rendering. |
| FR-005 / AC-005 - update immediately after create/edit without reload | Preserve existing mutation-success - `fetchAndRenderTodos()` flow, then render server-provided timestamps. |
| NFR-001 / AC-006 - consistent and mobile-safe | Reuse `.todo-timestamp` metadata style; permit wrapping and verify at widths <= 480px. |
| NFR-002 - safe text rendering | Create DOM nodes and assign `textContent`; no HTML interpolation. |
| NFR-003 - test IDs | Add stable `data-testid` hooks to Created and conditional Edited metadata, optionally card. |
| NFR-004 - built-in formatting/no dependencies | Native `Date`/`Intl`; no new framework or package. |
| NFR-005 / AC-007 - preserve unrelated behavior | Confine implementation to timestamp rendering and minimal metadata CSS; leave API, state, and other actions unchanged. |
| AC-008 - automated date tests | Plan focused tests for formatting, conditional Edited, and missing/invalid fallback; test hooks provided. |

## Decisions

1. **DEC-67543-01 - Client-side presentation:** Format and compare timestamps in `renderTodos`; do not alter backend/API behavior.
2. **DEC-67543-02 - Native local date formatting:** Use built-in parsing/formatting and local timezone, with explicit `DD Mon YYYY` output.
3. **DEC-67543-03 - Robust conditional metadata:** Always represent creation with a fallback; render Edited only for valid strictly later updates.
4. **DEC-67543-04 - Safe and testable DOM:** Render text through `textContent` and expose stable `data-testid` hooks.
5. **DEC-67543-05 - Responsive minimal change:** Reuse existing metadata styles, allow wrapping at mobile widths, and avoid unrelated behavior changes.
6. **D-1 / F-01 - Built-in test runner:** Use dependency-free Node `node:test` and `node:assert` tests of the production rendering path, invoked by `npm test`.
7. **D-2 / F-02 - Strict timestamp input validation:** Reject missing, null, empty, whitespace-only, and non-string timestamp values before parsing; reject invalid parsed dates as well.

## Input limitations

`docs/KNOWN-ISSUES.md` and an `architecture-design` template are not present in the checkout. The `requirements.md` is present and was used as the approved source. The current implementation is vanilla JavaScript/HTML/CSS with an Express API rather than the Spring/React stack described by the generic agent template; this architecture follows the actual codebase.

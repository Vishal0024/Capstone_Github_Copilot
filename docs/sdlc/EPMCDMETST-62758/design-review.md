# Design Review (Rerun)

- **Story ID**: EPMCDMETST-62758
- **Branch**: `feature/EPMCDMETST-62758`
- **Mode**: Review
- **Approved architecture update**: `87e9879b64d57e9cfa385f35cd89e53a9ce9518f`
- **Inputs reviewed**: `requirements.md`, the architecture at the approved commit, the prior design review, `impl-plan.md`, `package.json`, `todoServer.js`, `index.html`, `public/script.js`, `tests/todo-api.integration.test.js`, and `tests/git-safety-guard.test.js`.
- **Verdict**: **APPROVED WITH CHANGES**

## Resolution of prior findings

- **Prior F-1 (repository/target mismatch)** remains resolved: the user authorized a distinct book-browsing feature in this repository with a small local sample catalog. The architecture isolates it under `/books` and `/api/books`, keeps the catalog outside `public/`, and explicitly says it is not authoritative inventory.
- **Prior F-2 (undecided filter semantics)** is resolved by the user's approval recorded in the architecture's `Approved filter semantics` and AD-5. The architecture now specifies UTC rolling 30/180/365-day windows with inclusive lower cutoffs; numeric 5-star averages with inclusive `>=4` and `>=3` thresholds and unrated records excluded when review filtering is active; exclusion of missing/invalid category metadata only when that category is filtered; single-select within each category; and AND across categories. Those decisions are connected to the API, controls, query behavior, and tests. The requirements' original open-question text is unchanged, as the architecture explicitly records the later approval.
- **Prior D-3** is partially reflected: architecture §Components and responsibilities calls for deterministic date-boundary tests and To-Do regression tests without changing To-Do fixtures, and the rest of the design protects `/`, `/todos`, and the existing authentication boundary. It does not specify the concrete root-route and `/todos` auth/response assertions the prior decision requested.
- **Prior D-4** is not reflected: the architecture does not require safe text rendering of catalog-controlled book fields.
- **Prior D-5** is partially reflected: the architecture requires catalog read/parse/validation failures to fail closed with generic `500`, but does not define the top-level catalog shape or required-record field/type validation that determines when catalog data is invalid.

## Findings

| ID | Severity | Area | Risk or gap | Recommendation |
|---|---|---|---|---|
| F-3 | MINOR | Testing / To-Do regression | Architecture §Components and responsibilities requires existing To-Do regression coverage, while the component/data-flow sections preserve the root page and `/todos` behavior. The test scope does not explicitly require assertions that `/` still serves the To-Do page and that `/todos` retains its existing auth and response contract. Current `tests/todo-api.integration.test.js` covers authenticated CRUD and unauthenticated `/todos`, but not the root route. | Specify integration assertions for `/`, `/todos` authentication, and the existing `/todos` response contract, without modifying To-Do fixtures or persistence. |
| F-4 | MINOR | Security / browser rendering | The architecture describes rendering book cards but gives no safe-rendering constraint. If catalog-controlled titles/authors are interpolated into `innerHTML`, catalog content could be interpreted as markup or script. | Require DOM construction and `textContent` (or an equivalent safe text renderer) for all catalog-controlled fields; do not interpolate book data into HTML. |
| F-5 | MINOR | Catalog validation / fail-closed behavior | The architecture says records contain “at least” a list of fields and that a catalog validation failure returns generic `500`, but it does not define a valid top-level structure or required-field types/domains. Implementations could therefore accept malformed structures or disagree about which records invalidate the catalog. | Define the catalog as a top-level array and specify required-field validation for identity/display fields and genre. Define filter metadata as optional but validate its type/domain when present; missing/invalid filter metadata must remain a non-match only when that category is active, per the approved semantics. Treat invalid catalog structure or required fields as a generic server failure rather than silently dropping records or broadening results. |

## Proposed design decisions

| Decision ID | Decision | Resolves finding(s) | Changes `architecture.md`? |
|---|---|---|---|
| D-3 | Make To-Do regression assertions explicit: verify `/` still serves the To-Do page, `/todos` remains protected as before, and authenticated `/todos` response behavior remains unchanged; do not alter To-Do fixtures or persistence. | F-3 | Yes |
| D-4 | Require safe DOM text rendering for every catalog-controlled field; never interpolate book data into `innerHTML`. | F-4 | Yes |
| D-5 | Define the top-level catalog shape and required identity/display/genre field validation. Validate optional filter metadata when present, while preserving the approved rule that missing/invalid metadata excludes a record only when that category is active; fail closed with a generic server error for invalid catalog structure or required fields. | F-5 | Yes |

## Traceability

| Requirement / acceptance criterion | Architecture coverage and review assessment |
|---|---|
| FR-001 / AC-001 | `/books` defaults to Non-Fiction and presents Book Format, Language, Publication Date, and Customer Reviews. Shared definitions are used across genre scopes. |
| FR-002 / AC-002 | The shared option definitions specify the exact Book Format options: hardcover, paperback, eBook, audiobook. |
| FR-002 / AC-003 | The shared option definitions specify the exact Language options: English, Spanish, French, German. |
| FR-002 / AC-004 | The shared option definitions specify the exact Publication Date options: last 30 days, last 6 months, last year; the approved UTC rolling periods are 30, 180, and 365 days with inclusive lower cutoffs. |
| FR-002 / AC-005 | The shared option definitions specify the exact Customer Reviews options: 4-stars and above, 3-stars and above; approved numeric 5-star thresholds are inclusive `>=4` and `>=3`, with unrated records excluded under an active review filter. |
| FR-003 / AC-006 | `/api/books` applies the selected category predicate within the selected genre. Approved date and review semantics are explicit; missing/invalid category metadata excludes a record only when that category is active. Tests are specified for cutoffs, thresholds, unrated records, and active/inactive category handling. |
| FR-004 / AC-007 | The query boundary combines selected categories with AND; each category is single-select, and the API rejects duplicate/multi-value filter parameters. |
| FR-005 / AC-008 | Clearing omits that category's parameter while preserving other selections; clearing all optional filters returns the broader result set for the selected genre. |
| FR-006 / AC-009 | Fiction and Non-Fiction share one option definition, and the architecture specifies parity tests for the rendered controls. |
| Non-functional requirements | Requirements specify no measurable NFR. The local sample and no-pagination proposal are bounded to the authorized demonstration scope; the architecture does not invent performance or accessibility thresholds. |

## Review assessment

- **Requirement coverage:** The architecture covers all six functional requirements and maps them to all nine acceptance criteria. The user-approved semantics close the former F-2 gap without changing the source requirements artifact.
- **Stack and boundaries:** Express, static HTML/CSS, browser-native JavaScript, JSON, Node's built-in test runner, and Supertest align with `package.json` and the inspected source. The separate page/client, query module, and local catalog keep book behavior outside To-Do client state and persistence.
- **Compatibility:** `/books` and `/api/books` are additive. The architecture preserves `/`, `/todos`, existing auth behavior, response contracts, and To-Do data. Regression scope should be made specific per F-3.
- **Error handling and data:** Invalid request values return `400`; valid empty results return `200 []`; catalog failures return generic `500`. The missing catalog schema detail is F-5. Approved conditional metadata behavior is explicit.
- **Security:** Keeping the sample catalog outside the static directory and serving public read-only results are appropriate. Safe rendering is not specified and remains F-4.
- **Testing:** The architecture covers filter boundaries, combination semantics, clearing, parity, catalog errors, and general To-Do regression. Add the precise To-Do contract assertions in D-3. The inspected existing integration tests demonstrate the current auth/CRUD convention; no book implementation exists yet.
- **Operational scope:** A bounded, non-authoritative local sample without pagination is reasonable for this Story; growth beyond that purpose requires revisiting limits and storage.
- **Plan status:** `impl-plan.md` still carries the prior policy gate and is intentionally not changed in this Step 3 rerun. It must be refreshed in Step 4 to use the approved semantics.

## Verdict

**APPROVED WITH CHANGES** — no BLOCKER or MAJOR findings remain. Prior F-2 is resolved by the approval recorded in architecture commit `87e9879b64d57e9cfa385f35cd89e53a9ce9518f`. The remaining findings are MINOR clarifications: make the To-Do regression checks explicit (F-3), require safe text rendering (F-4), and define enforceable catalog-shape/record validation (F-5). No architecture, implementation plan, or production code was changed during this review.

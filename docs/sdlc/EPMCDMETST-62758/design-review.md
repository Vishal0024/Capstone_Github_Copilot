# Design Review (Rerun)

- **Story ID**: EPMCDMETST-62758
- **Branch**: `feature/EPMCDMETST-62758`
- **Mode**: Review
- **Revised architecture commit**: `e0157ea5f7983e2219fb1394ead8ada37a9ff819`
- **Inputs reviewed**: `requirements.md`, revised `architecture.md`, prior `design-review.md`, `package.json`, `todoServer.js`, `index.html`, `public/script.js`, `tests/todo-api.integration.test.js`, and `tests/git-safety-guard.test.js`.
- **Verdict**: **APPROVED WITH CHANGES**

## Resolution of prior blocker

The prior review's **F-1 BLOCKER** is resolved by the user's explicit authorization to add a separate book-browsing feature to this repository using a small local sample catalog. The revised architecture records that authorization and proposes an isolated `/books` surface, `/api/books` route, `bookCatalog.js` query boundary, and catalog outside `public/`; it preserves the To-Do page, API, and data. A shared options definition for Fiction and Non-Fiction supplies an in-surface parity reference. This authorization does not make the sample catalog authoritative production inventory.

The former assumptions that a different storefront, external Fiction implementation, or external catalog/API owner must be found no longer apply. This rerun does not treat the filter-semantics proposals in the revised architecture as user-approved.

## Findings

| ID | Severity | Area | Risk or gap | Recommendation |
|---|---|---|---|---|
| F-2 | MAJOR | Requirement determinism / implementation readiness | The exact cutoff arithmetic/timezone/inclusivity for publication windows, rating scale and threshold policy, missing-metadata behavior, and same-category selection/cardinality remain undecided. The architecture labels its defaults as unapproved. Different reasonable choices change required filter results and tests. | Preserve the explicit gate already in the architecture: obtain and record product approval for each policy before implementing the affected predicates, control cardinality, API multi-value behavior, or boundary tests. Do not select any tabled default by implication. These are blockers to implementing those specific behaviors, but not blockers to approving the architecture because the proposal clearly prevents implementation from treating them as settled. |
| F-3 | MINOR | Testing / regression | The proposed test files and topics fit the repository's Node built-in test runner and Supertest conventions (`npm test`, `test:unit`, and `test:integration`). The architecture does not explicitly require a controlled reference clock for date-boundary tests or regression checks that the existing To-Do route/auth behavior remains unchanged. | Add deterministic boundary tests using a controlled time source after date policy approval; use fixtures that exercise every option and important no-match/boundary case. Test that Fiction and Non-Fiction expose identical exact labels/options, and retain integration coverage for `/`, `/todos`, and the existing authentication contract. |
| F-4 | MINOR | Security / browser rendering | The sample catalog is local and read-only, which limits exposure, but book titles/authors are data rendered by a new browser client. The design does not specify safe text rendering. Interpolating record fields into `innerHTML` could turn catalog edits into script injection. | Specify DOM creation with `textContent` for catalog fields (or an equivalent safe renderer); do not interpolate record data into HTML. |
| F-5 | MINOR | Error handling / operations | The design correctly returns a generic `500` for catalog read/parse failures and bounds this feature to a small sample. It does not explicitly define behavior for valid JSON with an invalid top-level shape or malformed records, nor a fail-closed check that the catalog remains a bounded sample. | Validate the catalog's top-level structure and required fields at the query boundary; surface invalid catalog data as a generic server error rather than silently returning an empty list or broadening results. Keep the sample-size constraint explicit; revisit limits/pagination if the catalog scope grows. |

## Proposed design decisions

| Decision ID | Decision | Resolves finding(s) | Changes `architecture.md`? |
|---|---|---|---|
| D-1 | Mark the prior repository/target blocker resolved: the user authorized a separate book-browsing surface here with a small local sample catalog; do not treat it as an authoritative inventory. | Prior F-1 (resolved) | No |
| D-2 | Keep date-window, rating, missing-metadata, and same-category selection defaults unapproved; require recorded product decisions before implementing the affected behavior. | F-2 | No — the architecture already states this gate. |
| D-3 | Add the deterministic test and existing To-Do regression expectations described in F-3. | F-3 | Yes |
| D-4 | Require safe text rendering for book catalog fields in the browser. | F-4 | Yes |
| D-5 | Specify catalog shape/record validation and fail-closed handling, while retaining the bounded local-sample scope. | F-5 | Yes |

## Traceability

| Requirement / acceptance criterion | Architecture coverage and review assessment |
|---|---|
| FR-001 / AC-001 | `/books` defaults to Non-Fiction and presents the four required categories. The shared option definitions are a suitable source; verify their rendered labels in tests. |
| FR-002 / AC-002–AC-005 | The Filter Model specifies the exact required visible options, including the `eBook` label, with separate suggested API tokens. Shared definitions avoid Fiction/Non-Fiction drift. |
| FR-003 / AC-006 | The book query boundary applies a selected category predicate. Format/language behavior is described; publication-date and review predicates remain gated on F-2 decisions, so full implementation of those filters must wait for approval. |
| FR-004 / AC-007 | The query boundary combines selected categories with AND. Same-category selection cardinality/combination remains explicitly unresolved and must not be inferred. |
| FR-005 / AC-008 | Clearing omits that category's query parameter while retaining other selections; clearing all optional filters restores the selected genre's broader sample results. |
| FR-006 / AC-009 | Fiction and Non-Fiction share one option definition and the architecture proposes parity tests. This is a parity surface within the new feature, not a claim about a pre-existing or external bookstore. |
| Non-functional requirements | None are specified. The design does not invent performance or accessibility targets; its small local catalog and no-pagination scope are reasonable provided the sample remains bounded. |

## Review assessment

- **Requirement coverage:** The revised design covers the required category/option presentation, single-category filtering, cross-category AND, clearing, and Fiction/Non-Fiction parity. The four unresolved semantic areas are explicitly identified as unapproved implementation gates, not silently decided.
- **Stack and boundaries:** Node.js/Express, static HTML/CSS, browser-native JavaScript, JSON, Node's built-in test runner, and Supertest match the inspected repository and `package.json`. The separate page/client, book query module, and catalog preserve To-Do boundaries.
- **API compatibility:** `/api/books` is a new route with no identified collision. The design preserves `/`, `/todos`, existing auth middleware, response contracts, and To-Do files. Its one-value query contract is appropriately conditional on the still-open same-category decision.
- **Error handling:** Invalid query values return `400`; valid empty results return `200 []`; catalog failures return generic `500`; browser fetch failures remain distinct from empty results. Add the invalid-shape fail-closed behavior in F-5.
- **Security:** Keeping book records outside the static directory and using a read-only public browsing API are appropriate for the authorized local sample. The catalog is not treated as confidential. Safe browser rendering should be made explicit (F-4); the existing global CORS middleware is broad but the proposed endpoint exposes only public sample data and is read-only.
- **Testing:** The proposed unit/integration test placement matches current scripts and conventions. The existing integration tests exercise To-Do/auth behavior, not book behavior, so new tests must cover new functionality and preserve existing contracts (F-3).
- **Operational risk:** Omitting pagination is acceptable for the explicitly small local sample. Keep its bounded scope and reconsider limits/storage if it grows (F-5). No external service, database, or new dependency is required.

## Verdict

**APPROVED WITH CHANGES** — the earlier repository-target blocker is resolved by user authorization. There are no current BLOCKER findings. The semantics in F-2 are **not** approved defaults: their explicit architecture gate is sufficient for this design review, but implementation of the affected predicates, controls, and boundary tests must wait for recorded product decisions. Incorporate the minor testability, safe-rendering, and catalog-validation clarifications (D-3 through D-5) before implementation. No architecture or production code was changed during this review; no planning or later SDLC stage was started.

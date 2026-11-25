# Implementation Plan

- **Story ID**: EPMCDMETST-62758
- **Final architecture**: `docs/sdlc/EPMCDMETST-62758/architecture.md` (approved revision `e0157ea5f7983e2219fb1394ead8ada37a9ff819`); design review `docs/sdlc/EPMCDMETST-62758/design-review.md` is **APPROVED WITH CHANGES**.
- **Critical path**: T-001 → T-003 → T-004 → T-005 → T-006 → T-009 → T-010. T-001 is a product-decision gate. T-003 through T-008 must not implement or test unapproved policy. This is the longest dependency chain; no durations are estimated.

## Dependency-ordered tasks

| ID | Priority | Description | Files | Depends on | Requirement/AC |
|---|---|---|---|---|---|
| T-001 | P1 | Obtain and record explicit user/product decisions for (1) publication-window arithmetic, timezone/reference instant, and cutoff inclusivity; (2) rating scale, aggregation/precision, threshold inclusivity, and unrated handling; (3) missing/invalid metadata behavior per filter field; and (4) same-category selection cardinality and combination semantics. Record the actual answers, not the architecture's proposed defaults. If answers require changing the approved API or design, obtain the applicable design update/approval before dependent implementation proceeds. | `docs/sdlc/EPMCDMETST-62758/requirements.md`; if needed, an approved update to `docs/sdlc/EPMCDMETST-62758/architecture.md` | None | FR-003–FR-005; AC-006–AC-008; open semantics in requirements and architecture |
| T-002 | P1 | Add the single shared public filter-options definition for both genre scopes. Use the exact required category and option labels; keep implementation tokens distinct from visible labels. Do not encode or imply single-/multi-select behavior in the definitions. | `public/book-filter-options.json` | None | FR-001, FR-002, FR-006; AC-001–AC-005, AC-009 |
| T-003 | P1 | Add the bounded, illustrative, read-only local catalog outside `public/` and the book-specific query boundary. Implement genre scoping and approved predicates; validate the catalog's top-level shape and required record fields and fail closed on invalid catalog data with a generic server error. Keep filter-metadata validation consistent with the recorded missing-data decision; do not silently drop malformed records, infer values, or broaden results. Design the query boundary to support a controlled time source for deterministic date-boundary tests. | `data/books.json`, `bookCatalog.js` | T-001, T-002 | FR-003–FR-005; AC-006–AC-008 |
| T-004 | P1 | Add public `GET /api/books` in Express, delegating filtering to the book query boundary. Validate genre and filter values and the approved same-category cardinality; return `400` for invalid input, `200 []` for valid empty results, and a generic `500` for catalog failures. Keep the route independent of To-Do auth and preserve existing `/todos` behavior and response contracts. | `todoServer.js` | T-001, T-002, T-003 | FR-003–FR-005; AC-006–AC-008 |
| T-005 | P1 | Build the separate `/books` page and styling, defaulting to Non-Fiction and presenting the shared categories/options for both Fiction and Non-Fiction. Implement the filter controls only after same-category cardinality is decided. Keep the root To-Do page and its assets unchanged. | `public/books.html`, `public/books.css` | T-001, T-002, T-004 | FR-001, FR-002, FR-006; AC-001–AC-005, AC-009 |
| T-006 | P1 | Implement the isolated browser client: request results from `/api/books`, combine categories according to approved semantics, preserve remaining selections when clearing one filter, show valid empty results separately from recoverable request errors, and retain selections on error. Render all catalog-controlled fields using safe DOM text APIs such as `textContent`; do not interpolate book data into `innerHTML`. | `public/books.js` | T-001, T-004, T-005 | FR-003–FR-006; AC-006–AC-009; design-review D-4 |
| T-007 | P1 | Add unit coverage for query behavior, genre isolation, combined categories, clearing, every supported option, empty results, invalid catalog shape/required fields, and fail-closed behavior. After T-001, cover approved date/rating boundaries using a controlled time source and the decided missing-metadata and same-category policies. Verify the shared options expose identical exact categories/options for both scopes. Extend lint/coverage scripts to include new JavaScript and query-module coverage without adding dependencies. | `tests/book-catalog.test.js`, `package.json` | T-001, T-002, T-003 | FR-002–FR-006; AC-002–AC-009; design-review D-3, D-5 |
| T-008 | P1 | Add API integration coverage for valid and invalid queries, single and combined filters, approved duplicate/multiple-value behavior, valid no-match response, generic catalog failures, and public unauthenticated book browsing. Assert `/books` is served, `/` remains the To-Do page, and the existing `/todos` authentication/response contract is unchanged. Do not change To-Do fixtures or persistence. | `tests/books-api.integration.test.js` | T-001, T-004, T-005 | FR-001, FR-003–FR-006; AC-001, AC-006–AC-009; design-review D-3, D-5 |
| T-009 | P1 | Perform a focused browser smoke check of the `/books` flow: initial Non-Fiction scope, parity of exact filter labels/options in both scopes, selection/clearing behavior, empty and recoverable error states, and safe display of catalog-controlled text. Record any defects for correction before final verification. | No planned file change | T-006, T-007, T-008 | FR-001–FR-006; AC-001–AC-009; design-review D-3, D-4 |
| T-010 | P1 | Run final regression and verification checks after implementation: unit/integration/full test scripts, lint, coverage, and a diff review confirming no unrelated To-Do/auth/data changes or new dependencies. Confirm the local catalog remains bounded and non-authoritative; do not add pagination or production-catalog claims. | No planned file change | T-006, T-007, T-008, T-009 | FR-001–FR-006; AC-001–AC-009; design-review D-3, D-5 |

## Blocked tasks

These are intentional product-decision gates, not permission to choose the architecture's proposed defaults. T-001 must record explicit answers before the affected implementation and its policy-dependent tests begin.

| Task | Blocked until | Reason |
|---|---|---|
| T-003 | T-001 records date-window, rating, and per-field missing-metadata policies. | Catalog values, record validation, and query predicates must not encode unsettled date/rating or absent-metadata behavior. |
| T-004 | T-001 records date-window, rating, missing-metadata, and same-category selection policies. | API predicate behavior, optional-value handling, and duplicate/multi-value validation depend on these decisions. |
| T-005 | T-001 records same-category selection cardinality/semantics. | The UI control type and allowed selection behavior cannot be selected by assumption. |
| T-006 | T-001 records all four policy decisions. | Request construction, selection state, and rendered-result behavior must match the approved query semantics. |
| T-007 | T-001 records all four policy decisions. | Date/rating boundary, missing-data, and same-category tests would otherwise make an unapproved policy appear authoritative. |
| T-008 | T-001 records all four policy decisions. | API integration expectations for filter predicates and parameter cardinality require settled semantics. |

## Verification plan

| Check | Evidence |
|---|---|
| Dependency graph | Tasks are ordered by dependency; T-001 and T-002 are roots. T-003 → T-004 → T-005 → T-006 → T-009 → T-010 forms the stated longest chain; T-007 and T-008 converge into final verification. No dependency cycles. |
| Product decision gate | Requirements/design record contains explicit answers for date windows, rating policy, missing metadata, and same-category selection before dependent work starts; any needed architecture changes receive approval. |
| Unit tests | `npm run test:unit` covers query behavior, shared option parity, all approved edge policies, catalog shape failures, and deterministic date boundaries. |
| API/regression tests | `npm run test:integration` covers the new public API and `/books`, plus `/` and existing `/todos` authentication/response behavior. |
| Full checks | `npm test`, `npm run lint`, and `npm run coverage`; coverage includes the book query module and no new dependency is required. |
| Browser check | Smoke-check `/books` for controls/options, default scope, filtering/clearing, empty/error distinction, and safe text rendering. |
| Scope and data safety | Review the final diff: To-Do page/API/auth and user/todo/session data remain unchanged; catalog is outside `public/`, read-only, bounded, and clearly sample-only. Invalid catalog structures fail closed with generic client-facing errors. |

## Definition of Done

- [ ] All tasks are completed in dependency order, with T-001 decisions recorded before dependent implementation.
- [ ] All six functional requirements and nine acceptance criteria are covered; approved semantics are used without substituting proposed defaults.
- [ ] Tests cover happy paths, missing/invalid/Not Found cases, deterministic time boundaries, catalog validation failures, and existing To-Do regressions.
- [ ] Review D-3, D-4, and D-5 considerations are implemented and verified.
- [ ] No out-of-plan changes, new dependencies, protected-path changes, or modifications to existing To-Do persistence/contracts.
- [ ] The local sample remains bounded and is not represented as authoritative inventory.

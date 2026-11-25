# Implementation Plan

- **Story ID**: EPMCDMETST-62758
- **Final architecture**: `docs/sdlc/EPMCDMETST-62758/architecture.md` (approved revision `9588214454f75b2a96c0c551638dd7b876bcfcbd`).
- **Final design review**: `docs/sdlc/EPMCDMETST-62758/design-review.md` (commit `528f6ded9095c9ee5a3bfecb32668022edff9f93`, verdict **APPROVED**).
- **Approved-decision traceability**: The user approved the filter semantics on 2026-11-25; architecture AD-5 records UTC rolling 30/180/365-day windows with inclusive lower cutoffs, numeric 5-star averages with inclusive `>=4`/`>=3` thresholds and active-filter exclusion of unrated books, conditional exclusion of missing/invalid metadata, and single-select categories combined with AND. User-approved design-review decisions D-3, D-4, and D-5 are recorded as architecture AD-6, AD-7, and AD-8: preserve To-Do behavior, safely render catalog text, and validate/fail closed on invalid catalog structure or required fields. The final review found no remaining design findings. No decision gate remains.
- **Critical path**: T-001 → T-002 → T-003 → T-004 → T-005 → T-006 → T-007 → T-009 → T-010. T-008 also gates T-009 and T-010. The listed path is the longest dependency chain; no durations are estimated.

## Dependency-ordered tasks

| ID | Priority | Description | Files | Depends on | Requirement/AC |
|---|---|---|---|---|---|
| T-001 | P1 | Add the single shared filter-options definition for Fiction and Non-Fiction. Preserve the exact required visible category and option labels; keep stable API tokens separate from labels (`hardcover`, `paperback`, `ebook`, `audiobook`; `en`, `es`, `fr`, `de`; `last-30-days`, `last-6-months`, `last-year`; `4-plus`, `3-plus`). Do not add options. | `public/book-filter-options.json` | None | FR-001, FR-002, FR-006; AC-001–AC-005, AC-009 |
| T-002 | P1 | Add the small, illustrative, read-only catalog outside `public/`. Include varied Fiction and Non-Fiction examples covering supported metadata values; do not represent the sample as authoritative inventory. | `data/books.json` | T-001 | FR-003, FR-006; AC-006, AC-009 |
| T-003 | P1 | Implement the book catalog/query boundary. Validate the entire top-level array and required `id`, `title`, `author`, and `genre` fields; fail closed on invalid structure/required data without dropping records or broadening results. Validate optional metadata without coercion. Apply one predicate per selected category, combining categories with AND; missing/invalid metadata excludes a record only when that category is active. Use UTC rolling 30/180/365-day publication windows with inclusive lower cutoffs against a controllable request-time reference. Use inclusive numeric 5-star-average thresholds `>=4` and `>=3`; unrated records do not match an active rating filter. | `bookCatalog.js` | T-001, T-002 | FR-003–FR-005; AC-006–AC-008; design-review D-5 |
| T-004 | P1 | Add public `GET /api/books`, delegating filtering to the query boundary. Validate required genre and optional values against shared definitions. Accept at most one value per category and return `400` for invalid, repeated, or multi-value parameters; return `200 []` for valid empty results and generic `500` for catalog failures. Keep this route independent of To-Do authentication and preserve existing `/todos` behavior. | `todoServer.js` | T-003 | FR-003–FR-005; AC-006–AC-008; design-review D-3, D-5 |
| T-005 | P1 | Create the separate `/books` page and styling. Default to Non-Fiction, provide Fiction and Non-Fiction scopes with the shared filter categories/options, and use single-select controls. Keep the root To-Do page and its assets unchanged. | `public/books.html`, `public/books.css` | T-001, T-004 | FR-001, FR-002, FR-006; AC-001–AC-005, AC-009 |
| T-006 | P1 | Implement the isolated browser client. Request results from `/api/books`; retain other selections when clearing one filter; distinguish valid empty results from recoverable request errors and retain selections on error. Render every catalog-controlled field as text using DOM nodes and `textContent` or an equivalent safe text API; never interpolate book data into `innerHTML`. | `public/books.js` | T-004, T-005 | FR-003–FR-006; AC-006–AC-009; design-review D-4 |
| T-007 | P1 | Add query/catalog unit tests for shared option parity; valid and invalid catalog shapes/required fields; fail-closed behavior; each filter and AND combinations; clearing/omitted filters; and missing/invalid metadata when its category is active versus inactive. Use a controlled time source for UTC 30/180/365-day boundary tests (inclusive cutoff and just-before exclusion); test inclusive `>=4`/`>=3` thresholds and unrated exclusion. Include markup-like catalog text to verify literal safe rendering. Update existing lint and coverage scripts to include the new JavaScript/query module as appropriate, without adding dependencies or lowering the existing 85% line-coverage threshold. | `tests/book-catalog.test.js`, `package.json` | T-003, T-006 | FR-002–FR-006; AC-002–AC-009; design-review D-4, D-5 |
| T-008 | P1 | Add API integration tests for public book browsing, valid/invalid and repeated/multi-value queries, individual and combined filters, valid empty results, generic catalog failures, and clearing by omitting a filter while retaining others. Explicitly assert `/` still serves the To-Do page, unauthenticated `/todos` remains protected, and authenticated `/todos` retains its JSON-array, user-scoping, filtering, and sorting behavior. Do not change To-Do implementation, fixtures, or persistence. | `tests/books-api.integration.test.js`, `tests/todo-api.integration.test.js` | T-004, T-005 | FR-001, FR-003–FR-006; AC-001, AC-006–AC-009; design-review D-3, D-5 |
| T-009 | P1 | Smoke-check `/books` in a browser: initial Non-Fiction scope, exact shared options in both genre scopes, single-select/filter/clear behavior, AND results, empty/error distinction, and literal safe display of markup-like catalog text. Record and resolve defects before final verification. | No planned file change | T-006, T-007, T-008 | FR-001–FR-006; AC-001–AC-009; design-review D-3, D-4 |
| T-010 | P1 | Complete final regression and verification. Review the diff for scope, protected To-Do behavior/data, catalog placement, generic errors, and absence of new dependencies; confirm the catalog remains bounded and non-authoritative. | No planned file change | T-007, T-008, T-009 | FR-001–FR-006; AC-001–AC-009; design-review D-3–D-5 |

## Blocked tasks

None. The previously open filter-policy questions are resolved in the approved architecture and final design review; no task depends on a pending decision or approval.

## Verification plan

| Check | Evidence |
|---|---|
| Dependency graph | Tasks are topologically ordered and acyclic. T-001 → T-002 → T-003 → T-004 → T-005 → T-006 → T-007 → T-009 → T-010 is the critical path; T-008 independently depends on T-004/T-005 and converges at T-009/T-010. |
| Policy and API/UI alignment | Unit, integration, and browser checks agree on UTC rolling 30/180/365-day inclusive cutoffs; numeric 5-star `>=4`/`>=3` inclusive thresholds; unrated exclusion under an active rating filter; category-active-only exclusion for missing/invalid metadata; single-select values; and AND across categories. Repeated/multi-value API parameters return `400`. |
| Catalog integrity and safe rendering | Tests cover top-level/required-field validation and generic fail-closed `500` behavior. Markup-like catalog text is displayed literally through safe text APIs, never interpolated into `innerHTML`. |
| To-Do compatibility | Integration assertions cover `/`, unauthenticated `/todos`, and authenticated `/todos` JSON-array, user-scoping, filtering, and sorting behavior; no To-Do implementation, fixtures, or persistence changes are permitted. |
| Unit/API checks | Run `npm run test:unit` and `npm run test:integration`, then `npm test` for the full Node test suite. |
| Lint and coverage | Run `npm run lint` and `npm run coverage`; include the new browser/query JavaScript in the relevant checks while retaining the existing **85% line-coverage threshold**. |
| Full verification scripts | Run `npm run sdlc:verify` (lint, full tests, coverage) and `npm run docs:check`. Confirm no new dependencies. |
| Browser and scope | Smoke-check the `/books` flow and review the final diff; the local sample remains bounded/read-only/outside `public/`, with no unrelated To-Do or data changes. |

## Definition of Done

- [ ] All ten tasks are completed in dependency order; no unresolved decision gate or blocked task remains.
- [ ] All six functional requirements and nine acceptance criteria are implemented and verified using the approved semantics.
- [ ] Date tests use a deterministic reference time and verify inclusive UTC cutoffs for rolling 30/180/365-day windows; rating tests verify inclusive thresholds and unrated exclusion.
- [ ] Tests cover single and combined filters, clearing, conditional missing/invalid metadata, catalog validation/failure, safe literal rendering, and exact To-Do regressions.
- [ ] Existing npm verification scripts pass and the 85% line-coverage threshold is retained.
- [ ] No out-of-plan changes, new dependencies, protected-path changes, or modifications to To-Do implementation, fixtures, or persistence.
- [ ] The sample catalog is bounded and not presented as authoritative inventory.

# Code Review — EPMCDMETST-62758

## Review scope and evidence

- **Comparison:** `feature/EPMCDMETST-62758` against `main`; `git diff --stat main...HEAD` reported 16 files changed, 1,505 insertions, and 2 deletions. The exact changed-file list is recorded below.
- **Review evidence:** Read every changed file in full, including requirements, architecture, approved design review, implementation plan, and implementation notes. Reviewed callers and existing filtering/sorting in `todoServer.js` and `public/script.js`. `App.jsx` is Not Found in the repository.
- **Jira traceability:** `requirements.md` records its Jira source snapshot and the nine acceptance criteria. A live Jira fetch was Not Found because no Jira MCP was available; no additional Jira fields or criteria are inferred.
- **Change scope:** `bookCatalog.js`, `data/books.json`, the Story's architecture/design-review/impl-plan/implementation-notes/requirements documents, `package.json`, `public/book-filter-options.json`, `public/books.css`, `public/books.html`, `public/books.js`, `tests/book-catalog.test.js`, `tests/books-api.integration.test.js`, `tests/todo-api.integration.test.js`, and `todoServer.js`.
- The existing To-Do filtering/sorting remains in its existing client/server paths. No duplicate book filtering path was found.

## Seven-area review

| Area | Question | Result | Notes |
|---|---|---|---|
| Correctness and requirements | Does each component satisfy the documented requirements and approved architecture? | ⚠️ | The required categories/options, genre scope, filter conjunction, and clearing behavior are implemented. F-001 identifies a request-order race that can show results for a prior selection. Requirements open questions are interpreted only according to the approved architecture. |
| Security | Are inputs validated and untrusted catalog values safely handled without exposing sensitive data? | ✅ | The public API validates supported query keys, cardinality, and tokens; catalog-controlled UI values use `textContent`/text nodes. The sample catalog is outside `public/`; catalog failures return generic errors. |
| Error handling and edge cases | Are failures, missing data, empty results, and boundary cases handled? | ⚠️ | Empty and request-error states are distinct; catalog and filter inputs fail closed. Out-of-order asynchronous responses can replace current results (F-001). |
| Test coverage | Do tests cover the requirements, edge cases, and regressions? | ⚠️ | Unit/API tests cover filtering, validation, safe rendering, empty results, and To-Do regressions. Implementation notes report 0 new failures versus baseline, but results were not independently rerun. T-009's real-browser smoke check is documented as unavailable; the test harness is not a real browser. |
| Code clarity, maintainability, and separation | Is functionality understandable and appropriately separated? | ✅ | Book query logic, API, page, client, options, and sample data are isolated from the To-Do UI and persistence. |
| DRY, duplication, and complexity | Is behavior centralized without unnecessary duplication? | ✅ | Shared options drive controls and validation; filtering is centralized in `bookCatalog.js`. Existing To-Do filters/sorts are separate and unchanged. |
| Dependency safety, compatibility, and configuration | Are dependencies safe and compatible, and are configuration changes appropriate? | ⚠️ | No dependency declarations or lockfile changes were made. `npm audit` reports two moderate findings in the existing Nodemon → minimatch dependency chain; details are below. |

## Findings

| ID | Area | Severity | File:line | Issue | Recommendation |
|---|---|---|---|---|---|
| F-001 | Correctness and requirements | MAJOR | `public/books.js:49-64` | Each selection starts an independent request. If responses finish out of order, an older selection can overwrite results for the latest controls, showing a result set that does not match the shopper's current filters (FR-003/FR-004). | Sequence requests and render only the latest response, or abort the prior request with `AbortController`. Add a test that resolves two filter requests in reverse order and verifies only the latest result is rendered. |

## Plan compliance

| Check / task | Result | Evidence / notes |
|---|---|---|
| T-001 | ✅ | Canonical shared option definitions and exact labels/tokens are present. |
| T-002 | ✅ | Eight-record illustrative catalog is under `data/`, outside the static directory. |
| T-003 | ✅ | Query boundary validates required catalog structure, applies genre and filters, and implements approved date/rating/metadata policies. |
| T-004 | ✅ | Public `/api/books` validates query values and returns generic catalog failures; separate from To-Do authentication. |
| T-005 | ✅ | Separate `/books` page and scoped styles; Non-Fiction is the default. |
| T-006 | ⚠️ | Separate client, filter clearing, error/empty states, and safe text rendering are present; F-001 remains. |
| T-007 | ✅ | Unit/query and safe-rendering tests are present; the 85% coverage threshold is retained. |
| T-008 | ✅ | API and To-Do regression assertions cover root route, auth, user scoping, filtering, and sorting. |
| T-009 | ⚠️ | Implementation notes say real-browser testing was unavailable; deterministic DOM/fetch and HTTP smoke tests were substituted. |
| T-010 | ✅ | Implementation notes report final regression/scope checks and no new dependencies. |
| Out-of-scope changes | ✅ | The 16-file diff matches the Story and its SDLC artifacts; no unrelated application/data changes were found. |
| Commit format | ⚠️ | Feature commits predominantly use `type(EPMCDMETST-62758): ...` and Copilot co-author trailers. One early requirements commit uses a plain subject; another plan commit omits the Story scope. The required review commit will use the specified format and trailer. |
| Protected paths | ✅ | No changed path matches `.env`, `.env.*`, `node_modules/`, `todos.json`, `users.json`, or `sessions.json`. Unrelated worktree changes `.mcp.json` and deleted `.vscode/mcp.json` were not touched. |
| Known broken tests KI-1..KI-3 | ✅ | `docs/KNOWN-ISSUES.md` records no verified baseline failures and has no KI-1..KI-3 entries; it is not changed. No corresponding known-issue test paths are documented. |
| New failures versus baseline | ✅ | `implementation-notes.md` explicitly reports 0 new failures for lint, unit, integration, and full test runs, with coverage increasing from 88.71% to 93.03%. This is documented evidence, not an independent rerun. |

## Dependency-safety summary

- Node manifest and lockfile: `package.json` and `package-lock.json`; the branch changes only lint/coverage scripts in `package.json`, not dependency declarations or the lockfile.
- `npm audit` was run and exited 1. It reported **2 moderate severity vulnerabilities**: `minimatch` versions 7.0.0–11.0.0, GHSA-g3hv-75wg-m249 (potential denial of service via globparts amplification), through existing `nodemon`; npm reports a fix is available via `npm audit fix`.
- These dependencies are unchanged by this Story; no new dependencies are reported.
- Build script: Not Found in `package.json`.

## Verification notes and limitations

- `git diff --stat main...HEAD` and `git log --oneline main..HEAD` were run. The branch diff contains 16 implementation/SDLC files, with no protected paths.
- `git diff --check main...HEAD` exited 2 and reported the added lines in `todoServer.js` as trailing whitespace. Raw inspection confirms the file uses CRLF line endings in both the working tree and `HEAD` (`291` CRLF line endings); the check treats those carriage returns as whitespace. No file was modified to address this check.
- Tests, lint, and coverage were not rerun as part of this review. Their reported results above are attributed to `implementation-notes.md`.
- The Jira MCP and real-browser tooling were unavailable; those checks are not represented as passing.

## Verdict

**REQUEST CHANGES**

F-001 is a MAJOR user-visible correctness issue: results may not correspond to the current filter selection. No BLOCKER findings were identified.

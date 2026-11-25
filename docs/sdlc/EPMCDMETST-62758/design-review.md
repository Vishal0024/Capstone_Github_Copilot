# Design Review (Final Rerun)

- **Story ID**: EPMCDMETST-62758
- **Branch**: `feature/EPMCDMETST-62758`
- **Mode**: Review
- **Architecture revision reviewed**: `9588214454f75b2a96c0c551638dd7b876bcfcbd`
- **Inputs reviewed**: `requirements.md`, the revised `architecture.md`, the previous design review, `impl-plan.md`, `package.json`, `todoServer.js`, `index.html`, `public/script.js`, and `tests/todo-api.integration.test.js`.
- **Verdict**: **APPROVED**

## Resolution of prior findings

| Prior finding | Status | Evidence in revised architecture |
|---|---|---|
| F-3 — explicit To-Do regression assertions | **Addressed** | Components and responsibilities, Error handling / Compatibility regression tests, and traceability for D-3 require assertions that `/` serves the To-Do page, unauthenticated `/todos` remains protected, and authenticated `/todos` preserves its response and user-scoping/filter/sort contract. Existing To-Do fixtures, persistence, and implementation are explicitly protected. |
| F-4 — safe rendering of catalog-controlled text | **Addressed** | The page responsibility, error handling, risks, and D-4 traceability require rendering every catalog-controlled field through DOM text nodes/`textContent` or an equivalent safe text API, and prohibit interpolating book data into `innerHTML`. Tests are to use markup-like catalog text and verify literal display. |
| F-5 — catalog shape, required fields, and fail-closed validation | **Addressed** | Book record shape defines a top-level array, required `id`, `title`, `author`, and `genre` validation, optional metadata domains, and whole-catalog failure for invalid structure/required fields. Error handling requires generic `500` responses without partial results or broadening. Optional missing/invalid metadata follows the approved active-category-only exclusion rule. |

No unresolved architecture finding from the preceding review remains. D-3, D-4, and D-5 are explicitly recorded as user-approved decisions AD-6 through AD-8.

## Findings

| ID | Severity | Area | Risk or gap | Recommendation |
|---|---|---|---|---|
| — | — | — | No remaining design findings identified in this rerun. | — |

## Proposed design decisions

No new design decisions are proposed. The previously approved decisions D-3, D-4, and D-5 are implemented in architecture revision `9588214454f75b2a96c0c551638dd7b876bcfcbd`; no further architecture change is requested.

## Traceability

| Requirement / acceptance criterion | Architecture coverage and review assessment |
|---|---|
| FR-001 / AC-001 | `/books` defaults to Non-Fiction and presents Book Format, Language, Publication Date, and Customer Reviews. Shared definitions cover both genre scopes. |
| FR-002 / AC-002 | Shared options specify exactly hardcover, paperback, eBook, and audiobook for Book Format. |
| FR-002 / AC-003 | Shared options specify exactly English, Spanish, French, and German for Language. |
| FR-002 / AC-004 | Shared options specify exactly last 30 days, last 6 months, and last year for Publication Date. The approved interpretation is UTC rolling periods of 30, 180, and 365 days with inclusive lower cutoffs. |
| FR-002 / AC-005 | Shared options specify exactly 4-stars and above and 3-stars and above for Customer Reviews. Approved behavior uses inclusive `>=4` and `>=3` numeric 5-star-average thresholds and excludes unrated books for an active review filter. |
| FR-003 / AC-006 | `/api/books` applies an individual selected predicate within the selected genre. Approved date/rating policies and active-versus-inactive missing/invalid metadata behavior are specified, with deterministic boundary tests required. |
| FR-004 / AC-007 | The query boundary combines selected categories with AND. Each category is single-select; repeated or multi-value parameters are rejected with `400`. |
| FR-005 / AC-008 | Clearing a category omits only its parameter while retaining other selections; clearing all optional filters returns the broader result set for the selected genre. |
| FR-006 / AC-009 | Fiction and Non-Fiction share one option definition, and tests are required to compare category and option parity. |
| Non-functional requirements | Requirements specify no measurable NFR. The architecture bounds the local sample and unpaginated response to demonstration scope, and does not invent performance, accessibility, or responsive-layout thresholds. |

## Review assessment

- **Requirement coverage:** All six functional requirements map to the nine acceptance criteria above. Exact labels/options, filtering, combined-filter behavior, clearing, and Fiction/Non-Fiction parity are addressed.
- **Stack and boundaries:** A separate Express route/query module, static HTML/CSS, browser-native JavaScript, and JSON catalog align with the existing Node.js/Express 4 application and test conventions. No new framework, dependency, or database is proposed. Book behavior is separated from To-Do UI state and persistence.
- **API and errors:** `/api/books` is public and separate from To-Do authentication. The contract specifies required genre, optional single-valued filters, `400` for invalid/repeated/multi-value input, `200 []` for valid empty results, and generic `500` on catalog read/parse/structural/required-field failure without exposing filesystem details. Browser fetch errors remain distinct from empty results.
- **Testing:** The design calls for option parity, filter and clearing behavior, date/rating boundaries, conditional metadata handling, malformed-catalog failure, safe text rendering, and explicit root/To-Do auth/response regressions. Existing `tests/todo-api.integration.test.js` demonstrates the Node test runner/Supertest style and currently exercises authenticated CRUD and unauthenticated `/todos`; the root-route regression is correctly specified as new coverage rather than presumed present.
- **Security:** Keeping the sample catalog outside `public/`, exposing only filtered read-only results, failing closed on invalid required data, and rendering catalog fields only as text address the identified data exposure, integrity, and injection risks. Public browsing is intentionally unauthenticated and does not weaken `/todos` protection.
- **Operations and scope:** The sample is explicitly bounded, read-only, and non-authoritative; pagination/storage expansion is deferred until scope changes. Error responses are generic, and operational behavior does not imply production inventory completeness.

## Step 4 handoff

`impl-plan.md` is not refreshed by this Step 3 review, as requested. It still cites older architecture/review revisions and describes T-001 policy decisions as an unresolved gate, although the approved semantics are now recorded in the architecture. Refresh the plan in Step 4 before implementation, including its architecture reference, decision-gate status, task dependencies, and test/coverage commands for the planned book files. This is a downstream planning action and does not leave a design finding against the reviewed architecture.

## Verdict

**APPROVED** — the architecture revision addresses prior findings F-3 through F-5 and provides traceable coverage for all FRs and ACs. No new design finding requires an architecture change. The implementation plan remains a Step 4 refresh item; it was not edited in this review.

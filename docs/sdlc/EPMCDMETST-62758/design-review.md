# Design Review

- **Story ID**: EPMCDMETST-62758
- **Branch**: `feature/EPMCDMETST-62758`
- **Mode**: Review
- **Inputs reviewed**: `.github/pipeline/pipeline.json`, `docs/sdlc/EPMCDMETST-62758/requirements.md`, `docs/sdlc/EPMCDMETST-62758/architecture.md`, `todoServer.js`, `package.json`, and the repository's design-review skill.
- **Verdict**: **CHANGES REQUIRED**

## Summary

The architecture is appropriately cautious about the mismatch between the Story and this repository: the application is a To-Do app, and no bookstore listing, Fiction filter set, book catalog, or catalog API exists here. It avoids fabricating a catalog or modifying `/todos`, and proposes filtering at the authoritative catalog layer with OR within a category, AND across categories, and inclusive rating thresholds.

The mismatch is nevertheless unresolved. There is no identified host, repository, catalog owner, or confirmation that this Story is intended to be reassigned to the To-Do application. Consequently the design cannot be implemented or its Fiction-parity acceptance criterion verified in this repository. Exact relative-date behavior and catalog rating/data policies also remain unsettled. These gaps require decisions before implementation.

## Findings

| ID | Severity | Area | Risk or gap | Recommendation |
|---|---|---|---|---|
| F-1 | BLOCKER | Requirement coverage / repository fit / data ownership | Requirements AC-001 and AC-009 require a Non-Fiction book listing and parity with Fiction filters. The architecture and inspected `todoServer.js`/`package.json` confirm this repository has no book listing, Fiction implementation, book metadata, catalog source, or catalog API. The architecture calls the proposed `/api/books` contract a boundary only, not an existing capability, and says implementation must wait. Without a confirmed target host and catalog, there is no deployable integration point and parity cannot be tested. | Identify the intended bookstore host/repository and catalog/API owner, or obtain explicit confirmation and approved scope to reassign this Story to this repository. Then make the architecture concrete for that host, including the source of Fiction options and catalog ownership, before implementation. Do not implement the proposed API or a synthetic catalog in the current To-Do application as a substitute. |
| F-2 | MAJOR | Edge cases / acceptance-test determinism | The requirements explicitly leave timezone, day boundary, cutoff inclusivity, and calendar-versus-duration interpretation of “last 6 months” and “last year” unspecified. The architecture correctly says these need owner resolution, but the result sets at date boundaries cannot yet be tested consistently. Rating scale/precision and missing or unrated metadata behavior are also unknown. | Obtain catalog/product-owner decisions for date calculation and rating representation, including missing/invalid values. Record them in the architecture and requirements (through the approved workflow) and define boundary and missing-data tests before implementation. |
| F-3 | MAJOR | API / operational risk | The proposed `GET /api/books` contract does not define pagination, maximum page/result size, or how filtering interacts with the host's listing limits. The architecture correctly marks the API as proposed and pagination as host-specific, but if implemented as an unbounded array this can cause excessive catalog work and response sizes. | After the host is identified, follow its established pagination, sorting, query-size, and response conventions. Specify bounded result behavior in the host-specific API contract and test that filters are applied consistently across pages. |
| F-4 | MINOR | Security / compatibility | The design defers authentication and authorization to host policy, which is appropriate, but the endpoint is otherwise described without an explicit statement that it must inherit the host's access controls and CORS policy. This repository's Express app currently applies `cors()` globally; copying that convention into a different catalog host without review could expose a route under an unintended policy. | Implement only in the confirmed host and explicitly preserve its authorization, CORS, validation, and error-envelope policies. Do not treat the current To-Do app's global CORS setup as authorization guidance or introduce a public catalog endpoint by default. |

## Proposed design decisions

| Decision ID | Decision | Resolves finding(s) | Changes `architecture.md`? |
|---|---|---|---|
| D-1 | Confirm the bookstore host/repository and catalog/API owner, or explicitly approve reassignment to this repository; do not begin implementation until the target is established. | F-1 | Yes |
| D-2 | Obtain and record authoritative date-window, timezone/cutoff, rating-scale, and missing-metadata policies before implementation and boundary-test design. | F-2 | Yes |
| D-3 | Use the confirmed host's bounded pagination, authorization, CORS, and API conventions for the eventual listing endpoint. | F-3, F-4 | No |

These are proposed decisions only. No user-agreed decisions were supplied in review mode, so none were applied to `architecture.md`.

## Traceability

| Requirement / acceptance criterion | Architecture coverage and review assessment |
|---|---|
| FR-001 / AC-001, AC-009 | Covered conceptually by placing four filter groups on the Non-Fiction listing and reusing/deriving the Fiction set. **Not verifiable or implementable here** because the listing and Fiction implementation are absent; see F-1. |
| FR-002 / AC-002–AC-005 | Covered by the exact visible options and proposed stable tokens in the Filter Model. Must be implemented in the confirmed storefront host; avoid option drift from Fiction. |
| FR-003 / AC-006–AC-007 | Covered by repeatable query values (OR per populated category) and AND across populated categories. The architecture also explicitly handles selection of both rating thresholds as OR, equivalent to a minimum of 3. |
| FR-004 / AC-004, AC-006 | Relative-to-today evaluation is assigned to the catalog/query layer. Timezone, cutoff boundary, and calendar-versus-duration semantics remain open, so boundary behavior is not yet deterministic; see F-2. |
| FR-005 / AC-005–AC-006 | Inclusive `rating >= 4` and `rating >= 3` comparisons are specified. The underlying rating scale/precision and unrated-item policy remain open; see F-2. |
| FR-006 / AC-008 | Clearing is represented by omitting a category from the next request while preserving other selections; no active filters returns broader Non-Fiction results; valid empty matches return `200 []`. |
| Non-functional requirements (none specified) | The design does not invent persistence, accessibility, or performance targets. Actual host pagination/resource limits and its security policies must be confirmed and followed; see F-3 and F-4. |

## Repository fit, alternatives, and operational assessment

- The proposed separation of bookstore responsibilities from `index.html`, `public/script.js`, `todoServer.js`, `/todos`, and To-Do JSON files fits the existing domain boundary and avoids a backward-compatibility break to the To-Do API/data.
- Catalog-side filtering is a reasonable default for an authoritative potentially large catalog. Client-only filtering is appropriately conditional on the real host already loading a suitably bounded catalog.
- A new framework/dependency or a second synthetic bookstore/catalog in this repository is not justified by the requirements and would not resolve the missing source-of-truth problem.
- Token validation, `400` for invalid selections, `200 []` for valid empty results, recoverable host-style errors, and avoiding internal error leakage are reasonable proposed safeguards. Their exact implementation must follow the actual host's conventions and policies; no endpoint should be exposed under assumed authorization/CORS behavior.
- The architecture's no-dependency recommendation and separation from To-Do routes are sound. Operationally, the target host, catalog scale, pagination convention, and policy ownership remain unconfirmed, preventing a reliable implementation estimate or end-to-end verification.

## Verdict

**CHANGES REQUIRED** — F-1 is a BLOCKER. Resolve the target-host/catalog ownership question and the implementation-critical semantics in F-2, and finalize host-specific API/security/operational conventions before implementation. The architecture has not been modified because no decisions were approved in this review.

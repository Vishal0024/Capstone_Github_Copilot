# Design Review

- **Story ID**: EPMCDMETST-62758
- **Branch**: `feature/EPMCDMETST-62758`
- **Mode**: Review
- **Inputs reviewed**: `requirements.md`, `architecture.md`, `package.json`, `todoServer.js`, `index.html`, `public/script.js`, and `tests/todo-api.integration.test.js`.
- **Verdict**: **CHANGES REQUIRED**

## Summary

The architecture correctly recognizes that this repository is a To-Do application, not the bookstore host described by the Story. It avoids fabricating a book catalog, keeps the proposed book API explicitly hypothetical, and protects the existing `/todos` API and UI from unrelated changes. Its proposed filtering, clearing, and error behavior broadly trace to the requirements, while unspecified date/rating semantics are not silently assumed.

The design is not ready to implement here: the bookstore host, Fiction filter source, and catalog/API owner are unidentified, and the Jira evidence in the requirements reports the Story as Open with no explicit approval marker. In addition, date/rating semantics and host API/resource policies need confirmation before testable, bounded behavior can be committed to a concrete host. No architecture or production code was changed during this review.

## Findings

| ID | Severity | Area | Risk or gap | Recommendation |
|---|---|---|---|---|
| F-1 | BLOCKER | Requirement coverage / repository fit / ownership | AC-001 and AC-009 require a Non-Fiction book listing and parity with the Fiction filter set. The architecture says the storefront, Fiction implementation, catalog, and catalog API are absent. The inspected `index.html`, `public/script.js`, and `todoServer.js` implement To-Do flows; `package.json` identifies Express 4 and no bookstore-specific dependencies or host. The proposed `/api/books` is expressly not implemented. Without a confirmed target host and authoritative Fiction/catalog source, there is no integration point and parity cannot be verified. | Identify the intended bookstore repository/host and catalog/API owner, and confirm the Story's target/approval. Alternatively, obtain explicit approval to reassign it here and establish the separate book surface and authoritative data source. Do not implement a synthetic catalog or attach this behavior to `/todos`. |
| F-2 | MAJOR | Requirement determinism / testing | The requirements leave date-window cutoffs, timezone, calendar-versus-duration rules, rating scale/precision/inclusivity, and missing metadata open. The architecture appropriately defers these decisions, but date- and rating-filter results cannot yet have deterministic boundary tests. Within-category multi-value behavior is also intentionally unspecified. | Obtain product/catalog-owner decisions for date and rating semantics and missing values before implementation. Record only agreed behavior in the design and create boundary/missing-data tests; do not infer multi-value semantics. |
| F-3 | MAJOR | API compatibility / operational capacity | The proposed `GET /api/books` success response is an array, while pagination, result limits, catalog scale, and host query conventions are unknown. The architecture says pagination is host-specific, but does not define a bounded response contract. An unbounded implementation could create excessive query work or payloads; the candidate contract may also conflict with the actual host's route and query conventions. | After confirming the host, align the route, parameter cardinality, pagination, sorting, limits, and response envelope with its established API. Specify bounded behavior and test filtering consistently across pages before implementation. |
| F-4 | MINOR | Error handling / security policy | The architecture proposes `400` for invalid tokens and `5xx` without internal details, and correctly says authentication and other policies are host-specific. It does not define the host's actual error envelope, authorization, or CORS policy. Copying this repository's middleware conventions into a different host without review could create compatibility or access-control errors. | Treat the proposed responses as illustrative; confirm and explicitly preserve the confirmed host's error, authorization, and CORS conventions. Do not assume the current app's global CORS configuration applies to a bookstore endpoint. |

## Proposed design decisions

| Decision ID | Decision | Resolves finding(s) | Changes `architecture.md`? |
|---|---|---|---|
| D-1 | Confirm and record the intended storefront host/repository, Fiction option source, catalog/API owner, and Story target approval before implementation; do not add a synthetic bookstore to this To-Do app. | F-1 | Yes |
| D-2 | Resolve and record date-window/timezone/cutoff, rating representation and boundary, and missing-metadata policies with the responsible product/catalog owner; leave same-category multi-select behavior open unless decided. | F-2 | Yes |
| D-3 | Define the eventual API against the confirmed host's bounded pagination, query, sorting, and response conventions. | F-3 | Yes |
| D-4 | Confirm and follow the host's authorization, CORS, and error-envelope policies rather than assuming this repository's conventions. | F-4 | Yes |

These are proposed decisions, not user-agreed decisions. None were applied to `architecture.md`.

## Traceability

| Requirement / acceptance criterion | Architecture coverage and review assessment |
|---|---|
| FR-001 / AC-001 | The architecture calls for the four groups on a Non-Fiction listing, but that listing is not present in this repository. Not verifiable here; see F-1. |
| FR-002 / AC-002–AC-005 | The Filter Model lists the exact visible options and separates them from proposed API tokens. Implementation must be tied to the confirmed catalog/host. |
| FR-003 / AC-006 | The catalog/query layer is assigned single-filter matching. Actual matching data and date/rating boundary policies remain unconfirmed; see F-2. |
| FR-004 / AC-007 | The architecture requires results to satisfy all selected filters across categories. Same-category multiple-selection behavior is explicitly left unspecified, consistent with the requirements. |
| FR-005 / AC-008 | Clearing is represented by omitting the selected category while retaining others; no filters gives the broader Non-Fiction result set. This matches the requirement at design level. |
| FR-006 / AC-009 | The architecture requires parity with Fiction, but neither a Fiction set nor its source exists in this repository. Not verifiable until the host is identified; see F-1. |
| Non-functional requirements | None are specified in the requirements. The design appropriately does not invent targets, but host-specific resource bounds and API policies still need resolution; see F-3 and F-4. |

## Review assessment

- **Stack and boundaries:** The architecture's conditional use of the existing Express/native-JavaScript stack and its separation from To-Do UI, JSON files, and `/todos` are appropriate. The actual bookstore host is not established, so no concrete implementation fit can be confirmed.
- **API compatibility:** `/api/books` and its query parameters are labeled as proposals, not existing contracts. This avoids claiming compatibility, but route, encoding, and bounded pagination need the host owner's confirmation (F-3).
- **Error handling:** Invalid-token, empty-result, and service-failure cases are considered, and the design says not to leak internals. Exact host error-envelope compatibility remains a pre-implementation check (F-4).
- **Testing:** The architecture names option-parity, query, combination, date/rating, clearing, and empty-result tests. The inspected `tests/todo-api.integration.test.js` exercises To-Do/auth behavior, not book filtering; there are no executable bookstore tests in the inspected repository. Tests cannot be implemented against an absent host/catalog, and date/rating boundary tests need F-2 decisions.
- **Security:** Deferring authentication and CORS to the actual host is safer than assuming To-Do policy. Preserve the host's controls when identified (F-4).
- **Operational risk:** The catalog's size, pagination, ownership, and source are unknown. Avoid an unbounded result contract and define resource limits with the host (F-1, F-3).

## Verdict

**CHANGES REQUIRED** — F-1 is a BLOCKER. Establish the intended storefront/catalog integration target and approval before implementation. Resolve F-2 and finalize host-specific API/resource and security/error conventions before a deployable design is approved. No implementation planning or later SDLC stage was performed.

# Implementation Plan

- **Story ID**: EPMCDMETST-62758
- **Final architecture**: `docs/sdlc/EPMCDMETST-62758/architecture.md`
- **Design review**: `docs/sdlc/EPMCDMETST-62758/design-review.md` — CHANGES REQUIRED; F-1 is a BLOCKER.
- **Critical path**: T-001 → T-002/T-003 → T-005 → T-006 → T-007. T-004 also gates T-006.

## Planning constraint and blocker

The design-review BLOCKER is explicit: **no bookstore host, catalog, Fiction filters, or book API exists in this repository.** The current repository is a To-Do application. Do not implement a synthetic storefront/catalog/API here, change `/todos`, or use To-Do data as book data. Implementation tasks below are conditional on confirming the actual bookstore host and catalog owner (or receiving explicit approval to reassign the Story and an approved host-specific architecture). Their paths are therefore host-specific/TBD, not existing files in this repository.

## Dependency-ordered tasks

| ID | Priority | Description | Files | Depends on | Requirement/AC |
|---|---|---|---|---|---|
| T-001 | P1 | Confirm the intended bookstore host/repository and catalog/API owner, and identify the authoritative Fiction filter set and catalog source. Alternatively, obtain explicit approval to reassign the Story to this repository and an approved design that establishes the storefront/catalog boundary. Do not start implementation without this decision. | External product/repository ownership decision; no corresponding host files exist here. | None | FR-001; AC-001, AC-009 |
| T-002 | P1 | With the confirmed product/catalog owners, settle and record date-window semantics (timezone, definition of “today,” cutoff inclusivity, calendar versus elapsed periods) and rating/data policies (scale/precision, unrated or invalid metadata). Update the approved requirements/architecture through the normal review workflow before implementation. | Approved `requirements.md` and `architecture.md`; locations in the confirmed host TBD. | T-001 | FR-004–FR-005; AC-004–AC-006 |
| T-003 | P1 | Inspect the confirmed host's listing/API conventions and specify bounded pagination/result behavior, filter behavior across pages, authorization, CORS, validation, and error-envelope policies. Update the host-specific design before implementing an endpoint. | Confirmed host API/design locations TBD; no book API exists here. | T-001 | FR-001, FR-003; AC-006–AC-009 |
| T-004 | P1 | In the confirmed storefront, provide the Non-Fiction listing's four exact filter groups/options and ensure they use or are verified against the host's Fiction filter set. Keep the feature separate from To-Do UI. | Confirmed host listing, shared filter configuration/components, and styles; paths TBD. | T-001 | FR-001–FR-002; AC-001–AC-005, AC-009 |
| T-005 | P1 | In the host's authoritative catalog/query layer, validate filter tokens and implement OR matching within each selected category and AND matching across categories. Apply the approved relative-date policy and inclusive rating thresholds to authoritative metadata, follow host pagination, and return valid empty results without broadening invalid queries. | Confirmed host catalog/query/API and metadata mapping; paths TBD. | T-001, T-002, T-003 | FR-003–FR-005; AC-004–AC-007 |
| T-006 | P1 | Connect the Non-Fiction listing controller to the host API: preserve Non-Fiction scope and current selections, send the full filter state, render matching/empty/error results, and clear a selection while retaining other selections. | Confirmed host listing/controller and result renderer; paths TBD. | T-004, T-005 | FR-003, FR-006; AC-006–AC-008 |
| T-007 | P1 | Add and run host-convention unit, integration, and browser/UI verification for exact option parity, filter serialization, OR/AND behavior, approved date/rating boundaries, pagination, clearing, empty/error results, and Non-Fiction scope. | Confirmed host test locations and test runner; paths TBD. | T-004, T-005, T-006 | FR-001–FR-006; AC-001–AC-009 |

## Blocked tasks

| Task | Blocked until | Reason |
|---|---|---|
| T-001 | Product/Story owner confirms the bookstore host/repository and catalog/API owner, or explicitly approves reassignment with an approved host design. | F-1 BLOCKER: this repository has no bookstore host, catalog, Fiction filters, or book API; the integration target and source of truth are unknown. |
| T-002 | T-001; date and rating/data policy decisions from the confirmed owners. | Date boundaries, rating scale, and missing/invalid metadata behavior are not defined; deterministic implementation and boundary tests require owner decisions. |
| T-003 | T-001; the confirmed host's API/security/operational conventions. | Pagination, authorization, CORS, and API ownership are host-specific and cannot be inferred from this To-Do application's configuration. |
| T-004 | T-001 and confirmation of the host's Fiction option set. | There is no listing or Fiction filter implementation in this repository to extend or compare against. |
| T-005 | T-001, T-002, and T-003. | The authoritative catalog, metadata schema, policies, and API boundary do not exist here or have not been identified. |
| T-006 | T-004 and T-005. | No host listing/controller or book API is available to connect. |
| T-007 | T-001 through T-006 and a confirmed host test environment. | Host-specific UI, API, data, and test conventions are unknown; tests against the To-Do app would not verify this Story. |

## Verification plan

| Check | Evidence |
|---|---|
| Confirm bookstore target, catalog/API owner, Fiction option source, or explicit reassignment and approved host architecture. | Recorded owner decision and approved design; resolves F-1 before implementation begins. |
| Confirm deterministic date/rating/data policies and host endpoint/security/pagination conventions. | Approved requirements/architecture updates and host API contract; resolves F-2 and addresses F-3/F-4. |
| Verify exact filter groups/options and parity with Fiction. | Host UI/component tests for AC-001–AC-005 and AC-009. |
| Verify catalog filter semantics, metadata boundaries, and bounded pagination. | Host unit/integration tests for OR within categories, AND across categories, date/rating boundaries, invalid tokens, and filtered pagination (AC-004–AC-007). |
| Verify listing integration and clearing behavior. | Host browser/integration tests for Non-Fiction scope, selections, empty/error response handling, and clearing with remaining selections (AC-006–AC-008). |
| Verify no unrelated To-Do behavior or protected data is changed. | Review the final change set against the approved host-specific plan; do not modify To-Do UI, `/todos`, or protected JSON data for this feature. |

## Definition of Done

- [ ] T-001 is resolved and the implementation target/catalog source is approved; no implementation begins while F-1 remains unresolved.
- [ ] T-002 and T-003 decisions are recorded in approved host-specific requirements/design before the affected implementation tasks begin.
- [ ] Tasks T-004–T-006 implement the approved host integration and satisfy FR-001–FR-006 / AC-001–AC-009.
- [ ] T-007 tests pass in the confirmed host and cover the verification cases above, including missing/invalid data and Not Found/empty results as defined by the approved host policy.
- [ ] Fiction parity is verified against the host's authoritative filter set.
- [ ] Changes remain within the approved implementation plan; no synthetic bookstore/catalog is added to the To-Do repository.

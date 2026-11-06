# Design Review — EPMCDMETST-67543

**Mode:** Review  
**Feature branch:** `feature/EPMCDMETST-67543`  
**Inputs:** `requirements.md`, `architecture.md`, and the current vanilla JavaScript/Express application.

## Findings

| ID | Severity | Area | Risk or gap | Recommendation |
|---|---|---|---|---|
| F-01 | MAJOR | Test strategy / AC-008 | AC-008 requires automated coverage, but the repository declares no test script or browser/client test framework. The architecture says to extend a setup “if available” or use an established approach, while also leaving the test mechanism undecided. This does not yet provide an implementable path to the required automated tests. | Specify a dependency-free test strategy before implementation (for example, Node's built-in test runner and assertions against the actual date/rendering logic), including how to exercise it and the required cases. |
| F-02 | MINOR | Date validation / FR-004 | The design requires validation but does not define rejection of null/non-string values before parsing. In JavaScript, `new Date(null)` is a valid epoch date, so treating a missing/null API value as a date could violate the required “Not available” fallback. | Explicitly reject null, undefined, empty/whitespace, and unsupported input types before parsing; then reject invalid parsed dates. Apply the same validity check to both timestamps. |

## Proposed design decisions

| Decision ID | Decision | Resolves finding(s) | Changes `architecture.md`? |
|---|---|---|---|
| D-1 | Define and wire a dependency-free automated test strategy for AC-008 using built-in Node test facilities, exercising production date/rendering logic for normal formatting, Edited eligibility, invalid/missing values, and safe text rendering. | F-01 | yes |
| D-2 | Specify a strict timestamp input guard before `Date` parsing so null, absent, blank, and unsupported values follow the required fallback/omission behavior. | F-02 | yes |

## Traceability

| Requirement | Design coverage and review assessment |
|---|---|
| FR-001 / AC-001 | Covered: the proposed card-rendering path adds a Created metadata label for each todo. |
| FR-002 / AC-002 | Covered: browser-native `Date`/`Intl.DateTimeFormat` with `en-GB` and no timezone override targets `DD Mon YYYY` in the user's local timezone. |
| FR-003 / AC-003 | Covered: compare valid parsed timestamps and render Edited only when `updatedAt` is strictly later. |
| FR-004 / AC-004 | Covered in principle: fallback for unavailable creation date, omission for unavailable Edited date, and per-card validation. F-02 requests precision for null/unsupported values. |
| FR-005 / AC-005 | Covered: the existing create/edit flow refetches the list after the mutation and renders server-provided timestamps without a document reload. |
| NFR-001 / AC-006 | Covered: reuse `.todo-timestamp` styling and allow wrapping at widths of 480px or less. Verify the final presentation at those widths. |
| NFR-002 | Covered: create DOM elements and assign `textContent`; do not interpolate timestamp data into HTML. |
| NFR-003 | Covered: stable `data-testid` hooks are proposed for Created and conditional Edited elements. |
| NFR-004 | Covered: use built-in date APIs and add no date-formatting dependency. |
| NFR-005 / AC-007 | Covered: confine production changes to timestamp presentation and minimal CSS; leave API, state, and unrelated interactions unchanged. |
| AC-008 | Partially covered: test cases are identified, but there is no executable test-runner strategy in the architecture yet (F-01). |

## Fit with existing code

The checkout is a vanilla HTML/CSS/JavaScript client backed by Express, not a React/Spring application. The architecture correctly locates presentation in `public/script.js` and avoids unnecessary backend/API changes: `todoServer.js` already returns ISO `createdAt`/`updatedAt` values and updates `updatedAt` on edits and completion. The existing card renderer uses DOM construction and `textContent` for card content, and create/edit handlers already refetch the list. Reusing these paths is consistent with the codebase and preserves compatibility. The existing `.todo-timestamp` style can be reused; mobile wrapping should be verified when the separate labels are implemented.

## Verdict

**APPROVED WITH CHANGES**

No blocker was identified. Resolve the test-strategy gap and make timestamp input validation explicit in `architecture.md` before implementation. This review does not modify `architecture.md` or production code.

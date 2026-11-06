# Requirements — EPMCDMETST-67543

## Artifact status and source

This is a **local-only requirements artifact** based on the verified Jira API response for EPMCDMETST-67543 retrieved during this session. The issue was not live-validated through Jira MCP during finalization. No Jira fields were changed.

- **Issue:** EPMCDMETST-67543
- **Type / status:** Story / Open
- **Summary:** Show created and edited dates on todo cards
- **Linked issues:** None were returned by the Jira API response.
- **Known-issues documentation:** `docs/KNOWN-ISSUES.md` was unavailable at the expected path; no assumptions are made from its absence.

## Executive Summary

As a Pro To-Do user, I want each task card to show when the task was created and, when applicable, last edited. The dates must use a consistent local-time format, handle missing or invalid values without breaking the list, update immediately after task changes, and fit the existing card metadata presentation on mobile.

## Business Objective and Scope

Expose the existing task creation and last-updated dates directly on task cards so users can understand a task’s age and recent changes without opening it.

In scope: displaying the existing `createdAt` and `updatedAt` values on cards, formatting and fallback behavior, responsive styling, safe rendering, and automated coverage of the date behavior.

## Actors and Stakeholders

- **Primary actor:** Pro To-Do user viewing task cards.
- **Stakeholder:** Product owner for the To-Do application.

## Functional Requirements

- **FR-001:** Show a creation date in each todo card’s metadata area, labelled “Created”.
- **FR-002:** Format displayed dates as `DD Mon YYYY` in the user’s local time zone.
- **FR-003:** Show an “Edited” date only when the valid last-updated date is later than the creation date.
- **FR-004:** Use the specified neutral fallback for a missing or invalid creation date; omit the edited label when the last-updated date is missing or invalid.
- **FR-005:** Reflect task creation and editing in the displayed dates immediately, without a page reload.
- **FR-006:** Render date text safely using `textContent` and provide `data-testid` attributes for testing.
- **FR-007:** Preserve existing application behavior and use the existing date fields returned by `GET /todos`.

## Acceptance Criteria

- **AC-001:** Every todo card displays its creation date in the card metadata area, labelled `Created`, for example `Created 05 Oct 2026`.
- **AC-002:** Dates use `DD Mon YYYY` (for example `05 Oct 2026`) and are shown in the user’s local time zone.
- **AC-003:** When a todo’s last-updated date is later than its creation date, its card also displays `Edited <date>` in the same format. Otherwise, no `Edited` label is displayed.
- **AC-004:** If the creation date is missing or invalid, the card displays `Created: Not available`. If the last-updated date is missing or invalid, no `Edited` label is displayed. The task list continues to render without errors.
- **AC-005:** The displayed dates update immediately after creating or editing a task, without reloading the page.
- **AC-006:** Date text is styled consistently with existing card metadata and remains readable at mobile widths of 480px or less.
- **AC-007:** Sign-up, login, create, edit, complete, filter, sort, search, and delete continue to work.
- **AC-008:** Automated tests cover date display, the `Edited` label, and the missing/invalid date fallback.

## Non-Functional Requirements

- Date presentation must remain readable at viewport widths of 480px or less.
- Rendering must safely insert date text using `textContent`.
- Date formatting must use built-in JavaScript only; no new dependencies may be introduced.
- Changes must not alter unrelated application behavior.

## Validation Rules, Edge Cases, and Negative Scenarios

- A creation date is valid only when it can be used to display the requested date; when missing or invalid, display `Created: Not available`.
- Show `Edited` only when both dates are usable and the last-updated date is later than the creation date.
- A missing or invalid last-updated date must not cause an edited label or a list-rendering error.
- Date output must be inserted as text, not interpreted markup.
- The list must continue rendering when either date is missing or invalid.

## Dependencies and Constraints

- **Data dependency:** Existing `createdAt` and `updatedAt` fields returned by `GET /todos`.
- **Scope constraint:** Frontend-only; limit implementation changes to `index.html`, `public/script.js`, and `public/styles.css`, plus tests.
- **API/data constraint:** No backend, API, or data-file changes.
- **Dependency constraint:** Do not add dependencies; use built-in JavaScript date formatting.
- **Safety/testing constraint:** Use `textContent` and add `data-testid` attributes.
- **Behavior constraint:** Do not modify unrelated application behavior.

## Out of Scope

- Due dates or reminders.
- Sorting or filtering by date.
- Relative-time or time-of-day display.
- User-selectable date formats or time-zone settings.
- Manually editing dates.

## Assumptions

None. The requirements above are taken from the Jira Story description and its acceptance criteria.

## Identified Gaps and Clarifying Questions

None. The Story provides sufficient detail for requirements intake.

## Traceability to Source Requirement

All FRs, ACs, constraints, and out-of-scope items are derived from the description and acceptance criteria of Jira Story EPMCDMETST-67543 (“Show created and edited dates on todo cards”). No linked issues were returned. No additional product rules have been inferred.

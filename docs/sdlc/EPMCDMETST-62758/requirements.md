# Requirements Specification

- **Story ID**: EPMCDMETST-62758
- **Source**: Jira Story [EPMCDMETST-62758](https://jiraeu.epam.com/browse/EPMCDMETST-62758)
- **Source snapshot or fetch evidence**: Fetched through configured Jira MCP on 2026-11-24 (current task date). Project: EPMCDMETST (EPM-CDME-TEST); issue type: Story; status: Open (To Do); summary: “As a shopper browsing Non-Fiction books, I want to filter results by format, language, publication date, and customer reviews so that I can quickly find Non-Fiction titles that match my preferences.” Labels: none returned. Epic Link: empty/null. Comments: none returned. Description includes sections General description, Business Value, Preconditions, Scenarios of use, Expected result, Affected areas, and Acceptance criteria. Its acceptance criteria are recorded verbatim in substance as AC-001–AC-009 below. The issue has valid Story type/project and acceptance criteria in its description; the separate Jira Acceptance Criteria custom field returned null. Read-only repository context: `index.html`, `public/script.js`, `public/styles.css`, and `todoServer.js` implement a To-Do application; no book-listing/filter implementation was present in these affected-area files. This is repository context, not a Jira requirement.
- **Executive summary**: Specify equivalent filter categories and option sets for Non-Fiction books listings/search, matching the corresponding Fiction book filters. Users can narrow results by format, language, publication date, and customer review rating. Multiple selected values within one category match by OR; selections across categories combine by AND. Publication periods are relative to today and rating thresholds are inclusive, per stakeholder clarifications.
- **Business objective and scope**: Reduce shopper effort and browsing friction by enabling Non-Fiction book discovery using format, language, recency, and review filters, and align Non-Fiction filtering with Fiction book filtering. Scope is the Non-Fiction book listing/search experience, its four named filter categories and exact option sets, result narrowing, clearing selections, and parity with the Fiction book filter set. The Jira identifies category/listing UI, search/listing behavior, metadata, and QA as affected areas; this specification does not prescribe implementation.
- **Actors and stakeholders**: Primary actor: shopper browsing a Non-Fiction books listing or search results scoped to Non-Fiction. Other stakeholders: Not Found.

## Functional requirements

| ID | Requirement | Source |
|---|---|---|
| FR-001 | The Non-Fiction books listing/search experience shall provide Book Format, Language, Publication Date, and Customer Reviews filters, using the same categories and options as the Fiction books filter set. | Jira description §1, §5, §7 AC-1 and AC-9; clarification C-1 |
| FR-002 | Book Format shall offer exactly hardcover, paperback, eBook, and audiobook; Language exactly English, Spanish, French, and German; Publication Date exactly last 30 days, last 6 months, and last year; Customer Reviews exactly 4-stars and above and 3-stars and above. | Jira description §7 AC-2–AC-5 |
| FR-003 | Applying any single filter option shall restrict Non-Fiction results to items matching it. Multiple selected values within one category shall match if any selected value in that category matches (OR); selected filters across categories shall all match (AND). | Jira description §7 AC-6 and AC-7; clarification C-2 |
| FR-004 | Publication Date options shall be interpreted relative to today, as the corresponding recent publication periods. | Jira description §4 scenario 3 and §7 AC-4/AC-6; clarification C-3 |
| FR-005 | Customer Reviews options shall include titles meeting the stated minimum rating; the 4-stars and above threshold includes ratings of 4 stars, and the 3-stars and above threshold includes ratings of 3 stars. | Jira description §4 scenario 2 and §7 AC-5/AC-6; clarification C-3 |
| FR-006 | Clearing a selected filter shall restore the broader Non-Fiction result set as appropriate to the remaining selections. If no items satisfy the selections, the matching result set is empty; empty-state presentation is Not Found. | Jira description §7 AC-6–AC-8; clarification C-2 |

## Non-functional requirements

| ID | Requirement | Source |
|---|---|---|
|  | Not Found: the Story specifies no measurable performance target, accessibility standard, responsive layout/breakpoints, reliability target, or persistence behavior across reloads, navigation, or sessions. | Jira description reviewed; no such requirement stated |

## Acceptance criteria

| ID | Testable criterion | Source |
|---|---|---|
| AC-001 | On a Non-Fiction books listing/search experience, the displayed filter categories are Book Format, Language, Publication Date, and Customer Reviews. | Jira description §7, criterion 1 |
| AC-002 | Book Format options are exactly: hardcover, paperback, eBook, audiobook. | Jira description §7, criterion 2 |
| AC-003 | Language options are exactly: English, Spanish, French, German. | Jira description §7, criterion 3 |
| AC-004 | Publication Date options are exactly: last 30 days, last 6 months, last year; each period is relative to today. | Jira description §7, criterion 4; clarification C-3 |
| AC-005 | Customer Reviews options are exactly: 4-stars and above, 3-stars and above; each threshold is inclusive. | Jira description §7, criterion 5; clarification C-3 |
| AC-006 | Applying any single filter updates Non-Fiction results so that only items matching the selected option are included; ratings at the selected minimum are included. | Jira description §7, criterion 6; clarification C-3 |
| AC-007 | Applying filters across multiple categories returns only items satisfying all selected categories; multiple selected options within a category return items matching any of those options. | Jira description §7, criterion 7; clarification C-2 |
| AC-008 | Clearing a selected filter restores the broader Non-Fiction results consistent with any remaining filters. | Jira description §7, criterion 8 |
| AC-009 | The Non-Fiction filter set has the same categories and options as the filter set available for Fiction books. | Jira description §7, criterion 9; clarification C-1 |

## Clarifications

| Question | Answer | Effect on requirements |
|---|---|---|
| C-1. What does “Fiction” in the parity requirement refer to? | “Fiction implementation” means fiction books. | FR-001/AC-009 compare the Non-Fiction book filter set with the Fiction book filter set; scope does not expand to changing Fiction behavior. |
| C-2. How are multiple selected values within one filter category combined? | OR matching. | FR-003 and AC-007 use OR within a category and retain the Jira requirement that selected filters together satisfy all selected filters (AND across categories). Clearing one selected filter leaves results constrained by any remaining selections (FR-006/AC-008). |
| C-3. How are publication date ranges and review-rating thresholds evaluated? | Date ranges are relative to today; review-rating thresholds are inclusive. | FR-004/AC-004 treat date options as recent periods relative to today; FR-005/AC-005/AC-006 include ratings equal to the stated minimum. Time zone, exact date boundary/cutoff, and calendar-versus-duration details are not specified and remain Not Found. |

## Assumptions and constraints

- The Jira precondition says Non-Fiction books have format, language, publication date, and customer review rating metadata available; actual behavior for missing or invalid metadata is Not Found.
- The OR-within-category rule is the user's clarification; AND-across-categories follows the Jira wording that combined selections satisfy all selected filters.
- The user's clarification resolves Fiction parity as Fiction books, without adding Fiction-side changes to scope.
- Zero matching items are a possible consequence of returning only matching results; the wording, placement, and behavior of a no-results display are Not Found.
- Filter selection persistence across page reloads, navigation, and sessions, and default selections, are Not Found. The only defined clearing behavior is the broader result set appropriate to remaining selections.
- Accessibility conformance, keyboard/screen-reader behavior, responsive breakpoints/layout, and measurable performance expectations are Not Found; no new non-functional guarantees are inferred.
- The Jira description's relative-date labels are preserved. Exact timezone, day boundary, endpoint inclusivity, and whether “last 6 months”/“last year” use calendar periods or elapsed durations are Not Found.
- The inspected repository files are a To-Do application rather than a book catalog. The presence/absence of a target bookstore application elsewhere and how this Story maps to a deployable product are Not Found; repository context does not alter the Jira-defined requirements.

## Traceability

| Requirement | Acceptance criterion |
|---|---|
| FR-001 | AC-001, AC-009 |
| FR-002 | AC-002, AC-003, AC-004, AC-005 |
| FR-003 | AC-006, AC-007 |
| FR-004 | AC-004, AC-006 |
| FR-005 | AC-005, AC-006 |
| FR-006 | AC-008 |

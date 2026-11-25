# Requirements Specification

- **Story ID**: EPMCDMETST-62758
- **Source**: Jira Story [EPMCDMETST-62758](https://jiraeu.epam.com/browse/EPMCDMETST-62758)
- **Source snapshot or fetch evidence**: Fetched through configured Jira MCP on 2026-11-25. Project: EPMCDMETST (EPM-CDME-TEST); issue type: Story; status: Open; summary: “As a shopper browsing Non-Fiction books, I want to filter results by format, language, publication date, and customer reviews so that I can quickly find Non-Fiction titles that match my preferences.” Jira updated: 2026-08-31 16:53:15 India Standard Time. Labels: Not Found. Epic Link: null. The separate Jira Acceptance Criteria field returned null; all nine acceptance criteria are in Description §7 and are attributed there below. The description also includes business value, preconditions, example scenarios, expected result, and affected areas. Repository context previously recorded: `index.html`, `public/script.js`, `public/styles.css`, and `todoServer.js` implement a To-Do application, with no book-listing/filter implementation present in those inspected files. No repo-wide baseline failure has been verified; repository observations are context, not Jira requirements.
- **Executive summary**: Specify the four filter categories and exact option labels for a Non-Fiction books listing/search, matching the Fiction filter set. Applying a single filter returns matching items; applying multiple filters together returns items satisfying all selected filters; clearing a selected filter restores broader results accordingly. Semantics not stated by Jira are left open rather than inferred.
- **Business objective and scope**: Reduce shopper effort and browsing friction and improve consistency in Non-Fiction book discovery. Scope is the Non-Fiction listing/search, its four named filter categories and exact options, matching results for single and combined filters, clearing selections, and parity with the Fiction filter set. Jira identifies UI, backend query logic, model mapping, and QA as affected areas. These are source-provided areas, not implementation prescriptions.
- **Actors and stakeholders**: Primary actor: shopper browsing a Non-Fiction books listing or search. Other stakeholders: Not Found.

## Functional requirements

| ID | Requirement | Source |
|---|---|---|
| FR-001 | The Non-Fiction books listing/search shall provide the filter categories Book Format, Language, Publication Date, and Customer Reviews. | Jira description §7, criterion 1 |
| FR-002 | The filter options shall be exactly: Book Format—hardcover, paperback, eBook, audiobook; Language—English, Spanish, French, German; Publication Date—last 30 days, last 6 months, last year; Customer Reviews—4-stars and above, 3-stars and above. | Jira description §7, criteria 2–5 |
| FR-003 | Applying any single filter shall return matching Non-Fiction items. | Jira description §7, criterion 6 |
| FR-004 | Applying multiple filters together shall return only items satisfying all selected filters. | Jira description §7, criterion 7 |
| FR-005 | Clearing a selected filter shall restore the broader result set accordingly. | Jira description §7, criterion 8 |
| FR-006 | The Non-Fiction filter set shall match the Fiction filter set in categories and options. | Jira description §7, criterion 9 |

## Non-functional requirements

| ID | Requirement | Source |
|---|---|---|
| — | Not Found: the Story specifies no measurable non-functional requirement. | Jira description reviewed; no measurable NFR stated |

## Acceptance criteria

| ID | Testable criterion | Source |
|---|---|---|
| AC-001 | The Non-Fiction listing/search displays Book Format, Language, Publication Date, and Customer Reviews filter categories. | Jira description §7, criterion 1 |
| AC-002 | Book Format options are exactly: hardcover, paperback, eBook, audiobook. | Jira description §7, criterion 2 |
| AC-003 | Language options are exactly: English, Spanish, French, German. | Jira description §7, criterion 3 |
| AC-004 | Publication Date options are exactly: last 30 days, last 6 months, last year. | Jira description §7, criterion 4 |
| AC-005 | Customer Reviews options are exactly: 4-stars and above, 3-stars and above. | Jira description §7, criterion 5 |
| AC-006 | Applying any single filter returns matching Non-Fiction items. | Jira description §7, criterion 6 |
| AC-007 | Applying multiple filters together returns items satisfying all selected filters. | Jira description §7, criterion 7 |
| AC-008 | Clearing a selected filter restores the broader results accordingly. | Jira description §7, criterion 8 |
| AC-009 | The Non-Fiction filter set matches the Fiction filter set in categories and options. | Jira description §7, criterion 9 |

## Clarifications and open questions

No clarification is needed to understand the explicit categories and options, single-filter matching, combined-filter matching, clearing behavior, or parity criterion. No user answers or defaults were supplied. The following behavior is not specified and remains open:

| Question | Answer | Effect on requirements |
|---|---|---|
| What exact date cutoffs apply to “last 30 days,” “last 6 months,” and “last year”; which time zone applies; and are the periods calendar-based or duration-based? | Not Found | Do not infer date-boundary, time-zone, or calendar/duration semantics. |
| If multiple values within one category can be selected, how should those selections combine? | Not Found | No within-category OR/AND behavior is specified. |
| How should items with missing filter metadata be handled? | Not Found | Matching behavior for absent metadata is unspecified. |
| What should users see when no items match? | Not Found | Empty-state presentation is unspecified. |
| Are selections or defaults required, and should selections persist across reloads, navigation, or sessions? | Not Found | No defaults or persistence behavior is specified. |
| What measurable performance targets, accessibility requirements, or responsive-layout requirements apply? | Not Found | No such non-functional target is specified. |

## Assumptions and constraints

- The Jira precondition says the user can access a Non-Fiction listing/search and that the relevant metadata is available.
- The exact filter labels and behavior in this document are limited to what is stated in the Jira description. No date interpretation, rating-threshold inclusivity, within-category multi-select rule, or other unstated behavior is assumed.
- The Story requires parity with the Fiction filter set in categories and options; any other interpretation or scope beyond that wording is Not Found.
- The Jira description identifies UI, backend query logic, model mapping, and QA as affected areas. It does not prescribe a technical implementation.
- The repository observations above do not establish product scope or a repo-wide baseline result.

## Traceability

| Requirement | Acceptance criterion |
|---|---|
| FR-001 | AC-001 |
| FR-002 | AC-002, AC-003, AC-004, AC-005 |
| FR-003 | AC-006 |
| FR-004 | AC-007 |
| FR-005 | AC-008 |
| FR-006 | AC-009 |

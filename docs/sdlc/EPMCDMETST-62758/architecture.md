# Architecture Design

- **Story ID**: EPMCDMETST-62758
- **Approved requirements**: `docs/sdlc/EPMCDMETST-62758/requirements.md`
- **Repository stack**: Node.js / Express 4, static HTML/CSS, browser-native JavaScript, and JSON-file persistence. Tests use Node's built-in test runner and Supertest.

## Architecture recommendation

The requested feature belongs to a Non-Fiction book listing and its book catalog. The detected application is a To-Do application: `index.html`, `public/script.js`, `todoServer.js`, and the existing integration tests contain no book listings, Fiction implementation, book metadata, or catalog API. Therefore there is no honest in-repository component to extend, and the feature cannot be integrated end-to-end here without first identifying/providing the bookstore host and its authoritative catalog source.

Design the feature as a host-owned listing capability: render the four filter groups in the existing Fiction/Non-Fiction book-browsing experience, keep normalized selections in the listing controller, and query the host's catalog API. Apply filtering against authoritative catalog metadata (preferably in the catalog/query layer), preserving OR within each category and AND between categories. Do not modify the To-Do UI, its `/todos` contract, or its JSON data files to simulate a bookstore. No dependencies are required.

The components and `/api/books` contract below are a proposed integration boundary, not existing repository capabilities. They become implementation locations only after the actual bookstore host, catalog schema/source, and API ownership are confirmed. If the Story is explicitly reassigned to this repository, implement it as a separate book-browsing surface and route rather than coupling it to To-Do screens or changing `/todos`.

## Component diagram

```text
                         (storefront host not present in this repository)
[Shopper]
    |
    v
[Fiction / Non-Fiction book listing]
    | renders labels/options; captures selections
    v
[Book-filter controller and selection state]
    | GET /api/books?genre=non-fiction&... (proposed contract)
    v
[Catalog query/API] ---> [Authoritative book catalog and metadata]
    | filtered books / errors
    v
[Listing renderer and empty/error state] ---> [Shopper]

[Current To-Do app: index.html, public/script.js, todoServer.js,
 tests/todo-api.integration.test.js] -- outside this feature boundary -->
```

## Components and responsibilities

| Component | Responsibility | Files |
|---|---|---|
| Book listing host | Establish Non-Fiction scope, render result cards, expose the matching Fiction filter set, and own listing lifecycle. | Not present. Locate in the actual bookstore application before implementation. |
| Filter controls and controller | Render the exact option groups, track selections, serialize selection changes, and refresh results while preserving the Non-Fiction scope. | Not present. If this repository is confirmed as host, use a separate book-specific static page/module (candidate `public/books.html` and `public/book-filters.js`); do not attach book behavior to To-Do controls in `index.html` or `public/script.js`. |
| Catalog API/query | Validate filter tokens and combine category predicates; return only matching Non-Fiction records. | Not present. The proposed `GET /api/books` is a host-owned interface, not a route currently implemented by `todoServer.js`. |
| Catalog data source | Supply format, language, publication date, and customer rating for each book; provide Fiction data/options for parity. | Not present; source, schema, ownership, and missing-metadata policy are unknown. |
| Book-filter tests | Verify option parity, URL/query serialization, category combination, date/rating boundaries, clearing, and empty results. | Not present. Add tests alongside the bookstore host's existing test conventions once identified; current tests only cover To-Do API and Git safety. |

## Technology choices

| Decision | Reason | Rejected alternatives |
|---|---|---|
| Reuse the storefront's existing UI and API stack; if the host is this repository, use browser-native JavaScript and existing Express rather than adding a framework. | Matches the detected stack and honors the no-dependency constraint, while avoiding a fabricated host migration. | Introducing React/Vue or another framework; adding a filter package; replacing the application architecture. |
| Keep filter controls/controller separate from To-Do UI and endpoints. | Book metadata and discovery are a separate domain; existing To-Do controls and `/todos` semantics cannot safely represent them. | Extending `currentFilter` or `GET /todos`; using To-Do JSON records as book data. |
| Apply predicates where the authoritative catalog is queried, behind the bookstore's listing API. | Keeps behavior consistent across clients and avoids downloading an unbounded catalog for browser-only filtering. | Client-only filtering as the assumed design; it is only viable if the host's actual catalog is deliberately small and already fully loaded (not established here). |
| Keep selected filters in listing/controller state and send them with each request. | Supports immediate refresh and clearing; persistence across reloads/navigation/sessions is unspecified. | Persisting in local storage, sessions, or permanent user preferences without a requirement. |

## Data flow

1. The host opens the Non-Fiction listing and renders exactly the same four groups and option sets as its Fiction book listing (FR-001/FR-002, AC-001–AC-005, AC-009).
2. The controller starts with no selected options. A shopper selects or clears an option; the controller keeps a set of selected values per category and retains the Non-Fiction scope.
3. The controller sends the complete current selection to the proposed catalog listing API. Repeated values in one category encode multiple choices.
4. The catalog query validates values, applies an OR predicate for each populated category, and ANDs the populated category predicates together. Date and rating comparisons use the rules below.
5. The API returns the matching books. The host renders them; an empty array produces the host's no-results state. The exact empty-state wording/layout is not specified.
6. Clearing an option updates only that category's selection and repeats the query. Clearing all options returns the broader Non-Fiction result set.

## Low-level design

### Filter model

Keep stable API tokens separate from visible labels. The following tokens are proposed; the required visible labels and option sets are authoritative.

| Category | Visible options | Proposed API tokens |
|---|---|---|
| Book Format | hardcover, paperback, eBook, audiobook | `hardcover`, `paperback`, `ebook`, `audiobook` |
| Language | English, Spanish, French, German | `en`, `es`, `fr`, `de` |
| Publication Date | last 30 days, last 6 months, last year | `last-30-days`, `last-6-months`, `last-year` |
| Customer Reviews | 4-stars and above, 3-stars and above | `4-plus`, `3-plus` |

Options are exact: do not expose additional values unless the matching Fiction filter set changes through separate scope/approval. Multiple selected format, language, date-period, or review-threshold tokens match when any selected token in that category matches (OR); all populated categories must match (AND). Ratings equal to the selected minimum are included. When both rating options are selected, the OR of the inclusive thresholds applies (equivalent to a minimum of 3); do not reinterpret selection as the stricter threshold.

### Date and rating evaluation

- Date periods are evaluated relative to “today,” not a fixed date baked into the client or catalog. The catalog/query layer should calculate cutoffs at request time so all clients share one interpretation.
- Requirement evidence does not settle timezone, day boundary, cutoff inclusivity, or whether “last 6 months” and “last year” mean calendar subtraction or elapsed durations. These must be resolved by product/catalog owners before implementation. Do not silently present a particular timezone or calendar rule as approved. Once settled, encode the selected policy centrally and test its boundaries, including date changes and leap/calendar boundaries as applicable.
- Review filters use `rating >= 4` and `rating >= 3` respectively, inclusive, against the catalog's authoritative rating scale. The scale, precision, and handling of unrated books are not specified; confirm the scale and define unrated records as non-matches unless product owners specify otherwise.

### Proposed API contract (not implemented in this repository)

`GET /api/books`

| Parameter | Cardinality / values | Meaning |
|---|---|---|
| `genre` | Required; `non-fiction` for this listing | Restricts the listing to Non-Fiction. The host must map this token to its authoritative genre/category model. |
| `format` | Repeatable; `hardcover`, `paperback`, `ebook`, `audiobook` | OR across supplied format values. |
| `language` | Repeatable; `en`, `es`, `fr`, `de` | OR across supplied language values. |
| `publishedWithin` | Repeatable; `last-30-days`, `last-6-months`, `last-year` | OR across supplied periods; each cutoff is relative to the request-time “today” under the approved date policy. |
| `minRating` | Repeatable; `4-plus`, `3-plus` | OR across supplied inclusive thresholds. |

Example request:

```http
GET /api/books?genre=non-fiction&format=paperback&format=ebook&language=en&publishedWithin=last-30-days&minRating=4-plus
```

The example selects paperback OR eBook, English, within the last 30 days, and rating at least 4; those populated categories are ANDed.

Proposed success response: `200 application/json`, a JSON array of records in the host's established book DTO shape. Minimum fields needed to render/filter are a stable book identifier and the authoritative format, language, publication date, and numeric customer rating (plus any fields the existing host requires to render a card). Do not create a new persisted schema before inspecting the real catalog.

No separate clear endpoint is needed: omit a query parameter to clear that category, and omit all optional filter parameters to clear all filters. A valid selection with no matches returns `200` and `[]`. Unknown or malformed filter tokens should return `400` with a stable JSON error shape; catalog/service failures should return `5xx` without leaking internals. Authentication, pagination, sorting, and response compatibility are host-specific and not specified by the Story; preserve the host's existing policies rather than assuming To-Do authentication or adding new policies.

## Error handling

- Reject unknown category tokens at the API boundary with `400`; do not silently broaden results after an invalid selection.
- Return `200 []` for a valid filter combination with no matches. The UI should distinguish this from a failed request.
- For network or server failures, retain current selections and show the host's existing recoverable error treatment; exact copy, retry controls, and accessibility behavior are not specified.
- Treat missing/invalid catalog metadata as a data-quality condition, not as a match by default. The catalog owner must confirm remediation/visibility policy before implementation.
- Do not alter `/todos` success/error behavior. Its existing `401`, `404`, and validation behavior is unrelated to book browsing.

## Risks

| Risk | Impact | Mitigation / decision needed |
|---|---|---|
| Story target and repository are different products; there is no bookstore UI, Fiction implementation, book source, or catalog route in this repository. | Any implementation here would fabricate product/catalog infrastructure or damage the To-Do application rather than satisfy the intended shopper flow. | Block implementation pending the bookstore repository/host and catalog/API owner. Confirm whether this Story is intentionally reassigned to this To-Do repository. |
| Relative-date semantics are underspecified. | Boundary results can differ between clients, timezones, and month/year arithmetic. | Product/catalog owner to define timezone, “today,” cutoff inclusivity, and calendar-vs-duration calculation; centralize policy and add boundary tests. |
| Fiction parity cannot be verified from this repository. | A hard-coded option list can drift from the actual Fiction filter set. | Reuse the host's shared option configuration/component if available; otherwise establish parity tests against the host's authoritative Fiction options. |
| Catalog metadata shape, rating scale, missing-value policy, and data source are unknown. | Filters may return incorrect or incomplete results, or cannot be implemented against current data. | Inspect the real catalog and define normalization, validation, and no-rating behavior before coding. |
| API ownership and shopper authentication policy are unknown. | A new route may conflict with an existing API or expose data under the wrong access policy. | Confirm the host's route conventions, authorization, error envelope, and query/pagination conventions. |

## Alternatives

1. **Add filter logic to `public/script.js` and book routes to `todoServer.js`** — rejected. Both files implement To-Do concepts, and no book catalog exists to support the behavior.
2. **Create a second bookstore application/catalog inside this repository** — rejected for this Story. It invents a product surface, data model, and persistence contract not required or supported by the approved requirements.
3. **Filter books only in the browser** — not selected as the default. The catalog size/loading model is unknown; filtering should normally happen where the authoritative catalog is queried. Revisit only if the actual host proves the full result set is already loaded and its conventions call for client-side filtering.
4. **Add a new dependency or UI framework** — rejected. No requirement forces one, and the repository already uses native browser JavaScript and Express.

## Requirements traceability

| Requirement | Architecture decision |
|---|---|
| FR-001 / AC-001, AC-009 | Put the four groups on the host's Non-Fiction book listing and derive/reuse the matching Fiction set. The host and Fiction implementation are not present here, so parity is an implementation prerequisite. |
| FR-002 / AC-002–AC-005 | Use the exact labels and option sets in the Filter Model; represent choices with stable tokens separate from labels. |
| FR-003 / AC-006–AC-007 | Repeatable query values express OR within a category; catalog predicates for populated categories are combined with AND. |
| FR-004 / AC-004, AC-006 | Evaluate date cutoffs at request time relative to today in the catalog/query layer; block implementation until timezone, boundary, and calendar/duration semantics are agreed. |
| FR-005 / AC-005–AC-006 | Evaluate inclusive thresholds (`rating >= 4` and `rating >= 3`) against authoritative numeric rating metadata; confirm rating scale and unrated-item policy. |
| FR-006 / AC-008 | Clearing omits that category from the next request while retaining other selections; no active filters returns the broader Non-Fiction listing; valid empty results return `200 []`. |

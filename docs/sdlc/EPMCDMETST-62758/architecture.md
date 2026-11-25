# Architecture Design

- **Story ID**: EPMCDMETST-62758
- **Requirements basis**: `docs/sdlc/EPMCDMETST-62758/requirements.md`. The user has explicitly resolved the repository/target mismatch and authorized a separate book-browsing feature in this repository with a small local sample catalog. The user also explicitly approved the four filter policies recorded below on 2026-11-25 in this conversation, in response to the proposed defaults. The requirements artifact's open-question text is unchanged; this architecture records the later policy clarification.
- **Repository stack**: Node.js, Express 4, static HTML/CSS, browser-native JavaScript, and JSON files. Tests use Node's built-in test runner and Supertest. No new dependency is proposed.

## Architecture recommendation

Add a small, independent book-browsing surface to this application rather than extending the To-Do screens, client state, API, or JSON data. Keep the existing root page (`/`), To-Do client (`public/script.js`), and `/todos` contract unchanged.

The proposed `/books` page is a separate, public browsing page with Fiction and Non-Fiction genre scopes. It opens on Non-Fiction; both scopes use the same four filter categories and option definitions so the Fiction/Non-Fiction parity requirement has a concrete in-app reference. A small, static sample catalog in a server-side JSON file supplies demonstration records; it is not an authoritative or production book inventory. A book-specific query module, called by a new `/api/books` route, owns genre scoping and filtering. The catalog is outside `public/` so it is read through the API rather than exposed as a raw file.

This design uses existing Express, static-file, JSON, and test conventions. It adds no framework, database, or package. The date-window, review-rating, missing-metadata, and same-category selection policies are now explicit user-approved design decisions (see Approved filter semantics); they govern the API, controls, query behavior, and tests below.

## Component diagram

```text
[Shopper]
    |
    v
[/books page: public/books.html + isolated books.js/books.css]
    | genre + selected filters
    | GET /api/books?genre=non-fiction&...
    v
[Express book route in todoServer.js]
    |
    v
[Book catalog/query boundary: bookCatalog.js]
    | reads / validates against
    +-----------------------> [data/books.json: small local sample catalog]
    +-----------------------> [public/book-filter-options.json: shared options]
    |
    v
[Matching book records or API error]
    |
    v
[Books page renders cards, empty state, or recoverable error]

[Existing To-Do page /, public/script.js, /todos, and user/todo JSON]
    -- remains a separate, unchanged application surface --
```

## Components and responsibilities

| Component | Responsibility | Proposed files / boundary |
|---|---|---|
| Book browsing page | Provide a distinct route, genre scope controls, single-select controls for each filter category, result cards, and empty/error presentation. Default the genre to Non-Fiction. Render every catalog-controlled field as text using DOM nodes and `textContent` (or an equivalent safe text-rendering API); never interpolate book data into `innerHTML`. | `public/books.html`, `public/books.css`, `public/books.js`; `GET /books` serves the page. |
| Shared filter definitions | Hold the canonical labels and exact option values once, for use by both genre scopes and server-side validation. | `public/book-filter-options.json`. This file contains public UI configuration only, not book records. |
| Book API route | Parse and validate book-specific query parameters, call the catalog boundary, and return JSON. Keep this route independent of `/todos` and its auth middleware. | New route in `todoServer.js`, e.g. `GET /api/books`. |
| Catalog/query boundary | Load the local catalog, restrict to requested genre, apply selected category predicates, and return matching books. Keep filtering logic out of To-Do functions and browser-only state. | New `bookCatalog.js` module. |
| Sample catalog | Supply a deliberately small, static top-level array of Fiction and Non-Fiction records with validated identity, display, genre, and optional filter fields. Include enough varied records to exercise the supported filter values and combined filters; the sample need not produce a match for every possible combination. | `data/books.json` (outside the static `public/` directory). |
| Book tests | Cover API cardinality and validation; required catalog schema and optional metadata validation; exact date cutoffs using a controllable request-time reference; inclusive rating thresholds and unrated records; active/inactive category handling for missing or invalid metadata; AND across categories; clearing; shared option parity; empty results; catalog errors; safe-rendering checks with markup-like catalog text (literal text, no interpreted markup); and explicit To-Do route/auth/response regressions without changing To-Do fixtures or persistence. | Proposed `tests/book-catalog.test.js` and `tests/books-api.integration.test.js`, following Node test runner/Supertest conventions. |

## Technology choices

| Decision | Reason | Rejected alternatives |
|---|---|---|
| Use a separate `/books` page and book-specific JS/CSS. | Keeps the new browse experience separate from the To-Do UI and its existing authentication-dependent lifecycle. | Adding book controls to `index.html` or `public/script.js`. |
| Use a small local JSON catalog read by an Express-backed query module. | Meets the user's explicit local-sample-catalog decision and provides a stable book-specific query boundary for combined filters. | Reusing `todos.json`, placing book data in user/todo files, or pretending a production bookstore service exists. |
| Use one shared filter-options JSON file for both Fiction and Non-Fiction controls and query validation. | Reduces drift and provides a direct way to meet/test category and option parity. | Maintaining two independent option lists in frontend and backend code. |
| Use the existing Express and browser-native technologies. | Matches `package.json`, `todoServer.js`, and existing static-page conventions; no requirement forces a new framework. | Adding a frontend framework, a filtering package, or a database dependency. |
| Keep the sample catalog read-only and filter in the server-side book query boundary. | The sample is demonstration data; server-side filtering provides a defined contract and exercises the intended separation even with a small catalog. | Client-only filtering coupled to To-Do client state or mutating existing JSON persistence. |

## Data flow

1. The shopper opens `/books`; the existing `/` route continues to serve the To-Do application.
2. The page initializes in the Non-Fiction genre scope and renders all four required categories using the shared option definitions. A genre control allows the Fiction option set to be compared within the new book surface; the Story's target result view remains Non-Fiction.
3. On initial load or a selection change, `books.js` sends the current genre and selected values to `GET /api/books`.
4. The route validates the genre and filter tokens against the shared options and passes them to `bookCatalog.js`.
5. The query boundary reads the local sample catalog, restricts it to the selected genre, then applies each selected category predicate. Selections across categories are combined with AND; each category accepts at most one selection.
6. The route returns the matching records. The browser renders book cards, an empty state for a valid zero-match response, or a recoverable error while retaining the current selection.
7. Clearing one filter omits that parameter on the next request while preserving other selections. Clearing all optional filters returns the broader catalog subset for the selected genre.

## Low-level design

### Book record shape

The local sample records should contain at least:

| Field | Purpose |
|---|---|
| `id` | Stable identifier for rendering and tests. |
| `title`, `author` | Card display. |
| `genre` | `fiction` or `non-fiction`; used to scope the results. |
| `format` | Format filter value. |
| `language` | Language filter value. |
| `publicationDate` | ISO date string used by UTC rolling-period filtering. |
| `averageRating` | Numeric average on a 5-star scale when rated; absent/unrated values do not match an active Customer Reviews filter. |

`data/books.json` must be a top-level JSON array; any other top-level shape, including an object or `null`, makes the catalog invalid. Each array entry must be an object with all of these required fields:

| Required field | Validation |
|---|---|
| `id` | Non-empty string after trimming; unique within the catalog. |
| `title` | Non-empty string after trimming; used as display text. |
| `author` | Non-empty string after trimming; used as display text. |
| `genre` | Exactly `fiction` or `non-fiction`. |

An invalid top-level structure, non-object entry, duplicate/invalid identity, or missing/invalid required field invalidates the catalog as a whole. Do not silently drop records, coerce required values, or continue with a partial catalog.

Filter metadata is optional, but each field must be checked when present. A present value outside its stated type/domain is invalid metadata (not a catalog-wide failure); missing and invalid metadata have the same matching behavior, described in Approved filter semantics. Do not coerce it or substitute a default.

| Optional field | Valid value when present |
|---|---|
| `format` | String exactly one of `hardcover`, `paperback`, `ebook`, `audiobook`. |
| `language` | String exactly one of `en`, `es`, `fr`, `de`. |
| `publicationDate` | A real calendar date encoded as `YYYY-MM-DD`; compare as a UTC date for the approved rolling windows. |
| `averageRating` | Finite JSON number from `0` through `5`, inclusive. Missing means unrated; a present non-number, non-finite/out-of-range value is invalid. |

Records in `data/books.json` are illustrative, local, and read-only. Their values must be adequate to demonstrate filtering but must not be presented as complete inventory or product truth. Do not write sample books to `todos.json`, users, or sessions.

### Filter model

Visible labels and option sets are requirements. Suggested stable values are implementation tokens only; token spelling can be adjusted to fit the chosen JSON contract without changing labels.

| Category | Required visible options | Suggested values |
|---|---|---|
| Book Format | hardcover, paperback, eBook, audiobook | `hardcover`, `paperback`, `ebook`, `audiobook` |
| Language | English, Spanish, French, German | `en`, `es`, `fr`, `de` |
| Publication Date | last 30 days, last 6 months, last year | `last-30-days`, `last-6-months`, `last-year` |
| Customer Reviews | 4-stars and above, 3-stars and above | `4-plus`, `3-plus` |

The shared option file should be used for both genre scopes, making the displayed Fiction and Non-Fiction categories/options identical (FR-006). Do not add extra filter options in this Story. The query layer applies all selected categories conjunctively (FR-004); controls are single-select within each category. Predicate details are specified in Approved filter semantics.

### API contract

Proposed new contract; no book route currently exists.

`GET /api/books`

| Parameter | Proposed cardinality and values | Behavior |
|---|---|---|
| `genre` | Required; `fiction` or `non-fiction` | Restricts records to that genre. The page initially sends `non-fiction`. |
| `format` | Optional; zero or one of the shared Book Format values | Restricts by exact format match. |
| `language` | Optional; zero or one of the shared Language values | Restricts by exact language match. |
| `publishedWithin` | Optional; zero or one of the shared Publication Date values | Applies the approved UTC rolling window and inclusive lower cutoff. |
| `minRating` | Optional; zero or one of `4-plus` or `3-plus` | Applies the approved inclusive threshold to a numeric 5-star average. |

Example:

```http
GET /api/books?genre=non-fiction&format=paperback&language=en&publishedWithin=last-30-days&minRating=4-plus
```

The response is `200 application/json` with a JSON array of matching book records, including the fields needed by the page. A valid query with no matches returns `200 []`. Omit an optional parameter to clear that category; omit all optional filters for the broader genre result set. Reject unsupported genres, unknown tokens, malformed values, duplicate instances of a filter parameter, and multi-value parameters with `400` rather than silently broadening results. Return a generic `500` response if the local catalog cannot be loaded, parsed, or validated; do not expose filesystem details.

The sample is intentionally small, so pagination is not proposed for this Story. If the catalog grows beyond a bounded sample, pagination and response limits need a separate design decision. The route is public browsing data and should not call `requireAuth`; it must not change authorization behavior for `/todos`.

## Error handling

- Invalid genre or filter values, including repeated or multi-value filter parameters: return `400` with a stable, non-sensitive JSON error. Keep accepted values aligned with the shared filter-options file.
- Valid selection with no matching sample records: return `200 []`; render a no-results state distinct from a network/server failure.
- Catalog read, parse, or validation failure: fail closed with `500` and a generic error; log server-side details using existing conventions if needed.
- Fetch failure in the browser: retain selected controls and show a recoverable error state; do not clear filters or imply that zero results were found.
- Invalid top-level catalog structure or any invalid required record field: fail closed with a generic `500`; do not silently drop bad rows or broaden results by using partial data.
- Missing or invalid optional metadata for a category: if that category's filter is active, the record does not match; if the category has no active filter, the record remains eligible under other active predicates. Invalid optional metadata alone does not invalidate the catalog.
- Render all catalog-controlled values only as text via DOM nodes and `textContent` or an equivalent safe text-rendering API. Never interpolate book data into `innerHTML`.
- Keep To-Do routes, authentication, response behavior, fixtures, and persistence unchanged.

### Compatibility regression tests

The integration suite must explicitly verify that `GET /` still serves the existing To-Do page; unauthenticated `GET /todos` remains protected with the existing unauthorized response; and authenticated `GET /todos` retains its existing `200` JSON-array response behavior and user scoping/filter/sort contract. These tests are regression assertions, not a reason to change To-Do routes or behavior. Use existing test conventions without modifying To-Do fixtures, `todos.json`, user/session persistence, or To-Do implementation.

## Approved filter semantics

The user explicitly approved the four policies below on **2026-11-25**, in this conversation, by approving the four previously proposed policies. This date/context records the approval without personal details. These are approved design clarifications for the semantics left open in the requirements; the requirements artifact itself was not edited.

| Policy | Approved behavior | API, UI, and query implications |
|---|---|---|
| Publication windows | Use UTC rolling periods of 30, 180, and 365 days for “last 30 days,” “last 6 months,” and “last year,” respectively. Each window has an inclusive lower cutoff, evaluated against the current request-time reference. **The approved interpretation of six months and one year is 180 and 365 days, not calendar arithmetic.** | Keep the three existing visible options and tokens. A single `publishedWithin` value selects one period. Use a controllable reference time in date-boundary tests; a publication date exactly at the lower cutoff matches. |
| Customer reviews | Use a numeric 5-star average. “4-stars and above” matches `averageRating >= 4`; “3-stars and above” matches `averageRating >= 3`. The comparisons are inclusive. Unrated records do not match when a review filter is active. | Keep one `minRating` value per request. Test exact-threshold inclusion, below-threshold exclusion, and unrated exclusion. |
| Missing or invalid category metadata | When a filter is active, a record missing valid metadata for that category does not match. When that category has no active filter, missing metadata in that category alone does not hide the record; other active category filters still apply normally. | Evaluate the metadata predicate only when its category is selected. Do not invent, coerce, or substitute missing/invalid values. Test active-filter exclusion and unfiltered-category retention for each category. |
| Multiple selections within one category | Each category is single-select. Different selected categories combine with AND. | Render single-select controls, accept at most one value for each API parameter, and reject duplicate or multi-value parameters with `400`. |

The requirements also give no measurable performance, accessibility, responsive-layout, persistence, or empty-state-copy targets. Use existing page conventions and semantic HTML, but treat any additional product-level criteria as requiring approval rather than inventing acceptance thresholds.

## Risks

| Risk | Impact | Mitigation |
|---|---|---|
| The sample catalog is small and not authoritative. | A filter combination may legitimately return no sample rows; demo results cannot represent real inventory or prove real-world completeness. | Label/document it as sample data; test query semantics with controlled fixtures and avoid claiming catalog coverage. |
| No Fiction browse or canonical filter implementation exists in the detected application. | Parity cannot be checked against a pre-existing storefront. | Make the shared option file the source for both Fiction and Non-Fiction scopes in the proposed books surface; test that both scopes render the same required categories and options. |
| The requirements artifact retains its original open-question wording, while the user has since approved the policies in this architecture. | Readers relying only on requirements may miss the subsequent decisions. | Treat the dated approval record and explicit semantics in this architecture as controlling design guidance; requirements and plan files remain unchanged in this artifact-only revision. |
| Catalog size may outgrow a simple JSON-backed sample. | Full-file reads and unpaginated responses would not scale to production inventory. | Keep this bounded to a small local sample; revisit storage, limits, and pagination before expanding beyond that purpose. |
| Existing app has authentication and To-Do-specific client/API behavior. | Reusing those paths could accidentally expose book browsing to To-Do-specific coupling or change existing behavior. | Isolate route, page, client state, data, and tests; preserve `/`, `/todos`, `public/script.js`, and existing user/todo files. |
| The local sample catalog may be malformed or contain unsafe/unexpected metadata. | A malformed required record could otherwise be silently omitted and produce incomplete or broadened results; unsafe rendering could interpret catalog text as markup. | Validate the entire top-level array and required fields before filtering; fail closed with generic `500` for structural/required-field errors. Validate optional filter fields without coercion and preserve approved conditional non-match semantics. Render catalog values only through safe text sinks, never by interpolating them into `innerHTML`. |

## Alternatives

1. **Attach book filters to `index.html` and `public/script.js`** — rejected because those files implement the To-Do UI and authentication lifecycle; user authorized a separate book surface.
2. **Reuse `/todos` or `todos.json` as a book catalog** — rejected because todo records do not represent book metadata and the route/data are unrelated.
3. **Serve the catalog JSON directly from `public/` and filter only in the browser** — rejected because it bypasses a book-specific query boundary and exposes data layout as the API. Only the non-sensitive shared option definitions belong in `public/`.
4. **Add a database/framework or external catalog dependency** — rejected because the user requested a small local sample catalog and existing stack suffices.

## Architecture decisions

| ID | Decision | Status |
|---|---|---|
| AD-1 | Build a standalone `/books` surface; preserve the To-Do root page and behavior. | User-authorized direction; design recommendation. |
| AD-2 | Use a small local, read-only JSON catalog outside the static directory, with a book-specific query module and `/api/books` boundary. | User-authorized local-sample direction; design recommendation. |
| AD-3 | Use one shared filter-options definition for Fiction and Non-Fiction, and combine selected categories with AND. | Design recommendation grounded in FR-004/FR-006. |
| AD-4 | Add no framework, dependency, database, or changes to To-Do data/API. | Design recommendation based on current stack and scope. |
| AD-5 | Use UTC rolling publication windows of 30/180/365 days with inclusive lower cutoffs; use inclusive thresholds against numeric 5-star averages and exclude unrated books under an active review filter; exclude records with missing/invalid metadata only when that category is filtered; use single-select within categories and AND across categories. | Explicit user approval on 2026-11-25, recorded above. |
| AD-6 | Protect compatibility: `/` continues serving the To-Do page, `/todos` retains its current authentication boundary and authenticated response behavior, and no To-Do fixtures or persistence are changed. | User-approved design-review decision D-3. |
| AD-7 | Render every catalog-controlled field as text using `textContent` or equivalent safe DOM text rendering; never interpolate book data into `innerHTML`. | User-approved design-review decision D-4. |
| AD-8 | Require a top-level catalog array with valid required identity/display/genre fields. Validate optional filter metadata when present; missing/invalid optional metadata is a non-match only when its category is active. Invalid catalog structure or required fields fail closed with generic `500`, never by dropping records or broadening results. | User-approved design-review decision D-5. |

## Requirements traceability

| Requirement | Architecture decision |
|---|---|
| FR-001 / AC-001 | `/books` renders the four required filter categories for the Non-Fiction scope using shared filter definitions. |
| FR-002 / AC-002–AC-005 | The shared option definitions use exactly the required visible labels and values listed in the Filter Model; controls are single-select. |
| FR-003 / AC-006 | `/api/books` applies the selected single-category predicate to the selected genre; publication date and review predicates follow the approved UTC-window and inclusive numeric-rating policies. Unit tests cover exact date cutoffs with a controlled reference time, threshold boundaries, unrated records, and missing/invalid metadata behavior when the category is active versus absent. |
| FR-004 / AC-007 | The query boundary applies all selected categories conjunctively; controls and API accept at most one value per category. Tests verify cross-category AND behavior and reject duplicate/multi-value filter parameters with `400`. |
| FR-005 / AC-008 | The page omits the cleared parameter and retains other selections; omitting all optional filters restores all records in the chosen genre. Tests verify clearing one category preserves other filters. |
| FR-006 / AC-009 | Fiction and Non-Fiction use the same shared categories/options on the proposed book surface; parity tests compare their rendered controls. |
| Design-review D-3 (compatibility) | Integration tests assert `/` serves the To-Do page, unauthenticated `/todos` remains protected, and authenticated `/todos` response behavior remains unchanged; do not alter To-Do fixtures or persistence. |
| Design-review D-4 (safe rendering) | Book-card rendering uses `textContent` or equivalent safe DOM text sinks for every catalog-controlled field; catalog values are never interpolated into `innerHTML`. |
| Design-review D-5 (catalog integrity) | The catalog is a top-level array with validated required `id`, `title`, `author`, and `genre`; present optional filter metadata is validated without coercion. Invalid structure/required fields produce generic `500`; optional missing/invalid metadata only excludes a record when its category is active. Tests cover each boundary. |

## Changes after design review

| Decision ID | What changed | Where |
|---|---|---|
| UAP-1 | Recorded user approval for UTC rolling periods of 30/180/365 days with inclusive lower cutoffs; clarified that six months/one year mean 180/365 days. | Approved filter semantics; API contract; AD-5; FR-003 traceability. |
| UAP-2 | Recorded numeric 5-star average and inclusive `>=4` / `>=3` review thresholds, with unrated books excluded under an active review filter. | Approved filter semantics; Filter Model; API contract; Error handling; FR-003 traceability. |
| UAP-3 | Recorded conditional exclusion for missing/invalid category metadata: exclude only when that category's filter is active. | Approved filter semantics; Error handling; Risks; AD-5. |
| UAP-4 | Recorded single-select cardinality within categories and AND across categories; aligned controls, request validation, and tests. | Data flow; Filter Model; API contract; Approved filter semantics; FR-004 traceability. |
| D-3 | Specified explicit regression assertions for the root To-Do page, protected `/todos`, and unchanged authenticated `/todos` response behavior; prohibited changes to To-Do fixtures and persistence. | Components and responsibilities; Error handling and Compatibility regression tests; Risks; AD-6; traceability. |
| D-4 | Required safe text rendering for every catalog-controlled field and prohibited interpolating book data into `innerHTML`. | Components and responsibilities; Error handling; Risks; AD-7; traceability. |
| D-5 | Defined the top-level array and required/optional field validation, conditional non-match behavior for optional metadata, and generic fail-closed handling for structural/required-field errors. | Components and responsibilities; Low-level design / Book record shape; Error handling; Risks; AD-8; traceability. |

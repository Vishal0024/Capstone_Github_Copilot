# Architecture Design

- **Story ID**: EPMCDMETST-62758
- **Requirements basis**: `docs/sdlc/EPMCDMETST-62758/requirements.md`. The user has explicitly resolved the repository/target mismatch and authorized a separate book-browsing feature in this repository with a small local sample catalog. This resolves the target decision from design review; it does not resolve the filter semantics listed below or constitute approval of unstated product behavior.
- **Repository stack**: Node.js, Express 4, static HTML/CSS, browser-native JavaScript, and JSON files. Tests use Node's built-in test runner and Supertest. No new dependency is proposed.

## Architecture recommendation

Add a small, independent book-browsing surface to this application rather than extending the To-Do screens, client state, API, or JSON data. Keep the existing root page (`/`), To-Do client (`public/script.js`), and `/todos` contract unchanged.

The proposed `/books` page is a separate, public browsing page with Fiction and Non-Fiction genre scopes. It opens on Non-Fiction; both scopes use the same four filter categories and option definitions so the Fiction/Non-Fiction parity requirement has a concrete in-app reference. A small, static sample catalog in a server-side JSON file supplies demonstration records; it is not an authoritative or production book inventory. A book-specific query module, called by a new `/api/books` route, owns genre scoping and filtering. The catalog is outside `public/` so it is read through the API rather than exposed as a raw file.

This design uses existing Express, static-file, JSON, and test conventions. It adds no framework, database, or package. Date-window, review-rating, missing-metadata, and same-category multi-select semantics remain unresolved; the suggested defaults in this document are proposals only and require product approval before implementation.

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
| Book browsing page | Provide a distinct route, genre scope controls, filter controls, result cards, and empty/error presentation. Default the genre to Non-Fiction. | `public/books.html`, `public/books.css`, `public/books.js`; `GET /books` serves the page. |
| Shared filter definitions | Hold the canonical labels and exact option values once, for use by both genre scopes and server-side validation. | `public/book-filter-options.json`. This file contains public UI configuration only, not book records. |
| Book API route | Parse and validate book-specific query parameters, call the catalog boundary, and return JSON. Keep this route independent of `/todos` and its auth middleware. | New route in `todoServer.js`, e.g. `GET /api/books`. |
| Catalog/query boundary | Load the local catalog, restrict to requested genre, apply selected category predicates, and return matching books. Keep filtering logic out of To-Do functions and browser-only state. | New `bookCatalog.js` module. |
| Sample catalog | Supply a deliberately small, static set of Fiction and Non-Fiction records with fields needed for cards and filters. Include enough varied records to exercise the supported filter values and combined filters; the sample need not produce a match for every possible combination. | `data/books.json` (outside the static `public/` directory). |
| Book tests | Cover the catalog query, API validation, combined filters, clearing, shared option parity, empty results, and errors without changing To-Do fixtures. | Proposed `tests/book-catalog.test.js` and `tests/books-api.integration.test.js`, following Node test runner/Supertest conventions. |

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
5. The query boundary reads the local sample catalog, restricts it to the selected genre, then applies every selected category predicate. Selected filters across different categories are combined with AND, as required. Same-category multiple-selection behavior must not be assumed.
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
| `publicationDate` | ISO date string used by publication-period filtering. |
| `averageRating` | Numeric rating when known; scale/meaning remains a decision below. |

Records in `data/books.json` are illustrative, local, and read-only. Their values must be adequate to demonstrate filtering but must not be presented as complete inventory or product truth. Do not write sample books to `todos.json`, users, or sessions.

### Filter model

Visible labels and option sets are requirements. Suggested stable values are implementation tokens only; token spelling can be adjusted to fit the chosen JSON contract without changing labels.

| Category | Required visible options | Suggested values |
|---|---|---|
| Book Format | hardcover, paperback, eBook, audiobook | `hardcover`, `paperback`, `ebook`, `audiobook` |
| Language | English, Spanish, French, German | `en`, `es`, `fr`, `de` |
| Publication Date | last 30 days, last 6 months, last year | `last-30-days`, `last-6-months`, `last-year` |
| Customer Reviews | 4-stars and above, 3-stars and above | `4-plus`, `3-plus` |

The shared option file should be used for both genre scopes, making the displayed Fiction and Non-Fiction categories/options identical (FR-006). Do not add extra filter options in this Story. The query layer must apply all selected categories conjunctively (FR-004); per-category choice cardinality and the detailed predicate semantics remain subject to the open decisions below.

### API contract

Proposed new contract; no book route currently exists.

`GET /api/books`

| Parameter | Proposed cardinality and values | Behavior |
|---|---|---|
| `genre` | Required; `fiction` or `non-fiction` | Restricts records to that genre. The page initially sends `non-fiction`. |
| `format` | Optional; one of the shared Book Format values | Restricts by format. Multiple values are not defined until approved. |
| `language` | Optional; one of the shared Language values | Restricts by language. Multiple values are not defined until approved. |
| `publishedWithin` | Optional; one of the shared Publication Date values | Applies the selected publication window after its boundaries are approved. |
| `minRating` | Optional; `4-plus` or `3-plus` | Applies the selected rating threshold after the scale and missing-value policy are approved. |

Example:

```http
GET /api/books?genre=non-fiction&format=paperback&language=en&publishedWithin=last-30-days&minRating=4-plus
```

The response is `200 application/json` with a JSON array of matching book records, including the fields needed by the page. A valid query with no matches returns `200 []`. Omit an optional parameter to clear that category; omit all optional filters for the broader genre result set. Reject unsupported genres, unknown tokens, malformed values, and unsupported duplicate/multi-value parameters with `400` rather than silently broadening results. Return a generic `500` response if the local catalog cannot be loaded or parsed; do not expose filesystem details.

The sample is intentionally small, so pagination is not proposed for this Story. If the catalog grows beyond a bounded sample, pagination and response limits need a separate design decision. The route is public browsing data and should not call `requireAuth`; it must not change authorization behavior for `/todos`.

## Error handling

- Invalid genre or filter values: return `400` with a stable, non-sensitive JSON error. Keep accepted values aligned with the shared filter-options file.
- Valid selection with no matching sample records: return `200 []`; render a no-results state distinct from a network/server failure.
- Catalog read/parse failure: return `500` with a generic error; log server-side details using existing conventions if needed.
- Fetch failure in the browser: retain selected controls and show a recoverable error state; do not clear filters or imply that zero results were found.
- Missing book metadata: do not infer a match or substitute a value. Filter behavior is blocked on the explicit missing-data decision below.
- Do not alter existing To-Do authentication, response shapes, routes, or data files.

## Unresolved semantics and proposed defaults (approval required)

The requirements do not decide these behaviors. The suggested defaults are design proposals only; they are **not** user-agreed and must not be implemented as approved behavior until confirmed.

| Ambiguity | Requirements state | Proposed default for approval | Must be decided before |
|---|---|---|---|
| Publication date windows | “Last 30 days,” “last 6 months,” and “last year” do not specify calendar vs. duration arithmetic, timezone, reference instant, or cutoff inclusivity. | Use UTC and a request-time rolling reference; define windows as 30, 180, and 365 days respectively, including the lower bound. Confirm whether this is acceptable or choose calendar-month/year semantics instead. | Implementing date predicates and boundary tests. |
| Rating representation and thresholds | Scale, precision, aggregation, inclusivity, and unrated-review behavior are unspecified. | Use a numeric 5-star average and inclusive `averageRating >= threshold` checks for 4-plus/3-plus; do not treat unrated books as meeting a threshold. Confirm the scale/source and comparison semantics. | Implementing rating predicates or rating boundary tests. |
| Missing filter metadata | Handling of missing/invalid format, language, date, or rating is unspecified. | Keep records visible when no filter is selected; when a category filter is active, exclude records lacking valid metadata for that category rather than guessing a value. Confirm per-field behavior and whether data-quality warnings are needed. | Finalizing matching policy and missing-data tests. |
| Multiple selections within one category | The requirements define AND across selected filters but do not say whether values within a category are multi-select or how they combine. | Permit at most one value per category (single-select controls); keep AND across categories. If multi-select is desired, product must define within-category OR/AND behavior before the API accepts arrays. | Choosing control type, query cardinality, and combination tests. |

The requirements also give no measurable performance, accessibility, responsive-layout, persistence, or empty-state-copy targets. Use existing page conventions and semantic HTML, but treat any additional product-level criteria as requiring approval rather than inventing acceptance thresholds.

## Risks

| Risk | Impact | Mitigation |
|---|---|---|
| The sample catalog is small and not authoritative. | A filter combination may legitimately return no sample rows; demo results cannot represent real inventory or prove real-world completeness. | Label/document it as sample data; test query semantics with controlled fixtures and avoid claiming catalog coverage. |
| No Fiction browse or canonical filter implementation exists in the detected application. | Parity cannot be checked against a pre-existing storefront. | Make the shared option file the source for both Fiction and Non-Fiction scopes in the proposed books surface; test that both scopes render the same required categories and options. |
| Date, rating, missing-data, and same-category selection semantics are open. | Different reasonable implementations would return different results and tests would not be deterministic. | Obtain approval for the proposed defaults or alternatives in the table before implementing those predicates. |
| Catalog size may outgrow a simple JSON-backed sample. | Full-file reads and unpaginated responses would not scale to production inventory. | Keep this bounded to a small local sample; revisit storage, limits, and pagination before expanding beyond that purpose. |
| Existing app has authentication and To-Do-specific client/API behavior. | Reusing those paths could accidentally expose book browsing to To-Do-specific coupling or change existing behavior. | Isolate route, page, client state, data, and tests; preserve `/`, `/todos`, `public/script.js`, and existing user/todo files. |

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
| AD-5 | Date boundaries, rating policy, missing metadata, and same-category multi-select remain unapproved; tabled defaults require product approval. | Open decisions; no default is represented as agreed. |

## Requirements traceability

| Requirement | Architecture decision |
|---|---|
| FR-001 / AC-001 | `/books` renders the four required filter categories for the Non-Fiction scope using shared filter definitions. |
| FR-002 / AC-002–AC-005 | The shared option definitions use exactly the required visible labels and values listed in the Filter Model. |
| FR-003 / AC-006 | `/api/books` applies one selected category predicate to the selected genre; date/rating behavior awaits approval of boundary semantics. |
| FR-004 / AC-007 | The book query boundary applies all selected categories conjunctively; same-category multi-selection remains an explicit open decision. |
| FR-005 / AC-008 | The page omits the cleared parameter and retains other selections; omitting all optional filters restores all records in the chosen genre. |
| FR-006 / AC-009 | Fiction and Non-Fiction use the same shared categories/options on the proposed book surface; parity tests compare their rendered controls. |

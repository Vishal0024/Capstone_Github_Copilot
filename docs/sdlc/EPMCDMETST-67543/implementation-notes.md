# Implementation Notes — EPMCDMETST-67543

## Changes

- Updated `architecture.md` to record D-1 (built-in Node test runner) and D-2 (strict timestamp input validation).
- Updated `public/script.js` to reject non-string and blank inputs before parsing, format valid dates as `DD Mon YYYY` in the local timezone, and render Created/conditional Edited metadata with `textContent` and stable test IDs.
- Added `tests/todo-timestamps.test.js` using only `node:test`, `node:assert`, and a minimal DOM harness; added the `npm test` script.
- No CSS adjustment was needed: the timestamp container remains a normal block inside the existing card flex column, the two labels are separate block elements, and the existing <=700px rule switches the card grid to one column.
- Existing create/edit success handlers and backend/API behavior were left unchanged.

## Validation

- Baseline, before edits: `npm test` exited 1 with `npm error Missing script: "test"`.
- After edits: `$env:TZ = 'America/Los_Angeles'; npm test` passed all 5 tests (0 failures), including local-time formatting, later/equal/earlier comparisons, missing/null/empty/whitespace/non-string/unparsable inputs, and markup-injection/list-continuation behavior.
- Startup: `npm start` reported `App is listening on http://localhost:3000`.
- Read-only `GET /todos`: returned HTTP 401 without authentication; no data was changed.
- No lint or build scripts are configured in `package.json`.
- `git diff --check` reported trailing whitespace in the pre-existing `.gitignore` changes; those changes were left untouched:
  - `.gitignore:9: trailing whitespace.`
  - `.gitignore:10: trailing whitespace.`
  - `.gitignore:11: trailing whitespace.`

## Scope

Changed only `architecture.md`, `public/script.js`, `package.json`, `tests/todo-timestamps.test.js`, and this implementation note. No dependencies were added. No commit or push was made.

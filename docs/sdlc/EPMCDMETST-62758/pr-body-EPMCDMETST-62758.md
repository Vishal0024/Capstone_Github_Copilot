## Summary

Add a public book catalog page and API with genre and metadata filters, supporting combined filtering without affecting existing To-Do behavior. Story: EPMCDMETST-62758.

## Changes Made

- Add the public `/books` catalog experience and `/api/books` filtering for genre and book metadata.
- Support combined filters and prevent stale filter requests from overwriting newer results (F-001 resolved).
- Update the README and changelog with catalog usage and local setup details.

## Test Evidence

`npm run test:unit (24/24), npm run test:integration (8/8), npm test (24/24), npm run lint (pass), npm run coverage (93.03% production lines, 85% threshold passed), npm run sdlc:verify (pass), npm run docs:check -- EPMCDMETST-62758 (pass).`

HTTP smoke evidence: `/books` 200, `/api/books?genre=non-fiction` 200, `/` 200, unauthenticated `/todos` 401.

## Known Limitations

- No real-browser automation or visual confirmation was available; deterministic DOM/fetch and HTTP checks are not a substitute for browser verification.
- Two existing moderate audit findings remain in the Nodemon/minimatch dependency chain; they were unchanged by this story.
- Live Jira lookup and browser visual confirmation were unavailable during this Step 8 run.
- No verified baseline failures or known KI IDs are recorded (the code review confirms no KI-1..KI-3 verified).
- The code review has no remaining findings; F-001 is resolved. No maintainer review or approval is claimed.

## Reviewer Checklist

- [ ] Requirements and acceptance criteria were reviewed.
- [ ] Code changes match the approved implementation plan.
- [ ] Tests and coverage passed.
- [ ] Documentation checks passed.
- [ ] Security findings were addressed.

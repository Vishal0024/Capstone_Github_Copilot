# Pipeline Rules

1. Run stages in order and require explicit HITL approval after every stage.
2. Work only on `feature/<STORY-ID>`; never commit or push directly to `main`.
3. Save all required artifacts under `docs/sdlc/<STORY-ID>/` and record the commit SHA.
4. All PRs require passing automated tests, lint, docs checks, 85% production line coverage, and dependency/security checks.
5. Finding severity is `BLOCKER`, `MAJOR`, or `MINOR`; unresolved BLOCKER or MAJOR findings block approval.
6. Missing source or tool evidence must be recorded as `Not Found`; never fabricate Jira, GitHub, test, or MCP results.
7. PR descriptions must include Summary, Changes Made, Test Evidence, Known Limitations, and Reviewer Checklist.
8. A stage ledger is maintained with artifact, commit, approval, timestamp, and external-action evidence.
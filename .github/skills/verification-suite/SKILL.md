---
name: verification-suite
description: Generate and run repository-supported verification for a Story, including tests, coverage, baseline comparison, AC traceability, and document checks.
---

# Verification Suite

1. Detect the repository stack and only use configured tools.
2. Record environment, revision, branch, baseline, and exact test totals.
3. Run story-specific tests, configured full suites, lint, coverage, startup checks, and docs checks.
4. Compare every failure with the recorded baseline. A failure is new unless it matches a documented baseline.
5. Map every acceptance criterion to test evidence or a clearly marked limitation.
6. Enforce 85% production line coverage; do not report test-harness coverage as production coverage.
7. Write `docs/sdlc/<STORY-ID>/verification.md` using the verification template.
8. Never infer success from source inspection or a missing command.

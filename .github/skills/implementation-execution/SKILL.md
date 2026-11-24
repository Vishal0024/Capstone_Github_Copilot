---
name: implementation-execution
description: Implement an approved plan safely, preserve baseline evidence, and verify changes using repository-native tooling.
---

# Implementation Execution

1. Confirm the approved plan, feature branch, protected paths, and current worktree.
2. Record test/build/lint/coverage baselines before changing code.
3. Implement only planned tasks; stop and report scope changes.
4. Follow repository conventions and add focused tests for introduced behavior.
5. Run configured checks and compare results with the baseline.
6. Record files, tasks, commits, verification, deviations, and errors in implementation notes.
7. Never claim a push or external action unless its tool call succeeded.

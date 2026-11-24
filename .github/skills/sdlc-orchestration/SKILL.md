---
name: sdlc-orchestration
description: Coordinate sequential SDLC stages with explicit approvals, durable evidence, and safe recovery.
---

# SDLC Orchestration

1. Read the canonical pipeline configuration and validate the Story key.
2. Run one stage at a time in the prescribed order; never parallelize dependent stages.
3. After each stage, verify its artifact and commit evidence, present the complete report, and wait for explicit user approval.
4. On rejection or failure, rerun only the responsible stage and invalidate downstream artifacts affected by changes.
5. Track tool failures as failures; never infer Jira/GitHub success.
6. Resume only from verified stage state and never skip an unapproved gate.

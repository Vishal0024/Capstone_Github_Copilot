---
name: jira-traceability
description: Record Jira source evidence and preserve Story-to-AC-to-implementation traceability.
---

# Jira Traceability

1. Fetch the Jira Story only through the configured Jira MCP.
2. Record issue key, title, status, source snapshot/evidence, and acceptance criteria.
3. Never infer Jira fields or external success.
4. Link requirement IDs to architecture decisions, implementation tasks, tests, review findings, and PR evidence.
5. Post Jira comments or remote links only after the corresponding MCP action succeeds.

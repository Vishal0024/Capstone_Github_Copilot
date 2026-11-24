# Hooks

## Implemented Copilot hook

- `.github/hooks/git-safety-guard.json` runs on Copilot's `preToolUse` event.
- It blocks explicit pushes to `main`/`master`, broad or force pushes, and selected destructive Git commands.
- This applies only to Git CLI commands exposed in Copilot tool arguments. It does not intercept manual terminal commands, GitHub MCP operations, or replace Git server branch protection.

## Git hooks not currently installed

The following are proposed Git lifecycle checks, not active hooks in this repository:

- `pre-commit`: linting and syntax checks.
- `pre-push`: run the unit test suite.
- `post-merge`: synchronize Confluence documentation.

Use a shared hook manager for local Git hooks and CI/branch protection for checks that must be enforced for every contributor.
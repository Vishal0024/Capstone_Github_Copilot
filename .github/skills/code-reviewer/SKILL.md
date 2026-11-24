---
name: code-reviewer
description: 'Review code changes or pull requests for correctness, security, error handling, test coverage, maintainability, dependency safety, and adherence to project conventions.'
---
# Code Reviewer

Use this skill when the user provides a code diff, changed files, branch comparison, or pull request and needs a structured, actionable review before approval.

## Workflow
1. Read the changed code, related tests, requirements, implementation plan, and relevant project conventions.
2. Understand the intended behavior and identify the scope of the code changes.
3. Evaluate the changes across the following review dimensions:
   - Correctness and alignment with requirements
   - Security vulnerabilities, validation gaps, and sensitive-data exposure
   - Error handling, edge cases, and failure behavior
   - Test coverage, test quality, and testability
   - Code clarity, maintainability, and separation of concerns
   - DRY principle, duplication, and unnecessary complexity
   - Dependency safety, compatibility, and configuration risks
4. Classify every finding by severity:
   - Critical: Must be fixed before approval.
   - Warning: Should be fixed before merge unless a documented exception is approved.
   - Suggestion: Optional improvement that does not block merge.
5. For each finding, identify the affected file, explain the risk, and provide a concrete recommended change.
6. Save the complete review locally in `code-review.md`.
7. When GitHub pull request tooling is available, post the applicable review findings to the active pull request as comments.
8. Summarize the overall health of the changes and state whether approval is recommended.

## Output Format
Provide the review in this structure:
- **Review Scope**
- **Summary**
- **Overall Recommendation**
- **Findings by Severity** (Critical, Warning, Suggestion)
- **Test Coverage and Verification Assessment**
- **Actionable Recommendations**
- **GitHub PR Comment Status**

## Quality Rules
- Be constructive, specific, and objective in all feedback.
- Trace review findings to changed code, documented requirements, tests, or established project conventions.
- Do not invent defects, test results, pull request comments, or GitHub actions.
- Clearly distinguish verified findings from items that could not be validated.
- Avoid subjective stylistic comments unless they conflict with a stated project convention or affect readability, maintainability, security, or correctness.
- Do not recommend approval when unresolved Critical findings exist.
- If required review context is missing, identify the missing context and ask a clear question rather than guessing.
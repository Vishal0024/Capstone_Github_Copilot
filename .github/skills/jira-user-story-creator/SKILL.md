---
name: jira-user-story-creator
description: 'Create a Jira user story from a short feature description, including a clear summary, acceptance criteria, and key issue fields.'
---
# Jira User Story Creator

Use this skill when the user provides a short feature description and wants it turned into a Jira-ready user story.

## Workflow
1. Read the feature description and identify the user, goal, and value.
2. Rewrite the request as a concise Jira story summary.
3. Add a description that explains the business need and expected outcome.
4. Draft testable acceptance criteria using clear, measurable statements.
5. Include practical issue fields when helpful, such as:
   - Issue type: Story
   - Priority
   - Labels
   - Components
   - Assignee
   - Epic link
   - Story points
6. Keep the wording concise, unambiguous, and ready to paste into Jira.

## Output Format
Provide the story in this structure:
- **Summary**
- **Description**
- **Acceptance Criteria**
- **Issue Fields**

## Quality Rules
- Make acceptance criteria specific and testable.
- Avoid implementation details unless the user asks for them.
- Preserve the user’s intent while improving clarity.
- If key information is missing, note the assumption rather than inventing details.

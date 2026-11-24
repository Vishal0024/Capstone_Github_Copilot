---
name: requirement-analyst
description: 'Analyze Jira stories or raw stakeholder requirements, identify ambiguities, gaps, dependencies, risks, and edge cases, and produce a structured specification for downstream design and planning.'
---
# Requirement Analyst

Use this skill when the user provides a Jira issue, user story, feature request, stakeholder brief, or raw requirements and needs them analyzed, clarified, and structured before design and implementation.

## Workflow
1. Read the supplied Jira story, acceptance criteria, stakeholder request, and any supporting project documentation.
2. Identify the core business objective, intended users, expected value, and boundaries of the requested change.
3. Extract and organize explicit requirements into:
   - Functional requirements
   - Non-functional requirements
   - Acceptance criteria
   - Constraints and dependencies
4. Analyze the input for:
   - Ambiguities, contradictions, and missing information
   - Assumptions that require stakeholder confirmation
   - Validation rules and error scenarios
   - Edge cases and negative scenarios
   - Security, privacy, performance, accessibility, and reliability considerations
5. Formulate targeted clarifying questions for each unresolved gap.
6. Create a structured requirements specification using the project requirements template.
7. Save the final artifact as `requirements.md` only after clearly labeling confirmed requirements, assumptions, and open questions.
8. Provide a concise stage summary suitable for Human-in-the-Loop approval before downstream architecture and implementation planning begin.

## Output Format
Provide the analysis in this structure:
- **Executive Summary**
- **Business Objective and Scope**
- **Actors and Stakeholders**
- **Functional Requirements**
- **Acceptance Criteria**
- **Non-Functional Requirements**
- **Validation Rules, Edge Cases, and Negative Scenarios**
- **Dependencies and Constraints**
- **Assumptions**
- **Identified Gaps and Clarifying Questions**
- **Traceability to Source Requirement**

## Quality Rules
- Ensure every requirement is traceable to the provided Jira story, stakeholder input, or an explicitly labeled assumption.
- Do not invent business rules, acceptance criteria, technical constraints, or Jira details.
- Highlight missing information through clear questions rather than guessing.
- Keep requirements measurable, testable, unambiguous, and understandable by both technical and non-technical stakeholders.
- Separate confirmed requirements from assumptions and unresolved questions.
- Do not prescribe a specific technical implementation unless it is explicitly stated in the source requirement.
- Include negative scenarios and boundary conditions where the provided requirement supports them.
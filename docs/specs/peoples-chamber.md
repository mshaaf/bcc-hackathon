# Specification: People's Chamber

**Track:** Community Development. **Status:** finalist; not selected. **User:** a resident preparing their own public testimony.

**Promise:** connect sourced hearing context to personal experience, rehearse a specific request, and leave with a resident-owned statement.

## Functional requirements

- PC-1: Use one dated official notice for a real build, retaining source and logistics. The concept preview uses a fictional practice notice.
- PC-2: Separate sourced institutional facts from the resident's experience and requested action.
- PC-3: Offer a two-minute rehearsal timer started by the user and a fixed human-chair practice question.
- PC-4: Let the resident revise their own ask and inspect the exact wording that will appear in the statement.
- PC-5: Export the editable testimony and source/context notes, with a clear handoff to official submission instructions.

## Acceptance criteria

- AC-PC-1: Given a notice with missing logistics, when context is displayed, then the missing values remain unknown rather than invented.
- AC-PC-2: Given a revised request, when testimony is previewed/exported, then the revision appears and the original personal experience is preserved unless the resident edits it.
- AC-PC-3: Given the page loads, when no rehearsal has been started, then the timer does not run automatically.
- AC-PC-4: Given a practice question, when it appears, then it is identified as rehearsal rather than a live official response.
- AC-PC-5: Given an exported statement, when the user finishes, then the interface states nothing has been officially submitted.

## Data and integrations

One source notice and retrieval date, personal experience, request revisions, local rehearsal state, and export. Follow the actual notice for real logistics; [DC Council guidance](https://dccouncil.gov/how-to-testify-before-the-council/) is context, not a substitute for the selected notice.

## Edge cases and constraints

Expired or amended notices, unknown deadlines, no request entered, pausing/restarting the timer, overlong testimony, and editing after preview. Do not impersonate government branding or suggest the practice chair is an official participant.

## First gate, output, and cuts

Prove context → experience → practice question → revised ask → statement. A judge plays chair and asks for a specific action. Cut hearing discovery, official submission, automated advocacy, AI official impersonation, and voice until the text workflow is reliable.

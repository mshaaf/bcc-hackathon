# Specification: Casebreaker

**Track:** AI: Ethics and Access. **Status:** finalist; not selected. **User:** an applicant, optionally with a workforce or returning-citizen navigator.

**Promise:** trace a screening-report disagreement to supplied source evidence and prepare a factual correction request.

## Functional requirements

- CB-1: Accept two bounded text-bearing PDFs or manual fields: a report and a source disposition. Preserve original pages.
- CB-2: Propose editable case identifier, court, date, and status fields with source spans.
- CB-3: Compare conservatively using identifiers, court, and dates. A name alone cannot establish a match.
- CB-4: Show matching fields, the exact disagreement, and unresolved relationships. Require applicant review before including a discrepancy.
- CB-5: Export a factual comparison, source-page references, and reviewed draft request for investigation.

## Acceptance criteria

- AC-CB-1: Given a matching case and court with Pending versus an earlier Dismissed disposition, when the user opens the comparison, then both statuses, dates, and original spans are visible.
- AC-CB-2: Given only a shared name and no reliable identifier match, when comparison runs, then it remains unresolved rather than auto-joining.
- AC-CB-3: Given a corrected extracted field, when the user revises it, then dependent matches and packet content update and require fresh review where needed.
- AC-CB-4: Given one reviewed discrepancy and one unresolved item, when the packet is exported, then it distinguishes them and does not present the unresolved item as a confirmed error.
- AC-CB-5: Given unsupported input or parser failure, when extraction fails, then the user gets an error/manual path without invented fields.

## Data and integrations

Two supplied documents, source-linked suggestions, applicant-confirmed fields, conservative relationships, and packet. No court API, screener login, employer access, or identity lookup. Use fictional Training Court / DEMO case records for the demo.

## Edge cases and constraints

Same-name people, missing case/court identifiers, multiple entries, dates after the report, conflicting source pages, unclear statuses, empty PDFs, and invented model quotes. A discrepancy is a factual review request, not a legal verdict or record-clearance determination.

## First gate, output, and cuts

Prove two-document extraction with exact sources and an ambiguous non-match. The judge follows the connection and confirms the disagreement. Cut OCR until digital text works, court lookup, expungement rules, automatic sending, employer integration, and a national legal rules engine.

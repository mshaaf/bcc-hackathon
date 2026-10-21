# Specification: Reclaim

**Track:** Modern Healthcare Outcomes. **Status:** finalist; not selected. **User:** a Black kidney transplant candidate or caregiver organizing historical records.

**Promise:** assemble source-checkable historical evidence and missing-record questions for a transplant-team waiting-time review conversation.

## Functional requirements

- RC-1: Accept bounded text PDFs/manual fields and preserve original page references.
- RC-2: Propose reported date, specimen, units, and paired historical values with their original labels. Require human confirmation.
- RC-3: Limit the first version to dual-reported values from the same report/specimen; do not join unrelated tests or calculate new eGFR values.
- RC-4: Keep missing dates, labels, units, waiting-time/dialysis context, and prior-review status explicit.
- RC-5: Export an original-page index, chronological table, confirmed facts, unresolved evidence, and transplant-team questions.

## Acceptance criteria

- AC-RC-1: Given the fictional same-report 23.3/19.2 example, when a value is selected, then its original label, unit, date, and specimen are inspectable.
- AC-RC-2: Given a missing date, when the record is opened, then it remains unresolved; confirmation from another report cannot transfer to it.
- AC-RC-3: Given unrelated specimens or unclear labels, when evaluation runs, then it does not combine values or infer the missing historical calculation.
- AC-RC-4: Given unconfirmed fields, when the packet is generated, then they remain clearly unresolved rather than confirmed evidence.
- AC-RC-5: Given any record pair, when the result is displayed, then it does not award eligibility, calculate waiting-time credit, or predict a transplant date.

## Data and integrations

Three fictional text-PDF fixtures, manual corrections, source fields, confirmation and missing-state records, export. [HRSA](https://www.hrsa.gov/optn/patients/resources/kidney/understanding-race-egfr) supplies the worked numerical example and policy context. Confirm current policy details before implementing rules. No EHR or official submission connection.

## Edge cases and constraints

Missing dates/formula labels/units, swapped labels, wrong person, duplicates, modern race-free results, unrelated specimens, already-reviewed cases, and incomplete waiting-time context. Missing evidence must not become an eligibility denial. Only the transplant program determines eligibility and submits a request.

## First gate, output, and cuts

Prove the source-linked same-report flow and an incomplete record without false confirmation. The judge demands the original line. Cut new medical calculations, OCR until text works, cloud health-record storage, eligibility badges, time-credit counters, EHR access, and official filing.

# Specification: Block Ops

**Track:** Community Development. **Status:** recommended; not selected. **User:** a neighborhood group preparing a service follow-up conversation.

**Promise:** turn reviewed public service history, attributed observations, and a chosen next step into a usable group brief.

## Functional requirements

- BO-1: Load one bounded, dated DC service-request category/ward snapshot, retaining IDs, source fields, dates, and official statuses. Inspect pagination/truncation.
- BO-2: Suggest transparent candidate groupings; let the group inspect and include/exclude records. No automatic claim of recurrence.
- BO-3: Keep official status separate from a dated resident observation or an explicit unknown.
- BO-4: Let the group choose a concrete request and two role-based tasks.
- BO-5: Generate a readable brief with selected history, observation, request, tasks, source references, and snapshot date.

## Acceptance criteria

- AC-BO-1: Given candidate reports from two sites, when the group excludes the unrelated report, then the history, count, source appendix, and export omit it.
- AC-BO-2: Given closed tickets and no current observation, when the brief is generated, then it states current conditions are unverified rather than resolved or still present.
- AC-BO-3: Given an edited request and two tasks, when the user exports, then the current request and tasks appear in the artifact.
- AC-BO-4: Given an API failure, when a saved snapshot is used, then its snapshot date and cached status remain visible.
- AC-BO-5: Given no selected records, when export is requested, then the interface explains the missing history and does not create an authoritative-looking case conclusion.

## Data and integrations

Read a bounded public query; create a local draft selection, attributed observation, request, tasks, and export. Source: [official DC service-request layer](https://maps2.dcgis.dc.gov/dcgis/rest/services/DCGIS_DATA/ServiceRequests/FeatureServer/21). Existing raw research is ignored under `data/local/`; public demo fixtures remain invented and separate.

## Edge cases and constraints

Duplicate IDs, inconsistent address spelling, nearby different incidents, missing dates/statuses, changing status across snapshots, no observation, no selection, API timeout, or transfer truncation. A shared location or multiple records is insufficient to prove the same incident. Use an explainable rule and human review.

## First gate, output, and cuts

Reproduce the bounded query and one candidate grouping, then complete selection → request → brief. The judge removes an unrelated record and watches the actual output change. Cut automatic dispatch, monitoring, neighborhood scoring, multiplayer, and resolution predictions.

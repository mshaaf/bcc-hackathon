# Public-data evidence and import trail

## DC service-request snapshot

This is evidence of source availability and a historical query, not a neighborhood diagnosis.

- Source: [official DC service layer](https://maps2.dcgis.dc.gov/dcgis/rest/services/DCGIS_DATA/ServiceRequests/FeatureServer/21).
- Query scope recorded in the prior research: `WARD='Ward 8'`, service description containing `Dump`, `ADDDATE` from July 1, 2026 inclusive to October 20, 2026 exclusive, UTC.
- Selected fields: `OBJECTID`, `SERVICEREQUESTID`, `SERVICECODEDESCRIPTION`, `ADDDATE`, `RESOLUTIONDATE`, `SERVICEORDERSTATUS`, `ORGANIZATIONACRONYM`, `WARD`, `STREETADDRESS`.
- Result limit 1,000; ordered by `OBJECTID`; no transfer-limit truncation observed.
- Saved raw result: 475 rows, 475 distinct request IDs, all category Illegal Dumping and Ward 8.
- Whitespace-normalized uppercase address plus category grouping yields 68 candidate groups with more than one record.

The summary is [dc311-summary.json](dc311-summary.json), metadata is [dc311-schema.json](dc311-schema.json), and the raw response is locally available at `data/local/dc311-response-2026-10-20.json`, excluded from Git. Counts were reproduced from the saved response during workspace setup; the source was not queried again for this import.

A candidate group is not proof of the same incident, present conditions, closure failure, or relative neighborhood need. The fiction used in the product preview is separate from this real snapshot.

## Import provenance

[import-manifest.json](import-manifest.json) lists source-relative paths, repository destinations, original and destination SHA-256 hashes, and text transformations. Original files remain in the chat workspace. Most copies are byte-identical. The original full report and decision brief had their local aura-reassessment links normalized; one archived report's old textual path was made repository-relative. Extra blank lines at the end of six imported Markdown files were removed for a clean Git whitespace check. No research claims were changed.

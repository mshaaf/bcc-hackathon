# Specification: The Switch

**Track:** AI: Ethics and Access. **Status:** experimental challenger; not selected. **User:** a workforce facilitator and applicant reviewing an AI intake summary.

**Promise:** keep qualification facts fixed while changing reviewed wording, and make summary claims show their supporting source.

## Functional requirements

- SW-1: Use 12–20 human-reviewed, meaning-matched text pairs with explicit shared facts. Do not treat generated colloquial text as a validated dialect benchmark.
- SW-2: Preserve exact inputs, task, model/configuration, timestamps, and outputs. Rerun identical inputs to distinguish ordinary output variation from a wording effect.
- SW-3: Link each generated claim to exact source text; verify quoted spans actually exist and apply labeled fact checks.
- SW-4: Expose unsupported/contradictory claims and let the applicant confirm or revise supported facts before release.
- SW-5: Export the approved summary and reproducible receipt, including controls, pass/failure results, and test limits.

## Acceptance criteria

- AC-SW-1: Given a reviewed pair, when wording changes, then the locked shared facts stay fixed and the exact selected input is recorded.
- AC-SW-2: Given a claim with a nonexistent quotation, when verification runs, then the quotation is rejected rather than displayed as source evidence.
- AC-SW-3: Given a true passing pair, when results appear, then it remains a pass without an invented failure or fairness certificate.
- AC-SW-4: Given a deliberate checker mutation, when it is shown, then it is labeled as a controlled test and excluded from measured model-failure counts.
- AC-SW-5: Given an unreviewed claim, when the summary is released, then it does not silently enter confirmed facts.
- AC-SW-6: Given the run receipt, when another engineer follows it, then the inputs, configuration, outputs, and controls are inspectable even if a provider later changes.

## Data and integrations

One fixed provider/model initially, structured responses, human annotations, local run records, review decisions, and downloadable receipt. Keep API keys server-side. Retain failures and passing runs; do not select only inflammatory examples.

## Edge cases and constraints

Invalid paired meaning, ordinary nondeterminism, source paraphrases without exact quotes, model refusal, malformed output, timeout, no meaningful issue found, and unsupported inferences. Small experiments cannot establish model-wide fairness or institutional discrimination. Never infer the applicant's race.

## First gate, output, and cuts

Prove a valid, repeatable, worthwhile experiment early on day one. The judge switches wording and asks “Show me where.” Output is a reviewed summary plus test receipt. Cut audio, custom training, multiple providers, arbitrary endpoint onboarding, real hiring decisions, and a public incident feed.

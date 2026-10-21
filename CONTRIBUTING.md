# Working together

The team has two engineers and a three-day build window. Keep one core workflow and a clearly cut scope.

## Before a change

Read `AGENTS.md`, the current decision log, and the relevant specification. Check `git status --short --branch`. A product-selection change should update the specification, implementation plan, architecture, and demo together.

For product work, use a descriptive feature branch and a small reviewable change. One engineer can own input, sources, and validation; the other can own interaction and export. Integrate a working end-to-end slice on day one.

## Evidence and fixtures

Keep synthetic examples explicitly fictional. Preserve real source dates and original statuses. Add the source URL and retrieval date when a new external claim materially affects the design. Keep raw personal uploads and the local public-data snapshot out of Git.

## Verification and review

There is no product test command yet. Do not invent one. Use the checks in `docs/TEST-PLAN.md`, and document real commands once the selected app exists. Verify exported output after changing an input, plus one incomplete or rejected case.

Reviewers should be able to answer: what user problem changed, what source supports the result, how was it checked, and what remains uncertain?

## Commit and pull request

Use a short conventional commit such as `docs: clarify selected demo scope` or `feat: add reviewed brief export`. Include meaningful verification in the pull request. Do not include secrets, personal records, dependency caches, or generated logs.

No external submission or publication is implied by editing a draft. Follow the user's authorization for the current task.

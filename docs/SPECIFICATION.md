# Specification: BCC hackathon project foundation

**Phase:** SPARC specification. **Status:** foundation baseline complete; Block Ops selected by the user October 21, 2026. Its profile is active; the other five remain research alternatives. The Phase 1 plan, Phase 2 data proof, and Phase 3 MVP are complete; Phase 4 reliability work is next.

## Requirements

### Functional

- **FR-1 — Decision context:** preserve the researched two-finalist comparison per track, with promise, user, output, dependency, and cut list, while identifying Block Ops as the sole active project.
- **FR-2 — Evidence context:** preserve the original research, dated sources, query evidence, and contradictions without turning recommendations into facts.
- **FR-3 — Concept comparison:** preserve the six local interactive concepts and their opening/demo/closing storyboards. Label illustrative people, records, and outputs.
- **FR-4 — Selected workflow:** once a project is chosen, implement its input → inspect → revise/confirm → output loop. Use the relevant [conditional specification](specs/README.md).
- **FR-5 — Consequential interaction:** a user or judge decision must change the underlying reviewed data and resulting artifact, not only the screen styling.
- **FR-6 — Source access:** every substantive extracted or generated claim must open an original page, quote, source record, or cited context. Unsupported fields remain unresolved.
- **FR-7 — Human control:** only reviewed information enters a confirmed output. Users can correct a field, remove a candidate, or leave information unknown.
- **FR-8 — Useful finish:** provide a readable print/export or reviewed handoff artifact. No official submission is inferred from preparing it.
- **FR-9 — Recovery:** provide a manual or clearly labeled dated-cache/fixture path when an optional external dependency fails.
- **FR-10 — Project handoff:** keep agent instructions, decision state, plan, source evidence, verification results, and Git remote configuration portable in this repository.

### Non-functional

- **NFR-1 — Feasibility:** one core workflow, two engineers, three days; prefer the team's familiar stack and available dependencies.
- **NFR-2 — Accuracy:** preserve source dates, identifiers, status terms, units, and quotations. Validate model-proposed source spans against the actual source text.
- **NFR-3 — Accessibility:** keyboard-operable native controls, visible focus, clear labels, legible light/dark appearance, and no horizontal clipping at a 320-pixel viewport.
- **NFR-4 — Responsiveness:** local review interactions should update within a 200 ms target on the demo machine. Measure this after implementation; it has not been established for a product.
- **NFR-5 — Dependency handling:** bound external calls with a finite timeout and an actionable error. Select provider-specific limits during the dependency spike; never spin indefinitely.
- **NFR-6 — Privacy:** synthetic demo identities, no real sensitive records in Git, no secrets in the client or committed configuration, minimal data retention.
- **NFR-7 — Reproducibility:** record source/run dates and configuration needed to reproduce important results. Distinguish live, cached, replayed, and synthetic material.

## Foundation acceptance criteria

- **AC-1:** Given the repository, when a new engineer reads the README and decision log, then they can identify Block Ops as the user's chosen project and distinguish the historical alternatives without accessing the original chat.
- **AC-2:** Given the imported research, when a reader follows an internal Markdown link, then it resolves to a repository file rather than an old workstation path.
- **AC-3:** Given the portable preview, when a reader selects each concept and switches Product / Presentation, then the matching interface and three storyboard beats appear without browser errors in the checked environment.
- **AC-4:** Given a selected project's reviewed input, when the user changes a consequential choice, then both the derived state and output reflect the new choice.
- **AC-5:** Given a missing required field or ambiguous relationship, when the workflow evaluates it, then it shows an unresolved state and omits unsupported confirmed claims.
- **AC-6:** Given an unavailable external dependency, when the request fails or times out, then the user receives an actionable error and can use the labeled fallback where provided.
- **AC-7:** Given a public demo fixture, when the final artifact is opened, then its fictional identity and illustrative nature are clear and no institutional action is claimed.
- **AC-8:** Given the local Git checkout, when `git remote get-url origin` is run, then it returns the supplied repository URL. A local configuration check does not imply a remote push.

AC-1/2/3/8 concern this handoff. AC-4/5/6/7 are product requirements to verify during Block Ops implementation; concept behavior alone is not product acceptance.

## Data requirements

Keep source material and extracted suggestions distinct from reviewed facts. The selected model should include a source identifier/reference, source date, exact raw value or span, normalized display value where necessary, review status, and revision provenance. Exact entities depend on the selected profile; do not force all six into one generic application schema.

Create only the minimum draft and export data needed. Do not assume server persistence, accounts, or cloud storage. Keep `data/local/` and personal uploads ignored. The real DC snapshot is local research material, not the fictional Block Ops demo data.

## Constraints

- **Performance:** input limits and network timeouts must be explicit once the parser/API/provider is selected. Avoid unlimited document sizes and unbounded calls.
- **Security:** validate file type/size and structured model output; never execute supplied text; no secrets or sensitive uploads in version control.
- **Compatibility:** target a current desktop Chromium browser for the stage and a usable 320-pixel layout. Broader browser claims require additional checks.
- **Infrastructure:** no privileged API access, hospital/EHR connection, court integration, employer integration, or paid service is assumed.
- **Scope:** no accounts, general-purpose agent system, unrestricted advice chatbot, real-time collaboration, or automated outreach unless a later user instruction materially changes scope.

## Edge cases

- **EC-1 — Invalid input:** unsupported or empty documents show a clear error and manual-entry option where relevant. Do not fabricate extracted fields.
- **EC-2 — Missing/ambiguous information:** preserve unknowns, conflicting values, and uncertain matches. Do not silently merge, infer a date, or manufacture a conclusion.
- **EC-3 — External failure:** show timeout/error, keep current reviewed state, and identify any fallback as cached or synthetic.
- **EC-4 — Multiple tabs or concurrent edits:** the MVP has no collaborative state promise. Keep each local draft isolated; if persistence is added, define conflict handling before claiming shared editing.
- **EC-5 — Changing a reviewed input:** invalidate dependent confirmation and regenerate output from the current reviewed state.
- **EC-6 — No selected evidence:** explain what is missing; do not create an authoritative-looking empty success packet.

## Integration points

- **IP-1:** local Git checkout and the supplied GitHub remote, for versioned project material.
- **IP-2:** the portable concept preview, which is a planning asset rather than the selected app.
- **IP-3:** one selected public API, document parser, or model endpoint after a successful spike. Profiles define the possible dependency.
- **IP-4:** browser print or a simple downloadable artifact; no automatic external submission.

## Phase handoff

The specification baseline is saved in `docs/workflow/`. Block Ops is selected. The technical plan, bounded data proof, and complete product loop are recorded in `docs/PHASE-STATUS.md` and `docs/TEST-PLAN.md`. Ruflo `/sparc advance` is an optional workflow command if its runtime becomes available; it is not a confirmation requirement imposed on the user here.

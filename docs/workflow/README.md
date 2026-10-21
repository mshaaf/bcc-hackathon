# Portable workflow state

The user requested the Ruflo SPARC specification, research-synthesis, and goal-plan skills. Their requirements were applied to the project documents. The corresponding Ruflo MCP memory/task/trajectory/neural tools were not available in the session, so these files are the local tracking fallback.

- `sparc-state.json`: specification phase, artifact paths, and explicit pending product selection.
- `goap-plan.json`: action inventory, costs, dependency states, and computed A* sequence for workspace setup.
- `trajectory.json`: observed setup steps and their verification state.
- `verification.json`: actual workspace check results.
- [Implementation phase ledger](../PHASE-STATUS.md): current numbered delivery phase and batch history for the Luna terminal. Delivery phases are separate from SPARC's internal method numbering.

Canonical human-readable content lives in `docs/SPECIFICATION.md`, `docs/RESEARCH-SYNTHESIS.md`, and `docs/GOAL-PLAN.md`. These files substitute for local continuity; they are not evidence that remote Ruflo memory or tasks were created. Do not duplicate or claim remote records without actually using that service.

If a later session imports this into Ruflo, proposed keys are `sparc-phases/spec-bcc-hackathon-foundation`, `sparc-state/current-phase-bcc-hackathon-foundation`, `research-synthesis/bcc-hackathon-finalists-2026-10-21`, and `goap-plans/bcc-workspace-setup-2026-10-21`. These are intended keys, not existing remote identifiers.

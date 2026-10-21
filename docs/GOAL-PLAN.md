# Goal-oriented plan

**Current continuation:** workspace setup is complete and the baseline app exists. The user now requested a documentation handoff for a proposed map/campaign revision while conserving account usage. Use [HANDOFF.md](HANDOFF.md) and R1–R5 in [PHASE-STATUS.md](PHASE-STATUS.md). The setup action graph and original milestones below remain historical; no revised implementation is complete.

## Goal and success state

**Current objective:** turn the existing hackathon research into a portable, connected project workspace containing the full evidence, honest current decision, product specifications, and execution handoff.

Done means the required files exist, internal links resolve, prior work is preserved, the portable preview works, `origin` names the supplied repository, and the handoff clearly separates completed setup from unbuilt product work.

**Next objective:** implement the user-selected Block Ops workflow and presentation in Luna's requested phase batches. Selection was confirmed October 21, 2026. Winning remains an aspiration, not a controllable acceptance criterion.

## Starting state and gap

The source chat workspace already held full research, track reports, six interactive concepts, and preview QA. The target folder and remote repository were empty. Missing pieces were a portable file layout, synthesis and decision state, acceptance criteria, agent instructions, a practical build/demo plan, and repository connection.

## Action inventory

Relative cost units express effort and dependency risk, not a promised elapsed duration.

| Action | Preconditions | Effects | Cost |
|---|---|---|---|
| Inspect source, target, instructions, and remote | User supplies folder and URL | Starting state and safe import path known | 1 |
| Connect target checkout | Inspection complete; target empty | Local repository with supplied `origin` | 1 |
| Import research and concepts | Source inventory known | Complete portable evidence base and preview | 2 |
| Synthesize current findings | Evidence imported | Evidence grades, contradictions, recommendation, open decisions | 2 |
| Write specification and handoff | Synthesis and constraints known | Agent guidance, conditional specs, plans, demo and checks | 3 |
| Verify workspace | Checkout connected; imported and authored files present | Checked links, source hashes, preview and configuration | 2 |

Total relative cost: **11 units**. The machine-readable action graph and dependency-ordered A* result are stored in `docs/workflow/goap-plan.json`. This is a small deterministic planning model, not a learned estimate or claim of global real-world optimality. Independent inspection/import work can overlap; mutations and dependent checks remain sequential.

## Execution and precondition checks

1. Inspect the folder, ancestor instructions, source outputs, remote metadata, and existing refs. Preserve anything present.
2. Because both target and remote were empty, clone the supplied repository into the target folder. Reuse the remote's `main` default.
3. Copy source artifacts, export the portable concept preview, record source hashes, and normalize internal links. Keep the raw public-data response local and ignored.
4. Grade claims, resolve the recommendation change, and record unresolved schedule and demand questions. Do not fabricate memory-tool results.
5. Write shared requirements and six conditional profiles, agent instructions, delivery responsibilities, source discipline, demo, verification and submission guidance.
6. Verify effects, save local workflow/trajectory records, and report exactly what is local versus remote.

The current task does not require a remote publication. Configuring and checking `origin` is sufficient to connect the supplied workspace; a push is a separate action whose status must be stated accurately.

## Product plan — Block Ops selected

The milestones below are a summary. Numbered delivery boundaries are defined by the [Luna phase plan](superpowers/plans/2026-10-21-luna-phase-execution.md), with completion recorded in [the phase ledger](PHASE-STATUS.md).

1. **Dependency spike:** precondition = chosen idea; effect = demonstrated core data/experiment/parser or a scoped fallback; cost = up to the first few focused hours of day one.
2. **Complete the loop:** precondition = viable core; effect = input → review → changed export; cost = remaining day one.
3. **Reliability and evidence:** precondition = complete loop; effect = source inspection, corrections, missing-state handling, repeatable fixtures; cost = day two.
4. **Demo and submit:** precondition = frozen reliable core; effect = rehearsed interaction, backup, working submission materials; cost = day three.

Only the selected profile becomes active. The others remain alternatives.

## Replanning triggers and fallback

- Existing target files or remote commits appear: inspect and integrate instead of overwriting or force-pushing.
- A core source or provider is unavailable: use a correctly labeled dated cache/manual path, or switch finalists early if the core promise no longer works.
- The Switch lacks valid reviewed pairs or a worthwhile reproducible experiment: choose a more reliable finalist before spending the remaining window on presentation.
- The scope cannot complete its output loop on day one: remove optional inputs/integrations before adding more infrastructure.
- Event rules or timing differ from the research: follow the current official rules and revise the plan.
- New evidence changes product usefulness or community fit: update synthesis and decision state, then the active specification.

## Tracking

Ruflo MCP memory, trajectory, neural, and task tools were not exposed in this session. Tracking therefore lives in versioned files under `docs/workflow/`; no remote tasks or memories are claimed. These records preserve the goal, completed setup steps, and remaining selection/build work for a later session.

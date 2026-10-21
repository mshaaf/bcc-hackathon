# Block Ops worktable design

**Confirmed form factor:** treat Block Ops as one application. Use a persistent navigation shell, focused community/feed and mission/task screens, clear primary actions, back navigation and layouts suited to phone and desktop use. Preserve the existing identity and stack; refine current components and interactions in place. This direction does not call for a framework rewrite or broad code refactor.

**Community-first revision:** the proposed landing surface is the group's feed and active missions; the mission page combines people, discussion, schedule, available jobs and updates. The existing map remains a discovery/evidence view. Show participants' actual commitments and distinguish plans, reported progress and checked conditions. See [the scope](docs/specs/community-missions.md); this is design direction, not implemented UI or approval of a new color system.

**Baseline reference, not the final approved design.** The user questioned the product experience after the UI repair. Continue with [the handoff](docs/HANDOFF.md) and revision R1. Keep source fidelity and accessibility; the three-step layout below may change for map/campaign work. A new styling pass alone does not satisfy the scope concern.

## Direction

An operating worktable for a group preparing its next move. Preserve the established plum/sunflower identity. Replace the long simultaneous form with a deliberate three-step task: review history, plan the next move, open the brief. This is an application surface, not a marketing landing page.

## Visual system

- Ground `#f4f1f7`; paper `#fffefd`; ink `#302338`; secondary text `#6b6073`.
- Plum `#5b316b` carries the identity, selected states, primary actions, and the desktop brief companion.
- Sunflower `#f5cd55` emphasizes the selected evidence count and the draft-brief action. It never implies a successful city outcome.
- Pale plum `#ebe3f0` marks secondary selection; green `#e0ece3` / `#365c41` denotes a source's closed status, not verified cleanup.
- Typography uses the installed Avenir Next UI stack with Segoe UI and system fallbacks. No external font request or CSP change is required.
- Use a clear hierarchy, generous separation between tasks, and compact spacing within source records. Avoid wrapping every field in a new card.

## Layout and interaction

The first desktop viewport prioritizes a readable history, full original addresses, inclusion checkboxes, and the confirmation action. A plum companion summarizes the actual selected evidence and separates official status from current site conditions. The observation and tasks appear in their own step. The final brief has a dedicated paper layout and export toolbar.

Source detail disclosures retain raw original fields. The full address is visible before expansion; removing street numbers would hide the evidence needed to reject a candidate. Confirmation advances to the plan. Step controls support pointer, keyboard, and arrow-key navigation. Changing evidence clears source confirmation.

At narrow widths, the companion yields to the main task, records reflow, and the final paper stays readable. Print emits the brief alone, without navigation or editor controls. Motion is limited to control feedback and respects reduced-motion preferences.

## Truth and states

Practice fixtures are explicitly fictional. Live results show the retrieval date and query window. Failed refresh preserves the current draft; switching source/group clears the previous context's observation. Loading locks editing so an in-flight request cannot overwrite a new edit. Exports stay disabled until the current evidence and required plan fields are ready.

# Product

**Confirmed application form factor:** Block Ops is a browser-based application using its current stack. Community discussion, missions, map discovery and task details belong to one connected experience with consistent navigation and responsive phone/desktop layouts. Improve the existing implementation in place; no framework rewrite or broad refactor is required by this direction.

**Current target:** a community-first product where neighbors join, discuss, organize missions, claim jobs and post progress. The map and source brief support the group. See [community scope](docs/specs/community-missions.md). R1–R4 and local B1 community discussion are implemented; shared missions/task commitments are not built and B1 review repairs remain open. Earlier baseline notes below describe history.

**Continuation status:** this document describes the built baseline. The user rejected its form/brief-centered experience as the final hackathon product. The proposed next direction is a map-centered, resident-led improvement campaign; see [the handoff](docs/HANDOFF.md). Maps, crime context, saved campaigns, photo handling, and AI remain unbuilt. R1 settles the first scenario and revised contract.

<!-- impeccable:product-schema 1 -->

## Platform

web

## Users

A neighborhood group preparing a conversation about public service history. At the hackathon, a judge participates as a records keeper and makes a decision that changes the output.

## Product Purpose

Block Ops turns source-linked service requests, reviewed by the group, into a brief containing its observation, request, and two role-based tasks. The user selected Block Ops for Track 3 — Community Development.

## Operating Context

Ward 8 / Illegal Dumping is the initial bounded DC public-data scope. A separately labeled fictional practice case supports rehearsal. The current app runs locally with Node built-ins and native browser modules, a Leaflet map workspace over live DC 311 records, campaigns saved in browser localStorage (one operator, no sync), Markdown download, and browser print.

## Capabilities and Constraints

Candidate relationships use normalized street/category and require human review. Official ticket status and resident observations are distinct. Missing fields remain unknown. No city submission, automatic complaints, cleanup verification, accounts, or multiplayer is implemented.

## Brand Commitments

The user requested memorable identity and meaningful audience agency, then rejected the initial functional UI as inadequate for presenting. Preserve the Block Ops name and the established plum/sunflower identity; make the judge's choice and resulting brief visible and understandable.

## Evidence on Hand

The source research and dated query evidence are in `research/`. The fictional fixture is `data/demo.json`. Phase checks and current results are in `docs/TEST-PLAN.md`. No community outcomes, customer testimonials, or institutional responses have been measured.

## Product Principles

- The group decides what belongs in its history.
- Original records remain inspectable.
- Changing the evidence changes the output.
- A usable brief completes the workflow.

## Accessibility & Inclusion

Use keyboard-operable controls, explicit labels, readable contrast, a usable narrow-screen layout, and reduced-motion support. Do not equate reporting volume with neighborhood need.

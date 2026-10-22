# Repository setup

The local folder is a Git checkout of [mshaaf/bcc-hackathon](https://github.com/mshaaf/bcc-hackathon).

- Remote name: `origin`.
- Fetch and push URL: `https://github.com/mshaaf/bcc-hackathon.git`.
- Default local branch: `main`, matching the supplied remote's metadata.
- The GitHub repository was empty and public when checked October 21, 2026.
- The checkout contains R1–R4 map/local campaigns, B1 community discussion, B2 shared missions and B3 repairs/mobile/hosting preparation, plus their specifications, handoffs, review records and verification evidence. `git log` is authoritative for the commit history.

## October 21 — authorized publication

The user explicitly requested review, detailed documentation, commit and push of the current work. Before that documentation commit, `git fetch origin` and `git rev-list --left-right --count origin/main...HEAD` showed **0 remote-only commits and 16 outgoing local commits**. The publication includes those existing R4-through-B3 commits plus the independent review/documentation/evidence update. Preserve their history; no force-push, permission change, project creation or deployment is needed.

[Independent B3 follow-up review](B3-FOLLOWUP-REVIEW.md) records what was checked. The README, architecture, current specifications, plan status, phase/test ledgers and assistant handoffs have been reconciled. Historical evidence and obsolete contracts remain clearly labeled history. Source publication is separate from hosting: no hosted project, public application URL or real-phone proof has been established.

Check the state from this folder:

```sh
git status --short --branch
git remote -v
git log -1 --oneline
```

For this authorized publication, the normal push command is:

```sh
git push origin main
```

Verify the actual result after pushing:

```sh
git status --short --branch
git rev-parse HEAD
git ls-remote origin refs/heads/main
```

The local HEAD and remote `refs/heads/main` must match. The working tree should be clean with no ahead/behind count. A planned push or a local commit alone is not proof of synchronization.

`data/local/`, personal uploads, environment files, caches, and runtime output are ignored. The shared evidence contains aggregate public-data results and schema; the full raw snapshot remains available locally. No global Git identity or configuration was changed.

The GitHub pull request template is in `.github/PULL_REQUEST_TEMPLATE.md`. CI, branch protections, repository secrets, and a license were not configured in this work. The stack is Node.js/native browser modules, vendored Leaflet, browser-local campaigns and local Supabase Auth/Postgres/Realtime. Deployment instructions are in [DEPLOYMENT](DEPLOYMENT.md); they remain preparation, not proof of a hosted app. No Docker/containers were started for the latest independent review.

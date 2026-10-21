# Repository setup

The local folder is a Git checkout of [mshaaf/bcc-hackathon](https://github.com/mshaaf/bcc-hackathon).

- Remote name: `origin`.
- Fetch and push URL: `https://github.com/mshaaf/bcc-hackathon.git`.
- Default local branch: `main`, matching the supplied remote's metadata.
- The GitHub repository was empty and public when checked October 21, 2026.
- This task configures the checkout and prepares a local initial documentation commit. It does not push files, change repository visibility/permissions, create a deployment, or submit the entry.

Check the state from this folder:

```sh
git status --short --branch
git remote -v
git log -1 --oneline
```

When the user chooses to publish the local commit to the supplied repository, the ordinary first-push command is:

```sh
git push -u origin main
```

`data/local/`, personal uploads, environment files, caches, and runtime output are ignored. The shared evidence contains aggregate public-data results and schema; the full raw snapshot remains available locally. No global Git identity or configuration was changed.

The GitHub pull request template is in `.github/PULL_REQUEST_TEMPLATE.md`. CI, branch protections, repository secrets, and a license are not configured because the product stack and publishing workflow have not been selected.

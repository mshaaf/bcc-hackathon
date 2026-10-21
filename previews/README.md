# Product and presentation concepts

Open [finalists.html](finalists.html) directly in a current desktop browser, or serve the repository with `python3 -m http.server 8000 --bind 127.0.0.1` and visit `/previews/finalists.html`.

Use the bottom picker to select one of six projects. Product shows a local interaction; Presentation shows three story beats with presenter notes. The preview is a comparison tool, not the selected application. No API key, backend, real model run, or official submission is involved. Web fonts may load from Google's font service; fallback fonts are supplied.

## Editable source

- [Combined fragment](source/finalists.fragment.html): canonical imported interactive source.
- [Shell](source/finalists-shell.html): review controls and pitch storyboards with concept placeholders.
- Individual concept fragments live in `source/concepts/`.
- [Prior QA results](qa/results.json) record measured layout bounds and observed errors for the original combined preview. The current workspace check is recorded separately in `docs/workflow/verification.json`.

The standalone HTML includes a sandboxed preview wrapper. Keep edits to its source and regenerate the export rather than maintaining two divergent copies. The original export used the installed Codex visualization renderer; the exported page itself does not require that installation to open.

All names and case/lab/service fixtures are fictional. The Switch's reversed availability example is a deliberate checker mutation, not a measured model failure. Real source evidence and the local raw DC snapshot are kept separately from these demo fixtures.

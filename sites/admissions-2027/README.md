# 2027 University Admissions Explorer

Standalone source of the existing ChatGPT Site, imported on 1 November 2026 from Site source commit `198aafe3a7f1a53e0dcd48170c8a9605badd4ab9`.

## Current behaviour

- Filters a researched snapshot of 47 programme routes in Canada, the United Kingdom, Singapore, Australia, the Netherlands and Germany.
- Supports multiple countries and subjects, per-subject Major / Minor / Either roles, joint degrees, multiple majors and multiple minors.
- Applies changed selections only when **Search listed programmes** is clicked.
- Displays application steps, dates, source links, delivery location and awarding institution. Some entries and combinations remain conditional or need verification; the dataset is not comprehensive.
- Keeps a shortlist in browser storage and exports the applied results as CSV.
- Can prepare a research request to paste into ChatGPT. That button does not run research.

**This Site has no crawler, live web search, background refresh, or directory-based discovery backend.** New choices filter the saved snapshot; they do not discover new programmes.

The repository's root tracker is a separate application, with its own local discovery and deadline scripts. This import does not connect those scripts to the Site.

## Run locally

From this folder, serve the static assets over HTTP:

```sh
python3 -m http.server 4174 --bind 127.0.0.1 --directory dist
```

Open http://127.0.0.1:4174. Opening `index.html` directly through `file://` will not reliably load the JSON files.

Run the matching checks with Node.js 18 or later:

```sh
node verify.cjs
node --check dist/app.js
node --check dist/match.js
```

No package installation or search API key is required for the current static explorer.

## Files

| File | Purpose |
| --- | --- |
| `dist/index.html` | Page and search controls |
| `dist/app.js` | UI, staged selections, shortlist and export |
| `dist/match.js` | Subject-role and study-plan matching |
| `dist/data.json` | 47 saved programme routes and evidence links |
| `dist/coverage.json` | Country coverage notes |
| `dist/style.css` | Responsive styling |
| `verify.cjs` | Dataset and matching checks |
| `CRAWLER-PLAN.md` | Proposed crawler requirements; not implemented |

The deployment-specific `.openai` directory and Git credentials are excluded from this import. GitHub changes do not automatically update the ChatGPT Site. Publishing remains a separate Sites workflow.

## Manual review

1. Confirm the initial table contains 47 routes and six countries are available.
2. Select Singapore and Australia; confirm the table stays unchanged until Search is clicked.
3. Select Economics as Major and Criminology as Minor, then Search; confirm the matching Sydney route appears and unrelated combinations do not.
4. Add a country absent from the snapshot, such as Ireland; search it and confirm the empty state does not claim that no universities exist there.
5. Shortlist a route, reload, and confirm it persists in the same browser. Export results and check the CSV.
6. Prepare a fresh research request and confirm the page explicitly says that no web search has run.

No new manual browser session was run for the GitHub import. The imported files are unchanged from the existing Site source; the Node checks passed before upload.

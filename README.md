# Admissions Atlas — static admissions dashboard

A new static admissions dashboard built from manually authored YAML and generated JSON. Singapore records contain manually researched official-source data. Other destinations retain labelled fictional examples. No background collection, accounts or external service APIs are used by the dashboard.

## Run the preview

Requires Node.js 22 and npm.

```sh
npm ci
npm run dev
```

Open http://127.0.0.1:4173/. If another preview already uses that port, set ADMISSIONS_PORT=4180 before starting. The current review preview is at http://127.0.0.1:4180/.

```sh
npm run build:data   # YAML → validated, tracked JSON
npm run check:data   # fail if tracked JSON differs from YAML
npm test            # catalogue rules plus retained regression tests
npm run build       # generate data and a self-contained dist/ directory
```

The browser loads only dist/ HTML, CSS, JavaScript and generated JSON. dist/ can be served by any static web server. Source YAML, local research history and previous collection endpoints are not served.

## Maintain the data

- data/universities/*.yaml: university details and programs.
- data/admissions/<university>/<program>/<cycle>.yaml: annual intake, applicant routes, eight stages and evidence.
- data/generated/catalogue.json: generated output; regenerate rather than editing it.

The sample set contains six fictional universities, eight programs and eight admission cycles. The default Singapore/Economics/Bachelor’s view shows 34 real programme/intake options. One Singapore program includes two explicit dummy applicant routes with different application windows.

Countries and subjects can be added as session filters. Adding an option does not create a university, program or deadline: add the matching YAML records and rebuild. No destinations selected means all destinations; no subjects selected means all subjects. Holland is treated as Netherlands.

Read [the data authoring guide](docs/YAML-DATA.md), [manual review checks](docs/YAML-STATIC-MANUAL-TESTS.md) and [running feature record](docs/FEATURES.md).

## Scope of this rebuild

This branch starts from dev and replaces the active dashboard and preview workflow from scratch. Earlier discovery scripts and their tests remain as historical source but are not exposed by this app or its npm commands. The browser-automation dependency has been removed. Pending PRs #15 and #17 are independent and have not been merged into this rebuild.

The compiler accepts separately validated real and dummy records. Real verified deadlines require checked official institution sources. This version includes no scholarships, accommodation, financial-aid deadlines, budgeting, grade/test-score filters or shortlist comparison.

## Singapore real-data preview

The catalogue now includes curated Singapore undergraduate offerings and 2027 admission dates alongside labelled fictional examples. The initial view selects Singapore/Economics. This is manually checked data, not a live university search. Unverified stages remain visible without guessed dates. Coverage, source limitations and manual acceptance tests: [Singapore 2027 data](docs/SINGAPORE-2027-DATA.md).

Indian Class XII applicant matching uses explicit school-board, citizenship, Singapore PR and results-status inputs. No route is selected without one verified match. Coverage and the new review preview on port 4181: [Indian applicant routes](docs/INDIAN-APPLICANT-ROUTES.md). Profile details are not persisted or sent to a server.

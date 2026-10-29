# Browser-based discovery

## Run locally

Requires Node.js 18+ and Microsoft Edge installed locally. Run `npm install` once. Playwright controls Edge; no external search, scraping or AI API is called by the collector.

1. Start the dashboard with `npm run dev`.
2. Select countries, subjects, degree and intake.
3. Choose **Download discovery request**. This exports those preferences as a local JSON file.
4. Run `npm run discover -- "C:/path/to/discovery-request.json"` in this project folder. For the initial six-country Computer Science master's search, use `npm run discover -- discovery-example.json`.
5. Reload the dashboard. **Show discovered programs** switches between the collected catalogue and fictional samples.

Collection is launched through the command line in this step. The dashboard reads its output as a static local file; there is no HTTP API for starting collection. There is no hosted service or account setup.

## Current coverage

| Country | Institution source | Initial program catalogue |
| --- | --- | --- |
| Canada | Universities Canada member directory | UBC Vancouver graduate degree catalogue |
| United Kingdom | Universities UK member directory | None yet; directory access may be blocked |
| Singapore | Ministry of Education autonomous university profiles | NUS Computing graduate programmes |
| Australia | Government Study Australia university list | Australian National University catalogue browser search |
| Netherlands (also accepts Holland) | Nuffic Study in NL research university list | University of Twente master's programmes |
| Germany | German Rectors' Conference university member list | Technical University of Munich degree programmes |

This is partial discovery, not a complete list of every institution or program in these countries. Singapore covers autonomous universities, the Netherlands covers research universities, and Germany covers HRK university members. Colleges, private providers, applied science institutions and other institution types may be missing. Directory membership is not presented as independent accreditation verification.

Other country names can still be added. Their collection status is **Source setup needed** until a directory adapter is configured. The country of study never determines the user's citizenship, residence or applicant category.

## How records are established

- Read configured public HTML directory pages, then follow the MOE institution profiles where needed.
- Keep named institutional links; normalize URLs and remove exact duplicates. Official directory names and campus paths are retained.
- Only search configured institution catalogues after their domain is found in the country's directory.
- Match subject names or configured synonyms against catalogue titles. Custom subjects use literal word matching. These are keyword matches, not a semantic fit guarantee.
- Visit matching program detail pages and confirm a subject heading and degree evidence. Retain directory, catalogue and program links, source passages and collection time.
- Campus is explicitly unknown unless the adapter is for a confirmed campus.
- Requested intake is retained as context. It is **not** inferred from a program existing. No deadlines are collected in step 2.

Each catalogue run is bounded to five listing pages and 25 matching detail visits. ANU currently searches the first selected subject only and reads the first rendered result set. These limits are displayed in coverage notes. A zero result does not establish that no suitable program exists.

## Storage and failures

The latest catalogue is written to `data/latest.json`; timestamped catalogue reports are retained in `data/runs/`. These outputs are local and ignored by Git. For the same subjects and degree, rerunning selected countries replaces their records and retains other countries with their original evidence times. A different subjects/degree query starts a fresh catalogue. A crash before the final atomic replacement leaves the previous report intact.

Per-source failures, blocked access, missing institution domains, unconfirmed headings and unsupported countries remain explicit in the report. The collector does not solve access checks or bypass blocked pages. Runs pause between page navigations. There is no scheduled refreshing yet.

## Extend sources

Country directory configuration lives in `src/discovery.js`. Catalogue adapters live in `scripts/discover.mjs`. Check each source's actual HTML and permitted access before adding its selector, host, catalogue path and relevant scope. Adding a label in the dashboard alone does not establish a source adapter.

Skill assessment: the discovery workflow is a candidate for a reusable skill, but its source adapters are still being validated. Recommend keeping the workflow and limitations in project documentation for now, pending user confirmation.

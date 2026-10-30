# Browser-based discovery

## Run locally

Requires Node.js 18+ and Microsoft Edge installed locally. Run `npm install` once. Playwright controls Edge; no external search, scraping or AI API is called by the collector.

1. Start the dashboard with `npm run dev`.
2. Select countries, subjects, degree and intake.
3. Choose **Find programs** with Show discovered programs selected. The local controller runs discovery, stage collection and source verification in sequence. The page shows progress and refreshes when the run ends. A run may take several minutes.
4. To search another month, use Search a different intake month. A requested month is not evidence that a program offers it.
5. Download discovery request and the CLI commands remain available for manual collection. Show discovered programs switches between real collected records and fictional samples.

The loopback server has a same-origin local job-control route; it invokes fixed local scripts without a shell. No external service APIs, hosted service or account setup are used. Only public destination/subject/degree/intake fields enter the job file. Applicant context stays in the browser. The controller permits one run at a time and stops a phase after twelve minutes; there is no automatic retry of blocked sites.

Undergraduate catalogue entry points now include NUS Computing, NTU Computing, SMU Computing, Twente, UCL, Saarland, Waterloo and Monash. These are source configurations, not preloaded program results: each match requires a fresh page heading and degree passage. Catalogue availability and layouts can prevent matches. Institution records identify whether directory corroboration was captured; configured official catalogues can still be checked when a directory is blocked.

New subject names are matched against the configured catalogues. Newly added countries without trusted source configuration are explicitly marked Source setup needed. This remains bounded discovery, not an exhaustive worldwide search. Program intake evidence, unconfirmed intakes and alternatives appear separately. Only explicit start-month/year statements on the program page count as intake evidence; generic calendars and application dates do not establish a program intake.

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

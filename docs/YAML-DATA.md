# Editing the admissions catalogue

YAML files are the source of truth. JSON is a generated copy for the browser. Keep university/program details separate from annual dates so the same university does not have to be copied into every cycle.

## University and program details

The ranking-only snapshot in `data/rankings/qs-world-2027.yaml` is separate from the admissions university list. It records the official QS global ranks 1–100, including all cutoff ties, source and check date. It adds no programme or deadline claims. Build validation checks its scope, order and 102 entries. Rank ceilings use verified overall ranks; a band qualifies only when its upper boundary is within the ceiling. Unknown ranks are excluded only when a ceiling is active.

Each ranking entry also records its country/territory. Country metadata follows the named university's campus location; institution identity disambiguates Cambridge (US/UK) and Durham (Duke in the US versus Durham University in the UK). Country-data actions combine ranking-only entries with existing admissions institutions and explain their coverage; they do not create admission YAML or imply a fresh collection.

Optional `teachingLanguages` records explicitly verified teaching languages, for example `[Dutch]`. Non-English-only programmes receive an amber card and a written language label. Missing metadata does not establish English teaching. Programmes listing English among their teaching languages are not marked as non-English-only. Keep the official programme link and supporting language notes.

Start with data/universities/nl-uva.yaml. Each university has a unique lowercase ID, name, country and city. Its programs have their own globally unique IDs, names, degree levels and one or more subjects. Use Bachelor’s, Master’s or PhD for degree. The country Holland is normalized to Netherlands.

## Annual admissions

Start with data/admissions/nl-uva/nl-uva-economics/2027.yaml. programId must match an existing program. cycle is the admissions cycle, while intake records the actual start month and year; for example, a 2027 application cycle can lead to a February 2028 intake. Each program/cycle/intake combination must be unique. Every program needs at least one cycle.

Each annual file contains explicitly named applicant routes. The user selects a route; the app does not infer one from citizenship or residence. Routes contain all eight stages: opening, application, documents, tests, interview, acceptance, deposit and enrolment. Keep unavailable stages present so their absence is explained.

## Deadlines and missing dates

The annual intake filter can project an unpublished future year's schedule from the latest earlier real intake for the same programme. These are temporary display objects with Tentative labels, not new verified YAML records. Original dates and source evidence remain accessible. Never replace source dates or review timestamps with projected values. A calendar projection is distinct from a research-based estimate using several historical years.

| Kind | YAML fields | Meaning |
| --- | --- | --- |
| date | kind: date, date: '2027-01-15' | One calendar date |
| window | kind: window, start: '2026-12-01', end: '2027-01-15' | Opening and closing dates |
| relative | kind: relative, rule: Within 14 days of receiving an offer | A condition, not an invented calendar date |
| unavailable | deadline: null | Explain why using status and wording |

Use ISO YYYY-MM-DD dates. Invalid calendar dates and reversed windows fail validation. Calendar dates display in UTC without shifting to the viewer's timezone. This version does not represent timed cutoffs or convert them.

| Status | Current behavior |
| --- | --- |
| dummy | Requires a date/rule and at least one dummy source reference; displays Illustrative date |
| not-verified | Must have no deadline; the date has not been established |
| not-researched | Must have no deadline; nothing has been researched |
| not-yet-published | Must have no deadline; a source establishes an unpublished date |
| source-unavailable | Must have no deadline; the source is unavailable |
| needs-review | An unresolved statement; a deadline may remain null |
| verified | Requires a real-data file, a deadline/rule and checked official evidence |

Every stage has wording that preserves conditions or explains a missing date. sourceIds refer to sources in the same annual file. Real sources contain an ID, approved official HTTPS URL, a paraphrased evidence passage and an ISO checkedAt date. The active YAML catalogue contains real records only. Reserved example-domain fixtures remain in automated tests to validate rejection rules. A recurring annual deadline is not confirmation of its 2027 applicability.

## Publish a data change locally

1. Edit or add the university YAML and annual admissions YAML. Adding a browser filter alone supplies no new data.
2. Run npm run build:data. A validation error names the offending file or record. Invalid input does not replace the previous generated JSON.
3. Run npm run check:data and npm test. Review the generated data/generated/catalogue.json diff alongside the YAML diff.
4. Run npm run build. Restart the static preview if necessary and reload it. Editing YAML does not update an already built dist/ automatically.
5. Commit YAML and generated JSON together. Request preview/manual-test approval before merging, following AGENTS.md.

The parser rejects duplicate YAML keys, aliases and files over 200 KB. The validator checks IDs, references, unsupported fields, stage completeness, status/date consistency and date validity. It checks structure; it does not establish the truth of admissions information.

The GitHub workflow checks that generated JSON matches YAML before rebuilding. npm run build produces only the assets needed by the static dashboard. No source YAML or old live-collection reports are required to view it.

## Real Singapore records

See SINGAPORE-2027-DATA.md for coverage, source limitations and manual checks. Real annual files declare `dataType: real`. Omitted dataType retains the existing dummy-only validation rules. The generated catalogue mode is real, dummy or mixed. Real records cannot contain illustrative stages; dummy records cannot claim verified dates.

Real source URLs must be HTTPS on an approved institution domain (NUS, NTU, SMU, SUSS, SIM, Kaplan or Buffalo), with a valid checkedAt date and a paraphrased evidence summary. The validator enforces structure and evidence presence, not the truth of a claim. Add new official hosts only after source review. Programme records can include an official url and plain-language notes explaining degree structure and optional subjects.

University records can contain qsRanking with edition, rank (a string preserving ties or bands), status (verified or not-verified), institution, url, checkedAt and notes. Use the official www.topuniversities.com HTTPS source. Unverified ranks must be null. State the awarding university for overseas awards delivered through SIM or Kaplan. Do not copy a regional, subject, member-institution or teaching provider ranking into an overall world rank.

## Indian applicant matching rules

data/applicant-rules/*.yaml holds shared institution/year policies with named programme and route references, explicit board/citizenship/PR/results conditions, checked official evidence and verification status. Only one verified matching rule can select a personalised timeline; the app never falls back to the first route. Named state boards need exact state:board-name keys and independent source review. See INDIAN-APPLICANT-ROUTES.md for the schema explanation, supported scope and manual tests. Applicant details are transient browser memory; YAML contains rules, not users' personal data.

## Requirements extraction and public calendars

data/admission-details/*.yaml records partial coverage, requirement entries and evidence separately from dated stages. Each real programme must have one explicit details record. Entries are extracted, needs-review or not-extracted. Sources retain checkedAt, optional updatedAt, applicability, a concise paraphrase and optional linkedFrom provenance. A document update year is not automatically an expiry or intake restriction. Current known dates remain visible even when applicant-specific matching is incomplete.

SIM-linked PDF sources may use only the exact SIM production S3 host, a /onesim/media/ PDF path and an official SIM parent programme in the record's scope. This is not general permission to use cloud-hosted documents as official sources. View table layouts before promoting extracted row/column facts. An inaccessible or unverified table remains in review.

Applicant board rules can name cbse, isc, ib, a-level, explicit state:board-name keys, or indian-state-boards where an official source explicitly covers the group. The group must not be inferred from one state's rules. ICSE/IGCSE selections require a subsequent final qualification. ADMISSION-EXTRACTION-REVIEW.md supersedes earlier manual expectations that unpublished personal matching would hide all institutional calendars.

For unverified intake months, use month: null, not an invented August date. The page labels this explicitly; exact-month filters exclude unknown months. Different confirmed intakes in one year require separate files, such as 2027-08.yaml and 2027-09.yaml. The original eight stages are required; decision and appeal are optional additional stages. Dates with conditional wording should be read with that wording, which is displayed alongside real stages. Timed cutoffs remain in wording and are not timezone-converted.

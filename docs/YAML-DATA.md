# Editing the admissions catalogue

YAML files are the source of truth. JSON is a generated copy for the browser. Keep university/program details separate from annual dates so the same university does not have to be copied into every cycle.

## University and program details

Start with data/universities/harbour.yaml. Each university has a unique lowercase ID, name, country and city. Its programs have their own globally unique IDs, names, degree levels and one or more subjects. Use Bachelor’s, Master’s or PhD for degree. The country Holland is normalized to Netherlands.

## Annual admissions

Start with data/admissions/harbour/harbour-cs/2027.yaml. programId must match an existing program. cycle is the admissions cycle, while intake records the actual start month and year; for example, a 2027 application cycle can lead to a February 2028 intake. Each program/cycle/intake combination must be unique. Every program needs at least one cycle.

Each annual file contains explicitly named applicant routes. The user selects a route; the app does not infer one from citizenship or residence. Routes contain all eight stages: opening, application, documents, tests, interview, acceptance, deposit and enrolment. Keep unavailable stages present so their absence is explained.

## Deadlines and missing dates

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
| source-unavailable | Must have no deadline; the fictional source is unavailable |
| needs-review | An unresolved statement; a deadline may remain null |
| verified | Requires a real-data file, a deadline/rule and checked official evidence |

Every stage has wording that preserves conditions or explains a missing date. sourceIds refer to sources in the same annual file. Sources contain an ID, reserved example-domain HTTPS URL, an illustrative passage and checkedAt: null. These URLs are displayed as text, not presented as real official evidence. No dummy record may claim a real check date or verified status.

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

For unverified intake months, use month: null, not an invented August date. The page labels this explicitly; exact-month filters exclude unknown months. Different confirmed intakes in one year require separate files, such as 2027-08.yaml and 2027-09.yaml. The original eight stages are required; decision and appeal are optional additional stages. Dates with conditional wording should be read with that wording, which is displayed alongside real stages. Timed cutoffs remain in wording and are not timezone-converted.

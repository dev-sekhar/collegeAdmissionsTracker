# Editing the admissions catalogue

YAML files are the source of truth. JSON is a generated copy for the browser. Keep university/program details separate from annual dates so the same university does not have to be copied into every cycle.

## University and program details

Start with data/universities/harbour.yaml. Each university has a unique lowercase ID, name, country and city. Its programs have their own globally unique IDs, names, degree levels and one or more subjects. Use Bachelor’s, Master’s or PhD for degree. The country Holland is normalized to Netherlands.

## Annual admissions

Start with data/admissions/harbour/harbour-cs/2027.yaml. programId must match an existing program. cycle is the admissions cycle, while intake records the actual start month and year; for example, a 2027 application cycle can lead to a February 2028 intake. Each program/cycle combination must be unique. Every program needs at least one cycle.

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
| not-researched | Must have no deadline; nothing has been researched |
| not-yet-published | Must have no deadline; the dummy notice describes an unpublished date |
| source-unavailable | Must have no deadline; the fictional source is unavailable |
| needs-review | An unresolved statement; a deadline may remain null |
| verified | Recognized as a status name, but rejected in this dummy-only catalogue |

Every stage has wording that preserves conditions or explains a missing date. sourceIds refer to sources in the same annual file. Sources contain an ID, reserved example-domain HTTPS URL, an illustrative passage and checkedAt: null. These URLs are displayed as text, not presented as real official evidence. No dummy record may claim a real check date or verified status.

## Publish a data change locally

1. Edit or add the university YAML and annual admissions YAML. Adding a browser filter alone supplies no new data.
2. Run npm run build:data. A validation error names the offending file or record. Invalid input does not replace the previous generated JSON.
3. Run npm run check:data and npm test. Review the generated data/generated/catalogue.json diff alongside the YAML diff.
4. Run npm run build. Restart the static preview if necessary and reload it. Editing YAML does not update an already built dist/ automatically.
5. Commit YAML and generated JSON together. Request preview/manual-test approval before merging, following AGENTS.md.

The parser rejects duplicate YAML keys, aliases and files over 200 KB. The validator checks IDs, references, unsupported fields, stage completeness, status/date consistency and date validity. It checks structure; it does not establish the truth of admissions information.

The GitHub workflow checks that generated JSON matches YAML before rebuilding. npm run build produces only the assets needed by the static dashboard. No source YAML or old live-collection reports are required to view it.

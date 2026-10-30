# Running feature record

## Step 1 — Admissions dashboard shell

Status: reviewed by the user and merged into dev.

- Choose multiple study destinations and subjects, plus a degree level and target intake.
- View matching fictional programs and select one to see its admission stages.
- See examples of fixed dates, unpublished dates and deadlines relative to an offer.
- Understand that applicant category is unconfirmed and separate from study destination.
- Use the dashboard with keyboard navigation or on a narrow screen.
- All displayed information is sample data. There is no live collection or API use.

The controls, program cards and admission stages use shared components for consistency.

Skill assessment: this small dashboard shell does not yet justify a dedicated reusable skill. Proposed decision, pending user confirmation: keep its guidance in project documentation. Reconsider reusable discovery and verification skills in later steps.

## Add your own countries and subjects

Status: reviewed by the user and merged into dev.

- Add a country or subject using its New field and Add button, or press Enter.
- A new option is selected immediately; click Find programs to apply the selection.
- Names are trimmed and repeated spaces removed. Blank names and duplicates ignoring letter case are rejected.
- Added options are saved in this browser. If storage is blocked, they remain available for the current session and a message explains that limitation.
- After reloading, added options remain available but selection returns to the default settings.
- Adding options does not discover programs or create sample deadlines. This remains a sample dashboard without APIs.

Skill assessment: the shared add-option component belongs in this project; no separate skill is recommended. Awaiting confirmation of this assessment.

## Step 2 — Institution and program discovery

Status: implemented and checked against live sources; awaiting user review before merging into dev.

- Export selected countries, subjects, degree and intake as a local discovery request.
- Run a local browser collector against configured institution directories and program catalogues, with no external APIs.
- Cover initial sources for Canada, the UK, Singapore, Australia, the Netherlands and Germany. Holland is accepted as an alias for the Netherlands.
- Show directory-listed institutions, matching programs, evidence links, last collection time, coverage limits and source failures.
- Keep real discovered programs separate from fictional sample timelines. Real programs have no collected admission dates in this step.
- Keep unconfirmed campus, intake and applicant category explicit.
- Retain timestamped local run reports and remove duplicate records.

Coverage is bounded and varies by country. See DISCOVERY.md for the exact institution types and catalogue limits, and STEP-2-MANUAL-TESTS.md for acceptance checks.

Skill assessment: discovery may become a reusable skill; recommend retaining project documentation until the adapters stabilize, pending user confirmation.

Live Computer Science master's check: 246 directory-listed institutions and 13 program matches (Canada 1, Singapore 6, Australia 3, Netherlands 1, Germany 2). UK collection was blocked with HTTP 403 and is tracked in issue #4. These are bounded collection counts, not national totals. Issues #5 and #6 record the mode-label and Dutch card-parser corrections included in the step 2 PR.

## Country alias correction

Holland and The Netherlands now use the existing Netherlands option. Old saved aliases no longer create extra checkboxes, and adding an alias explains that the destination already exists. Subjects are unaffected. No separate skill is recommended for this small preference correction.

Manual checks: reload a browser with Holland saved; confirm only Netherlands appears. Try adding Holland, The Netherlands and Netherlands; confirm no extra option is created. Add a different country and confirm it still persists.

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

Status: reviewed and merged into dev.

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

## Step 3 — Admission-stage evidence collection

Status: reviewed and merged into dev. PDF/OCR extraction still needs a live document check.

- Collect opening, application, document, test, interview, offer, deposit and enrolment date evidence from official program pages and linked admission notices.
- Keep raw date text, intake context, applicant category, source passage and collection time. Transcript and referee records remain distinguishable within Supporting documents.
- Show missing, relative and unpublished source records without inventing dates or years.
- Label all collected records Needs verification. Stage 4 will determine whether a record applies to the requested intake and applicant category.
- Keep previously collected evidence out of a different requested-intake view.
- Support bounded text extraction and OCR for linked admission PDFs when local tools are installed. PDF/OCR evidence requires visual review.
- Keep source failures and historical reports available locally. No external service APIs are used.

See STEP-3-MANUAL-TESTS.md for commands, limits and acceptance checks. New panel and evidence rendering use shared components.

Skill assessment: keep project documentation until verification rules stabilize; no new skill created without confirmation.

Initial live HTML collection checked 13 programs and retained 26 unverified records across eight programs. No records were found in the bounded checked sources for the other five programs; this does not establish that their deadlines are unpublished. Fourteen automated tests passed, including alias deduplication, applicant/intake separation, opening/closing tables, relative rules, webinar exclusion and rejection of month/year intake labels as day dates. Desktop browser checks passed; mobile remains a manual check because the preview viewport override did not apply during this run.

## Step 4 — Verify published source records

Status: implemented on a feature branch; awaiting user review before merging.

- Revisit the current official program page and its linked date source, then reproduce the exact stage/date/intake/category evidence.
- Offer exact start-month selections from published evidence. Do not guess what a seasonal intake means.
- Mark a publication Source verified only when its scope, freshness, date and exact intake checks pass.
- Keep applicant eligibility and unspecified rounds or cutoff times unconfirmed.
- Flag changed, blocked, stale, conflicting, invalid, out-of-cycle and incomplete evidence for review.
- Keep other-intake records in a separate disclosure. Separate transcript/referee deadlines and applicant categories during conflict detection.
- Preserve local verification history and keep PDF/OCR evidence pending visual review.

See STEP-4-MANUAL-TESTS.md for setup, acceptance checks and scope limits. No external service APIs are used. Twenty-one automated tests cover collection and verification behavior.

Live source rechecks reproduce 24 published records with exact intake contexts: ten across NUS August 2027 programs, seven for UBC September 2027 and seven for UBC January 2028. Two German records remain in intake review. Desktop browser checks confirm exact-month selection, source evidence, other-intake exclusion and zero source-verified records for ambiguous seasonal selections. Coverage is limited to the collected sources; these are not personal eligibility decisions. PDF visual review and mobile acceptance remain manual.

Skill assessment: retain project documentation for now; no new skill created.

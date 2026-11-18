# Running feature record

## Singapore date review and authenticated YAML writer

Draft PR #37 reviews all 31 real Singapore programmes across 37 intake records against official sources on 18 November 2026. Each admission YAML records its review date and evidence references. Unknown deadlines stay unverified; NUS's conflicting status remains in review and Kaplan has no invented 2027 cutoff. SMU acceptance now shows an offer-dependent rule rather than one universal June date (issue #38). SUSS supporting-document, applicable test-score and appeal deadlines are added. Existing requirements, applicant policies, QS rankings and programme details are retained.

Everyone reads without an account. A privately configured local writer can sign in and edit an existing programme/intake/category/stage. Saving validates and updates the YAML directly, regenerates JSON and refreshes the dashboard. Manual changes are visibly unverified and retain a local audit of the previous value. Stale edits are blocked. Passwords are stored only as salted hashes in an ignored folder; no default credentials are supplied. This local server capability is not a production authentication deployment.

The preview remains http://127.0.0.1:4180/. New writer controls reuse shared form components. See SINGAPORE-2027-DATE-AUDIT.md for results and WRITER-ACCESS.md for private setup and manual checks. Browser checks remain with the user; no merge until review. Skill assessment: reuse the existing admissions-extraction guidance for date verification, and keep writer setup in project documentation; confirmation requested at review rather than creating another skill.

Validation: the static build, JavaScript syntax and whitespace checks pass, as do all 56 automated tests. Writer integration tests use temporary data and credentials, checking reader restrictions, origin/token checks, exact YAML persistence, preservation of adjacent data, JSON refresh, audit history, stale forms, expiry, sign-out, password rotation and login throttling. HTTP checks confirm the fixed preview serves all 37 reviewed real intake records; source YAML and private credentials return 404. No preview writer credentials have been created; private setup remains with the user.

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

## Remove duplicate Autumn intake

When published start months are available, discovered programs no longer list Autumn 2027 beside those months. The form asks for an explicit published intake instead of guessing a month. Exact-month selections are preserved when switching views. Autumn remains only in the separate fictional sample view. Spring 2028 is unchanged. A request cannot be downloaded without an intake selection.

Manual checks: reload discovered mode and confirm Autumn is absent; choose a published month and confirm verification still works; toggle to samples and back and confirm the exact-month choice is restored. No separate skill is recommended for this small UI correction.
## Static rebuild — curated YAML to JSON

Status: draft PR #25, based on dev. Pending preview/manual-test approval. The pending discovery and applicant-context PRs are not included.

The active dashboard has been rebuilt around a static, manually maintained catalogue. University/program details live in YAML, with separate annual admission files. A build validates the records and generates the JSON the page displays. Six fictional universities and eight programs demonstrate the workflow; the initial Computer Science/Bachelor’s view contains six programs. All institutions, dates and evidence are visibly labelled dummy data.

Users can filter by destination, subject, degree and exact intake, select a program and view eight admission stages. One sample program demonstrates two explicitly selected applicant routes. Dates can be fixed, a date window or a relative rule. Missing stages explain not researched, not yet published, source unavailable or needs review. Countries and subjects remain addable as session filters; YAML records are needed to supply actual catalogue entries.

Shared filter, selector, card, badge, metric and timeline components keep the interface consistent. The static preview serves only built assets and generated JSON. It exposes no collection endpoint, source YAML or prior research reports. The old browser-automation dependency and npm collection commands are removed from the active workflow; historical source files remain outside the static build.

Validation rejects malformed/duplicate YAML, dangling or duplicate IDs, bad dates, reversed date windows, incomplete stage lists, unknown fields and dummy records claiming verified information. Generated JSON is tracked; a consistency command and CI detect stale output. Source passages remain readable but are explicitly fictional and unchecked.

The authoring guide is YAML-DATA.md; acceptance checks are YAML-STATIC-MANUAL-TESTS.md. Skill assessment: retain project documentation for the first dummy-data workflow, subject to user confirmation. No new skill created.

Validation: the static build, generated-JSON consistency check and all 30 automated tests pass (nine new catalogue tests plus retained regression tests). HTTP checks confirm the preview and generated JSON return 200, while source YAML and the previous collection endpoint return 404. Dependency installation reports zero known vulnerabilities. Browser interaction was interrupted by activity in the user's native browser; visual, keyboard and mobile acceptance remain manual. The new preview is available locally on port 4180 and has been requested in the Codex browser panel.

## Real Singapore undergraduate admissions — 2027

Draft PR #30 adds 31 real programmes across eight Singapore institution/provider records. Economics, optional behavioural economics and criminal justice study, dedicated criminology degrees, and formal technology/economics combinations are included. Multiple confirmed intake months and local/international application deadlines remain separate. The existing fictional examples stay labelled.

The dashboard starts with Singapore/Economics and clearly distinguishes curated real programmes from fictional samples. Official source links, research dates, visible conditions and programme notes explain what each date means. Unknown stages say Not verified. NUS's inconsistent application-status label says Needs review; Kaplan's unconfirmed 2027 intake month stays unknown. No live search or external API has been added.

Real-data validation requires checked official institution evidence for verified deadlines and prevents dummy/real evidence mixing. Additional decision stages and unknown intake months are supported. See SINGAPORE-2027-DATA.md for preview expectations and manual tests. Skill assessment: retain project documentation for now; ask the user before creating a reusable admissions-research skill. No merge until preview/manual-test confirmation.

At the user's request, programme cards and timeline details now show the QS World University Rankings edition, rank, official source and check date. SIM and Kaplan records identify the awarding university being ranked. Unverified overall ranks remain clearly unavailable; regional/subject rankings and LSE's rank are not substituted. Ranking metadata lives once per university in YAML and is validated separately from admission-date evidence. The duplicate site header tracked in issue #31 has also been removed following explicit user approval of that scope.

## Indian undergraduate applicant-route matching

Draft PR #32 replaces the first-route default (issue #33) with an applicant panel for Class XII board, citizenship, Singapore PR status and pending/available results. Apply the details once and the app checks the selected programme against explicit, sourced YAML rules. No match, incomplete facts, unresolved evidence or conflicting rules means Route not determined, with no personalised timeline. Applicant details remain in page memory and are cleared on reload.

Verified coverage is CBSE/ISC at NTU and non-PR CBSE/ISC at SMU. NUS's older board instructions and SMU PR conditions remain in review. Other providers and state-board names remain undetermined until independently verified. Available final results receive submission instructions appropriate to completed qualifications; no release date is guessed. Route matching never establishes academic eligibility or upgrades an unverified deadline.

Shared select, text and applicant-panel components standardise the form. The compiler validates rule scope and official evidence; matching is deterministic and blocks overlapping rules. No APIs, backend, profile persistence, postgraduate matching or automatic nationality inference are added. Preview/manual checklist: INDIAN-APPLICANT-ROUTES.md. Skill assessment: project documentation is sufficient; no new skill created without confirmation. Await user review before merging.

Validation: static build and 46 automated tests pass, including applicant-form and rendered route-state checks. HTTP checks on port 4181 confirm the page, new matching module and JSON are available; source YAML is not served. Browser/keyboard/mobile review remains manual at the user's choice. The user confirmed retaining project documentation rather than creating a new skill.

## Admission extraction coverage and visible published calendars

Draft PR #36 addresses issue #35. All 31 real programmes have partial-extraction records for their available requirements and explicit gaps. Published admission categories and deadlines remain visible even when personal matching is incomplete. The old Route not determined heading is replaced with a missing-input prompt or an explanation that applicant-specific details could not be extracted, plus a direct official programme link. Unverified stages keep their status and source wording.

The source review follows programme links into requirements documents. Buffalo and RMIT PDF tables were visually checked, document update dates are retained separately from intake dates, and SUSS's blocked table remains in review. Narrow SIM-document provenance checks avoid accepting arbitrary cloud files. No APIs or runtime scraping are added; this remains a curated YAML-to-JSON static catalogue.

School qualification options include CBSE, ISC, ICSE, IGCSE, IB, Cambridge A Levels and all Indian state boards. Earlier qualifications prompt for the subsequent pre-university qualification. State-board groups apply only where the institution publishes them. Buffalo matching distinguishes completed results from unresolved pending results; grades remain information rather than eligibility checks.

New shared requirements, published-calendar and extraction-fallback components preserve consistency. A repository-versioned admissions-extraction skill draft covers discovery, extraction, verification and curation, with institution notes rather than duplicated skills per university. It is not globally installed. See ADMISSION-EXTRACTION-REVIEW.md for limits, the preview and manual tests. No merge before user review.

Validation: the static build and all 53 tests pass, including source provenance, extraction coverage and visible-calendar behaviour. The skill passes its validator. HTTP checks confirm the preview and JSON load on port 4180 while source YAML and skill files remain unserved. Browser/keyboard/mobile checks remain manual.

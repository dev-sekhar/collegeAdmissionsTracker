# Running feature record

## Stable return-home navigation

Draft PR #54 addresses the reported brand-click jiggle (issue #55). Ordinary clicks on Admissions Atlas now reset the landing state in place, avoiding the full reload and temporary loading-only layout. Default filters, empty applicant details, expanded country groups and initial session options are restored as before. Modified/middle-click behaviour remains native, and the link still works without the enhancement.

Scrollbar space is reserved to reduce sideways shifts when page height changes. The existing brand stays underlineless and keyboard-accessible. Build, whitespace/data checks and all 17 browser-journey tests pass, including in-place home reset and modified-click handling. Actual visual stability remains a browser review item. This uses shared page-state handling and project documentation, not a separate skill. Preview stays on port 4180; no merge before review.

## Simplified QS rank labels

Draft PR #53 hides the leading equals sign in university-card rank labels, so #=119 displays as #119. Raw QS values in YAML and numeric ordering stay unchanged; missing ranks still show a dash. Manual check: refresh port 4180 and confirm SIM/RMIT #119, SMU #411 and SIM/Buffalo #416. This is a shared display-component adjustment, not a separate skill. No merge before review.

## Brand without an underline

Draft PR #52 removes the Admissions Atlas hover underline at the user's request. The name/icon still link to the landing page and retain the keyboard focus outline. This CSS-only adjustment needs no separate skill. Manual check: hover the brand, confirm there is no underline, then click it to return home. Preview remains port 4180; no merge before review.

## Country minimise returns to the summary

Draft PR #50 clears university/programme selection when its country tile is minimised. The right pane immediately returns to the Universities/Programs summary and catalogue-wide upcoming deadlines. The country stays collapsed, filters remain unchanged, and expanding it again does not restore an old selection. Keyboard focus stays on the country toggle.

Collapsing an unrelated country leaves the current university alone. Detached native-toggle events are ignored to avoid stale changes after a render. The existing shared country component handles the behaviour; project documentation is sufficient and no separate skill is needed. No YAML/data changes. Preview remains port 4180; no merge before review.

Validation: build, whitespace and unchanged-data checks pass. All 15 browser-journey tests pass, including selected-country collapse, unselected summary restoration, focus return, unrelated countries and detached events. HTTP checks confirm the updated toggle/reset code is served on port 4180. Native browser/keyboard interactions remain manual review items.

## Brand link back to the landing page

Draft PR #49 makes the Admissions Atlas name and its icon one accessible home link. Clicking either, or using Tab and Enter, reloads the default landing page with no university or programme selected, showing the summary again. As a fresh page load, filters and optional applicant details return to their defaults. No deadline or YAML data changes.

The existing header/brand styling is retained with a hover cue and keyboard focus. This small navigation change uses a native link and project documentation, not a separate skill. Preview remains on port 4180; no merge before user review.

Validation: build, whitespace and unchanged-data checks pass. An HTTP check confirms both icon/name are inside the home link and its landing target returns 200 on port 4180. Clicking and keyboard navigation remain manual review items; no extra tests were added for native link behaviour.

## QS-ranked university order

Draft PR #48 orders universities best-ranked first within each country tile, using the verified QS rank already stored in YAML. Missing/unverified ranks appear last. Equal ranks and unavailable ranks use alphabetical order for consistency; ties and rank bands keep their original displayed labels (bands sort by their lower endpoint). No ranking or admission data is changed.

Singapore's order is NUS, NTU, SIM/RMIT, SMU, SIM/Buffalo, Kaplan/Murdoch, then the two unavailable-rank entries SIM/UOL and SUSS. The programme pane, popup and all-university deadlines are unchanged. This is shared presentation logic with project documentation, not a separate skill. Preview remains port 4180; no merge before user review.

Validation: build, syntax, whitespace and unchanged-data checks pass. All 13 browser-journey tests pass, including numeric rank ordering, tied/banded ranks, unavailable ranks last and existing navigation through all programme/category timelines. HTTP checks confirm the sorted module is served on port 4180. Visual review remains manual.

## Catalogue-wide upcoming deadlines

Draft PR #47 makes Upcoming deadlines cover every real university, programme, intake and published category in the YAML catalogue, regardless of browse filters. The label explicitly says All universities. The Universities/Programs cards and browse list still follow filters; they do not restrict deadline coverage.

Selecting a global deadline opens its exact programme/intake/category even when browse filters exclude that record. Filters are preserved, and closing the popup returns focus to the deadline entry. Midnight refresh does not interrupt the popup. The existing seven-day window, two-day red urgency, evidence flags and exclusion of fictional/unknown/relative dates are unchanged. No YAML data changes. This is an update to shared application components and project documentation, not a separate skill; preview remains port 4180 and requires review before merge.

Validation: build, syntax, whitespace and unchanged-data checks pass; all 72 automated tests pass. The global-deadline regression checks an activity outside the chosen intake/degree filters, opens the correct hidden intake/category, and restores focus while leaving filters unchanged. Midnight refresh leaves the popup intact. HTTP checks confirm the all-university scope and full-catalogue source are served in the preview; actual browser appearance remains manual review.

## Activities ending in the next seven days

Draft PR #46 replaces the Upcoming deadlines placeholder with real activities from the existing YAML-generated catalogue. It follows current filters and lists dated stages ending today through seven calendar days ahead, sorted by ending date. Date windows use their end date. Application-opening events, unknown/relative deadlines and fictional examples are excluded. Review/manual entries keep their warning labels.

Activities ending today or within two days are highlighted red and also say Urgent with a due-day label. Each entry names the university, programme, intake and published applicant category. Selecting its programme opens the exact matching timeline/category. Today is calculated in Singapore time for the current Singapore data, so a viewer in another country gets the same deadline window. The summary refreshes on date changes without interrupting an open programme popup.

For 20–27 November 2026 there are no qualifying activities in the current records. The next recorded ending is SIM/Buffalo's international application deadline on 30 November; it is not pulled into the earlier seven-day view. No source dates or YAML records are changed. The feature is deterministic catalogue filtering in shared components, with project documentation rather than a separate research skill. Preview remains port 4180; no merge before user review.

Validation: build, syntax, whitespace and unchanged-data checks pass; all 72 automated tests pass. Tests cover today/two-day/seven-day boundaries, window endings, relative/unknown exclusions, fiction exclusion, preserved review/manual labels, timezone/leap-date handling, filtered activities, date rollover and navigation to the exact intake/category. Preview HTTP checks verify the real-data empty window on 20 November and one urgent deadline with a fixed 28 November test clock. No admission data is altered for testing; browser appearance remains a manual review.

## Right-pane catalogue summary

Draft PR #45 replaces the unselected right-pane prompt with Universities and Programs summary cards. Counts follow the current filters and count each programme once, regardless of its number of intakes. The default view shows eight universities/providers and 31 programmes. The repeated count line above the browsing panes has been moved into this summary.

An Upcoming deadlines area is clearly marked Coming later; no deadline values are fabricated. Selecting a university replaces the summary with its programme cards, and clearing/resetting the selection restores it. The summary remains available on narrow screens above the university list. Existing country tiles, programme popup, date data and deferred reader/writer controls are unchanged.

The summary uses a shared UI component. Project documentation is sufficient for this presentation change; no separate skill is needed. Preview remains http://127.0.0.1:4180/; manual checks are in SPLIT-PANE-MANUAL-TESTS.md. No merge before user review.

Validation: build, unchanged-data and whitespace checks pass; all 65 automated tests pass. Existing journey tests now verify default counts, the September filter's 1/4 counts, zero matches, reset and hiding the summary when a university is selected. HTTP checks confirm the summary component/styles are served on port 4180. Desktop/mobile visual review remains manual.

## Collapsible country tiles and single-line university names

Draft PR #44 turns each country group into one tinted background tile with a larger, prominent country label and native expand/collapse control. University rows also have tinted backgrounds, with a stronger selected state. Names stay on a single line; the list gets more room on desktop, while limited-width names use ellipsis with the full name available on hover, to assistive technology and in the programme pane. Short ranking labels are retained.

The redundant Universities title above the country tile is removed. Country collapse state survives programme selection, popup close and filtering within the page session. Programme cards, timelines, sources and reader/writer deferral are unchanged; no data was edited. Shared country-list/card components and project documentation cover this presentation change; no separate skill is needed. Preview stays on port 4180, with review required before merging.

Validation: build, unchanged-data and whitespace checks pass, along with all 65 automated tests. The country-state journey test checks collapse persistence and popup return; existing coverage still traverses all 31 real programmes, 37 intakes and 75 category timelines. HTTP checks confirm updated styles/modules are served on port 4180. Heading size, colours, truncation and keyboard/mobile behaviour remain manual review items.

## Compact university cards grouped by country

Draft PR #43 groups the left university list under country headings. Each real university card shows its full name and a short rank such as #12, without repeating the country, QS label, edition, programme count or action text. Tied ranks retain their equals sign. Missing ranks show a dash; awarding-university context remains accessible and in programme sources. Fictional examples retain their label.

Cards use modest padding and wrap long names rather than truncating them. The desktop university pane is narrower, giving programme cards more space. Programme cards, detail popups, dates and reader/writer deferral are unchanged. Manual checks are added to SPLIT-PANE-MANUAL-TESTS.md. This is a shared component/style refinement; no separate skill is needed. Preview remains on port 4180; no merge until user review.

Validation: the build, unchanged-data check, whitespace check and existing 63-test suite pass. The updated eight-test browser-journey file also passes, including the new country/rank check and all existing programme/intake timelines. HTTP checks confirm the compact-card module and styles are served on port 4180. Spacing and narrow-screen readability remain manual checks.

## University list, programme pane and details popup

Draft PR #41 refines the browsing layout after user review (issue #42). Universities stay in a left-hand list; selecting one displays its programme cards immediately in the right-hand pane. Selecting a programme opens its details and admission timeline in a popup. The university and programme list remain in place behind it. Close or Escape returns to the selected programme card, preserving both pane scroll positions.

On smaller screens, selecting a university opens the programme pane in place; All universities returns to the list. The popup fits the screen and scrolls independently. Existing intake/category selection, expandable evidence/requirements and optional applicant details remain available. Reader/writer controls remain deferred. No admission data changes.

The split-pane shell and programme popup are shared UI components. This project-specific layout belongs in components and project documentation, not another skill. Preview remains http://127.0.0.1:4180/. Manual checks: SPLIT-PANE-MANUAL-TESTS.md. No merge before user review.

Validation: build, syntax/whitespace checks and all 63 tests pass. Journey tests still cover all 31 programmes, 37 intakes and 75 category timelines, plus popup Close/Escape, keyboard-focus return and pane scroll preservation. HTTP checks confirm the new CSS and modules are served on port 4180. Data remains unchanged. Native browser geometry, keyboard trapping and mobile behaviour remain manual checks.

## University → programme → timeline browsing

Draft PR #39 replaces the repeated programme/intake card list with university cards. The default Singapore undergraduate view includes Economics and Criminology: eight providers and 31 programmes. Select a university to open its programme callout, then a programme to view its timeline. Multiple intakes share one programme entry. Choose a published applicant category explicitly; changing the intake clears it.

The main timeline shows only stage, date and status. Conditions, requirements, source evidence, rankings and optional applicant matching remain available in collapsed details. Filters still support user-added countries/subjects. Breadcrumbs return to programmes or universities. Reader/writer controls are deferred; existing writer code is retained for later. The curated YAML/catalogue data is unchanged.

The new shared cards, callout, navigation, disclosure and compact timeline components follow the approved mockup. The preview stays at http://127.0.0.1:4180/. See UNIVERSITY-BROWSE-MANUAL-TESTS.md for acceptance checks. Skill assessment: project documentation is sufficient for this presentation change; confirmation requested at review. No merge before preview/manual-test approval.

Validation: build, syntax and whitespace checks pass, along with all 62 automated tests. New journey checks cover grouping, explicit categories, intake/category resets, filters, back navigation and preserved completed-result instructions, traversing all 31 real programmes, 37 intakes and 75 category timelines. HTTP checks return 200 for the page, styles, new modules and catalogue on port 4180. Git confirms no data changes. Browser/keyboard/narrow-screen review remains manual.

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

# Netherlands real-data catalogue and removal of examples — 20 November 2026

Added eight Netherlands universities and 17 undergraduate programmes covering economics, quantitative/data combinations and Dutch-taught criminology. Programme details show checked official sources; dates without explicit 2027 confirmation remain unknown. Added QS rankings and university-local upcoming-date handling. Singapore records and matching are preserved. Removed all fictional university and intake YAML records. Reader/writer features remain for later. Review instructions: [Netherlands data and manual checks](NETHERLANDS-2027-DATA.md).

## Remembered criteria and collapsed countries — 20 November 2026

Countries start minimised when the page opens. Chosen destinations, subjects, degree and intake are remembered in this browser across sessions, including custom filter names. This does not save applicant details or create programme data. Reset filters restores and saves the defaults. The existing home link also restores defaults. Blocked browser storage does not prevent browsing. Only real catalogue rows are shown, so fictional records cannot appear even if an older mixed catalogue is supplied. Harbour is absent from the active YAML and generated catalogue. Tracked report: issue #58.

Manual checks at http://127.0.0.1:4180/: refresh and confirm country tiles are minimised; expand a country to view universities; change countries, subjects and intake, then close/reopen the same address and confirm the criteria return with no university selected. Confirm Harbour is absent. Use Reset filters and reopen to confirm defaults are restored. Storage belongs to this browser and address; private browsing or clearing site data removes it.

## VU 2027 calendar verification — 20 November 2026

VU Economics and Econometrics now combine the programme instructions with the central admissions page that explicitly covers 2027/28. Opening, applicant-category closing and final certified-diploma dates are verified individually. Initial dashboard completion and A-level exceptions remain visible; the final diploma date is not labelled as an enrolment deadline. Three Netherlands programme application records still need explicit year-specific confirmation: Tilburg Economics, Tilburg Econometrics and Utrecht Economics.

Proposed treatment of remaining gaps: investigate the previous two or three matching intake years before estimating. Any supported future estimate must say Tentative, remain unverified, and record the historical years and official sources. Insufficient or conflicting history leaves the date unknown. The historical search so far has not established two matching intake years for those three programmes, so no estimate has been added or falsely described as historical evidence. An undated current rule is not proof that a university has failed to publish its calendar.

Manual review: at http://127.0.0.1:4180/, select Netherlands and expand VU. Open each economics programme and compare both categories against its linked central calendar. Check 1 October 2026 opening, 1 April/1 May 2027 closing, and 31 August final diploma with earlier-upload conditions. Unknown interview, offer and payment dates must remain unverified. No merge until confirmed.

## Three-month upcoming deadlines — 20 November 2026

The summary now lists recorded closing activities from today through three calendar months ahead, across all universities. The end date is included; short months use their last day. University-local dates, chronological ordering and red urgency within two days are retained. This updates the existing deadline component rather than adding a separate workflow or new interface. No YAML dates or verification states change.

Manual checks at http://127.0.0.1:4180/: refresh and confirm Next 3 months; check January 2027 deadlines appear in November 2026; change destination filters and confirm the global deadlines remain; open a deadline and check the matching programme/category. On the two-day boundary deadlines must still turn red. Build/tests cover month-end and leap-year boundaries. No merge before confirmation.

## Country and university filters for deadlines — 20 November 2026

Upcoming deadlines have their own Country and University dropdowns, separate from programme-search criteria. Both default to All. Selecting a country narrows the university options and clears a university that belongs to another country. The three-month range and two-day red urgency are unchanged. These choices are remembered in this browser with the other criteria. The home link restores all deadline destinations. An empty result means no recorded deadline matches, rather than proof that no deadline exists.

The existing shared dropdown is reused in a deadline-filter component. No additional filter types were implemented. Admission stage and verification status are suggested future options only.

Manual checks at http://127.0.0.1:4180/: select Netherlands under Upcoming deadlines and confirm only Dutch universities appear there; select University of Amsterdam and open a deadline; change to Singapore and confirm the university selection clears; return both controls to All. Change programme-search filters and confirm deadline choices stay independent. Reopen the same browser address and confirm deadline choices return. Verify no-result selections show a clear message. No merge before user confirmation.

## Compact filters and responsive full-width layout — 20 November 2026

Deadline filters now include admission stage and verification status. The four controls live in a compact, initially collapsed Filters row with an active-filter count. They expand into four columns on wide screens, two on smaller screens and one on narrow phones. Stage/status choices are saved locally alongside country/university choices. Tentative is a filter choice only: it does not create estimates or mark unknown dates as verified; there are no tentative records yet. Unknown dates cannot appear in a date-based upcoming list.

The dashboard uses the available screen width with modest side padding. Desktop keeps university and programme panes beside one another; tablets/phones stack the country list above the summary and show programmes on selection. Deadline cards use available columns without horizontal page scrolling. Compact controls retain touch-sized targets. Uses the existing dropdown and disclosure patterns; no separate skill is proposed for this project-specific layout change.

Manual preview checks at http://127.0.0.1:4180/: refresh and expand Filters; combine country, university, stage and Verified; verify Tentative shows the no-records message; reload and check saved choices. Collapse Filters to reclaim space. Resize to desktop, tablet and 375px phone widths, checking dropdowns, university names, deadline cards and the programme popup for clipping or horizontal scrolling. Keyboard-tab through Filters and dropdowns. Confirm two-day red urgency remains. No merge before confirmation.

## Teaching-language highlights — 20 November 2026

The three already verified Dutch-taught Criminologie programmes at Leiden, Erasmus and VU now have explicit language metadata. Their programme cards use amber backgrounds and a Taught in Dutch label; the same label appears in programme details and upcoming deadlines. Red deadline urgency remains separate. Unknown teaching languages are not guessed from country or course titles; programmes offering English alongside another language are not marked non-English-only. The shared language badge is reused across views. This is a project component/data change rather than a separate skill.

Manual preview: select Netherlands, expand Leiden/Erasmus/VU and check the amber Criminologie cards and Dutch label. Open a card and confirm the label appears in details. Filter deadlines to Leiden and check its labels. Compare an economics programme, which should keep its existing colour. Check readability on a narrow screen and red urgency where applicable. Preview remains http://127.0.0.1:4180/; no merge before confirmation.

## Annual intake years and tentative future schedules — 20 November 2026

Programme search now accepts an intake year, including a student-entered future year. All entry periods in that year are included; the programme dialog retains published entry-period choices when needed for different deadlines. Old saved month filters migrate to their year. Blank means all years.

Exact records for the requested year take priority. Where a future year's calendar is missing, the latest earlier real calendar for that programme is shifted by the difference in intake years. Example: a 1 October 2026 opening for intake 2027 becomes a tentative 1 October 2027 opening for intake 2028. Fixed dates and window boundaries shift together; leap days clamp to the end of February. Offer-relative rules stay relative. Year-specific dates embedded in free-text rules are not guessed and remain unavailable for the projected year.

Cards and timelines label projections Tentative, display the requested and source years, and warn that dates can change. Stage details retain original dates and source-year instructions for comparison. Original YAML, checked dates and published verification states are untouched; projections exist only in the display. Singapore applicant matching is not applied to an unverified projected intake. Global upcoming deadlines continue to use actual recorded dates, independent of programme search, so estimates cannot create real urgent alerts.

Manual checks at http://127.0.0.1:4180/: enter 2027 and check all entry periods remain accessible. Enter 2028, open a programme/category and check shifted dates, Tentative labels, source-year originals and the warning. Confirm an October 2026 opening becomes October 2027. Reload and check the selected year persists. Clear the year to restore all records. Confirm exact-year records are preferred, unknown dates are not invented, and actual upcoming alerts stay unchanged. Shared year input and warning components are reused; no separate skill is proposed. No merge before confirmation.

## Non-English landing deadline cards — 20 November 2026

Landing-page deadlines for non-English programmes now use the same amber background and left border as their programme cards, in addition to the language badge. Urgent deadlines retain red backgrounds and date warnings; their language labels remain visible. Reuses the existing language component and colour treatment without a separate skill.

Manual preview at http://127.0.0.1:4180/: filter Upcoming deadlines to Netherlands/Leiden and confirm amber Dutch-taught cards; compare a standard economics card. Where a deadline is within two days, confirm red urgency still takes priority. Open the programme to confirm consistent language labels. No merge before confirmation.

## Consistent deadlines and saved criteria — 20 November 2026

Deadline results and their country/university options now respect the main destinations, subjects, degree and annual intake criteria. Deadline-specific filters narrow that set further. Removing a destination clears an incompatible deadline country/university selection, while preserving stage/status choices. Deadlines cover all matching universities, rather than just a selected university card. Earlier notes describing an independent full-catalogue deadline list are superseded by this change.

Returning home now clears the selected programme and minimises countries without resetting saved criteria. Reset filters remains the explicit action for restoring search defaults. A valid intake year saves immediately while typing, without waiting for blur; duplicate change events do not reset selection. If browser storage is blocked/full, a visible note explains that choices last for the session only. Same browser/address storage is still required. Issue #68 tracks these defects. Existing shared filter/persistence components are reused; no separate skill is needed.

Manual preview at http://127.0.0.1:4180/: select Singapore and Netherlands, narrow deadlines to a Dutch university, then remove Netherlands in the main filters. Check Dutch deadlines disappear and incompatible deadline choices clear. Select a subject/year and check both results and deadlines match. Set criteria, click the app name and reload; choices must remain. Type a full year and immediately reload to check it saves. Confirm stage/status preferences persist and blocked storage shows a message. No merge before user confirmation.

## Consistent projected-intake descriptions — 22 November 2026

Projected timelines now update application descriptions and applicant-category year labels together with dates. For intake 2028, Amsterdam's English-track description says January/September 2028 rather than 2027. Previous-year openings and academic-year ranges shift consistently across all programme records. Unprojectable stages explain the gap for the requested year. Original source wording, dates and evidence remain unchanged inside a labelled Original [year] source evidence section. Curriculum/requirements notes and full research sources are explicitly labelled with their source year; checked timestamps and QS editions are never projected. The page title/header follow the selected intake. Issue #70 tracks the mismatch; this reuses the existing projection and disclosure components.

Manual preview at http://127.0.0.1:4180/: select 2028, Netherlands, Amsterdam Economics and its category. Check Apply by and its main Details text both say 2028. Expand Original 2027 source evidence and confirm originals/check dates remain unchanged. Repeat with an opening before the intake year and another university/category. Return to 2027 and confirm published descriptions remain original. No merge before confirmation.

## QS rank ceiling and global ranking preview — 22 November 2026

A saved top-level QS rank limit keeps universities at that number or better: 100 includes rank 100, while lower numbers are stronger. The limit combines with all other programme criteria and applies to deadlines. Missing/unverified ranks are excluded when a limit is set; uncertain bands must fit entirely inside the limit. Clearing the field restores any rank.

Preview QS list opens a separate complete global view for ranks up to 100, ignoring country/subject restrictions so users can inspect the full ranking before returning and changing their criteria. QS's official 2027 top-100 page contains 102 institutions because of ties; all are included. Rows distinguish universities with admissions data from those not yet added. This static YAML snapshot is checked 22 November 2026 and credited/linked to QS. It does not create programmes, deadlines or eligibility claims. For ceilings above 100, the preview explicitly says its snapshot is incomplete and links to QS's full ranking. Programme filtering can still use ceilings up to 1500 against the existing verified catalogue.

Manual preview at http://127.0.0.1:4180/: set limit 100 with Singapore selected and expect NUS/NTU only; open Preview QS list and check all 102 global entries including both rank-100 ties. Change to 10, return to programmes and confirm the narrower selection, with other criteria preserved. Reload and check the ceiling persists. Clear it or use Reset filters to restore unranked entries. Enter 500 and confirm the preview's explicit coverage warning/full-ranking link. Check mobile table scrolling and keyboard navigation. Reuses shared numeric inputs and the existing data-authoring workflow; no separate skill is proposed. No merge before confirmation.

## Editable default QS limit — 23 November 2026

New users and Reset filters now start with an editable QS limit of 100. Existing saved values, including an intentionally blank Any-rank choice, are preserved. The preview no longer silently substitutes 100 for a blank field: it explicitly shows the available cached list without implying a selected cutoff. Snapshot coverage messages use its recorded maximum rank rather than a separate hardcoded number. The source snapshot itself remains limited to verified ranks 1–100; choosing a larger limit filters admissions normally and shows the existing honest coverage warning. Shared filter/default components are reused; no separate skill is needed. This supersedes the earlier note that Reset filters clears the QS limit.

Manual preview at http://127.0.0.1:4180/: use Reset filters and confirm 100 is visible; change it to 500 and verify the admissions list expands and the preview reflects 500; clear it and check Any rank survives reload. Reset once more to restore 100. No merge before confirmation.

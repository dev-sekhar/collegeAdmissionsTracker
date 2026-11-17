# Admission details and published calendars — review

Draft PR #36 is stacked on #32. No merge into dev until the user reviews the preview and manual tests. This update addresses the incomplete Buffalo evidence and hidden-deadline behaviour reported in issue #35.

## What changed

All 31 real Singapore programmes now have a partial-extraction record. Eight shared records cover NUS, NTU, SMU, SIM/Buffalo, SIM/RMIT, SIM/UOL, SUSS and Kaplan/Murdoch. They distinguish extracted facts, facts needing review and details not extracted. Nothing claims exhaustive extraction or determines academic eligibility.

The timeline no longer hides published institutional categories when applicant matching is incomplete. Every programme can show its recorded dates and missing stages, grouped by the named applicant categories. These are reference categories, not a personal route selection. A verified applicant match can additionally show its own timeline. No first category is silently selected for an unmatched user.

The old Route not determined heading has been replaced. Missing user inputs prompt the user to complete their details. Missing extracted rules say Applicant-specific details could not be extracted, show the reason and link directly to the official programme page. Individual missing stages also link to that page. General requirements and published dates remain available in either case.

The board list includes CBSE, ISC, ICSE, IGCSE, IB Diploma, Cambridge International A Levels and Indian state boards. ICSE/IGCSE prompt for the subsequent pre-university qualification rather than being treated as a complete Class XII credential. State boards accept names from any Indian state. A published state-board group can support those names at SMU and completed-result Buffalo matching; it is not automatically extended to institutions lacking that evidence. PR details remain Singapore-specific in this Singapore-only matching edition.

## Research coverage

| Provider | Captured information | Remaining limitations |
| --- | --- | --- |
| NUS | General education/prerequisite framework; board-page conflict | Detailed board instructions retain 2026 references; programme-specific subject conditions incomplete |
| NTU | Indian XII results, documents, form categories and mathematics warning | Full programme subject conditions and all other qualifications incomplete |
| SMU | CBSE/ISC/state-board category, published marks, tests and results rules | PR-specific and second-major details incomplete |
| SIM/Buffalo | Current page, English alternatives, India Year 12 PDF row and published deadlines | Pending-results and local-category details incomplete |
| SIM/RMIT | Current page and linked India qualification table | Individual equivalence and pending-result rules incomplete |
| SIM/UOL | General entry and English guidance cross-checked on all four programme pages | Full Indian equivalence and programme-specific requirements incomplete |
| SUSS | Readable general criteria and test submission instructions | Linked qualification-list table still needs visual verification after HTTP 403 |
| Kaplan/Murdoch | Both programmes' diploma-entry, bridging and English criteria | Direct school-leaver equivalence and exact 2027 dates incomplete |

The Buffalo and RMIT India tables were downloaded to a temporary folder and visually inspected after the user approved source verification. Buffalo's PDF was updated August 2026 and RMIT's on 1 July 2026; those update dates remain separate from intake applicability. Both are still linked by the current programme pages. They are not discarded merely because their update year is 2026. Their linked-page provenance is stored with each PDF source. The SUSS PDF's text was accessible through web research, but direct download was forbidden; affected table claims remain Needs review.

## Data and validation

Requirements live under data/admission-details/*.yaml. Each record declares programme scope, partial coverage, source-backed requirements, missing sections, checked dates, update dates and applicability notes. The compiler generates admissionDetails in catalogue.json and requires coverage for every real programme once details are supplied.

Institution-linked SIM PDFs are accepted only on the exact SIM production bucket, under /onesim/media/, with a PDF path and an official SIM parent programme in scope. This is narrow provenance validation, not an allowlist for arbitrary S3 documents and not an automated proof that a page still links the file. Human source review remains necessary.

Buffalo's completed-results non-PR Indian and IB application categories have sourced matching rules. Pending-results cases stay in review while all published dates remain visible. SMU's explicit other-state-board group supports all Indian state-board names; no fabricated individual-state threshold is added. Grade criteria are displayed for reference and never used as grade filters or eligibility decisions.

## Manual acceptance tests

Use http://127.0.0.1:4180/ and reload. No browser/desktop automation was performed for this update.

1. Leave all applicant details blank. Select several real programmes. Confirm published categories and requirements are visible without Apply, and the page asks for missing inputs without saying extraction failed solely because inputs are blank.
2. Select Buffalo, August 2027. The international closing date is 28 June and local closing date 12 July. Both remain visible when no personal category matches. Expanding a category shows all recorded stages and source evidence.
3. Expand Buffalo's India requirements. Confirm the recent-three-years/70%/Grade 10 and 12 criteria, linked PDF, parent programme page and August 2026 update date. The update date must not be displayed as an intake or expiry.
4. Enter CBSE (or an Indian state board), India, PR No, results Available; Apply. Buffalo matches the international category, while academic/English requirements remain reference information. Change results to Pending: the missing pending-result detail is explained, but deadlines remain visible.
5. Enter state-board names Karnataka, Maharashtra and another Indian state. SMU can use its published state-board group. NTU does not inherit that group. No different state-specific grade threshold is invented.
6. Select IB Diploma; confirm it is offered. Completed-result Buffalo IB matching uses IB document instructions rather than Grade 10/12 state-board instructions. Institutions lacking a verified IB match still expose their published IB calendars for comparison.
7. Select ICSE or IGCSE. A subsequent Class XII/pre-university selector appears. With it blank, the page requests that detail. Choose ISC/CBSE/IB/state board; the selected final qualification controls matching. A state-board follow-up also exposes the state-board name field.
8. Select RMIT. Confirm AISSC/ISC and HSC thresholds stay distinct, with the July 2026 PDF update date. Its already-past January 2027 deadline remains labelled as published history, not a new application opportunity.
9. Select NUS, SUSS and both Kaplan programmes. Check captured information, explicit gaps and working programme links. NUS conflicts remain in review. SUSS's blocked PDF table remains in review. Kaplan's recurring month pattern must not become invented 2027 dates.
10. Check the four UOL degrees. Each has a direct programme link and the recorded 1 February deadline; shared guidance does not claim every individual's equivalence is established.
11. Switch programmes, change applicant facts, clear details and reset filters. Published information remains available. Missing-date links lead to the selected programme, never the previous one.
12. Check keyboard navigation, disclosure controls, narrow screens, long source URLs, one header and QS labels. Fictional programmes must keep illustrative labels and never claim their dates are published institutional deadlines.

## Reusable workflow

A repository-versioned skill draft is at skills/admissions-extraction/SKILL.md. It has four independently usable sections: source discovery, extraction, verification and catalogue curation, with institution-specific notes in a linked reference. It is not installed globally and creates no background job. Keeping one skill avoids duplicating evidence rules across university-specific skills; parts can be split later if their workflow grows. The user asked whether part-based skills were meaningful; this draft makes those boundaries concrete for review.

## Completed checks

The static build, all 53 automated tests, generated-JSON consistency and git diff --check pass. Tests cover source provenance, full real-programme coverage, visible dates without a personal match, qualification follow-ups, state-board group isolation, completed versus pending results, and existing regression behaviour. The new skill passes the skill-creator validator. HTTP checks on port 4180 return 200 for the page, application modules and catalogue; source requirements YAML and skill source files return 404. Browser/keyboard/mobile verification remains manual, and no browser/desktop session was opened for this update.

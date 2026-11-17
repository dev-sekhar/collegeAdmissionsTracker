# Indian undergraduate applicants — Singapore preview

Draft PR #32, stacked on real-data PR #30 and the YAML dashboard PR #25. No merge into dev until preview/manual-test approval. Fixes the first-route default recorded in issue #33.

## Behaviour

The new applicant panel asks for the Indian Class XII board, citizenship, Singapore permanent-resident status and final-results status. There are no preselected answers. Apply the details once; they stay in memory when changing programmes or filters. Clear removes the profile, and reloading clears it too. No profile is sent to a server, stored in local storage or included in a URL. No external APIs are used.

The app recomputes the route for the selected programme, admission year and applicant profile. A single verified rule selects a timeline and explains why. Missing details, an unsupported board/citizenship/programme, stale evidence, a missing route, or overlapping rules produce Route not determined. There is no first-route fallback and no manual dropdown bypass. Programme links, QS rankings and general research sources remain visible when the personalised timeline is withheld.

This matches application routes only: it does not evaluate marks, subject prerequisites, language requirements, eligibility or admission chances. A matched rule does not upgrade the verification status of any deadline.

## Verified scope and limitations

| Institution | CBSE / ISC, Indian citizen, not Singapore PR | Indian citizen with Singapore PR |
| --- | --- | --- |
| NTU | India Standard XII route | Same qualification route, with explicit citizen/PR form guidance |
| SMU | International/other-qualification route | Needs review: PR-specific conditions not independently verified |
| NUS | Needs review: board page retains 2026 instructions; current calendar status also conflicts | Undetermined: no verified PR rule configured |
| SUSS, SIM awarding universities, Kaplan/Murdoch | Undetermined: board-specific matching not verified | Undetermined |

Both pending and available results are captured. With pending NTU results, show the three-day result-release instruction; with pending SMU results, preserve the predicted-results and three-working-day instructions. With results already available, document instructions instead request the final marksheet/full results with the application. This is a relative submission instruction, not a guessed calendar cutoff. Source references travel with this derived document stage, and the saved catalogue is never mutated.

State-board applicants can enter the board's name, but none is currently independently verified in this edition. They remain undetermined, even though SMU's broad page mentions other state boards. The matcher supports exact named-board YAML keys such as state:example-state-xii; it never substitutes a CBSE/ISC route or uses a board wildcard. An explicit new source review is required before adding a real named-board rule. Other citizenships, IB, Cambridge and postgraduate matching are outside this round. Residence is not collected because no supported matching rule needs it.

## Data authoring

Shared institution/cycle rules live in data/applicant-rules/*.yaml, separate from programme/intake deadlines. Each rule names its programme IDs, route ID, permitted boards, citizenships, PR statuses, results statuses, verification status, instructions and checked official sources. The compiler validates the institution, undergraduate programme scope, year, route references, explicit conditions and evidence. It generates applicantPolicies in the existing static JSON catalogue. Rule sources are official institution URLs; source summaries are paraphrases. A source's existence is not itself a guarantee of claim accuracy.

The NTU India Standard XII page explicitly distinguishes citizen/PR and international forms and describes pending final results. SMU names CBSE/ISC and distinguishes completed versus pending results on its current qualification page. NUS's detailed board page remains dated 2026; it is recorded as Needs review rather than promoted to a verified 2027 rule. All were checked 17 November 2026. No previous-year dates have been rolled forward.

New reusable UI components: textField, applicantContextPanel and the existing standard selectField. Matching is a pure function in src/applicant-routes.js. The static build and server include that module; source YAML remains unavailable over HTTP.

## Preview and manual tests

Open http://127.0.0.1:4181/ and reload. Browser automation was declined by the user; visual, keyboard and mobile checks are manual.

1. On first load, confirm no profile answers are selected. The timeline says Route not determined and shows no personalised deadline list.
2. Leave one applicant field blank and click Apply. Confirm missing details are explained and no first route is selected.
3. Select CBSE, India, PR No, Pending; Apply. Select NTU Economics: India Standard XII is matched, application closes 19 March 2027, and the final-results instruction is within three days of release. The CBSE admit-card condition is shown.
4. Change the board to ISC and Apply. Confirm the qualification is correctly identified as ISC. The CBSE admit-card wording must remain explicitly conditional on CBSE, not a new ISC requirement.
5. Change results to Available and Apply. Confirm document instructions request the already available final marksheet, instead of giving a future release deadline. Switch back to Pending: the release instruction returns.
6. Change PR to Yes at NTU and Apply. Confirm the explanation tells PR applicants to use the citizen/PR form. The app must not infer PR status from Indian citizenship.
7. Set PR No and select SMU Economics: the international/other route matches; the 19 March closing date and required-score deadline remain visible. Change PR to Yes and Apply: Needs review, no personalised timeline.
8. Set PR No and select NUS Economics: Needs review, no carried-forward 2026 document deadline and no forced selection of its foreign-applicant route. Select SUSS/SIM/Kaplan programmes: no previously matched NTU/SMU route carries over.
9. Choose State board, enter Maharashtra HSC and Apply. Confirm the name remains entered, but no matching rule is assumed. Repeat with an unrecognised name and a blank name. No fallback to CBSE or ISC.
10. Select another citizenship. Confirm the profile is outside this matching round, with no inferred route. Programme browsing still works.
11. Change multiple fields before clicking Apply. Confirm every chosen value is retained. Changes do not affect the applied timeline until Apply. Switch programmes repeatedly: the applied profile persists, but the route is recalculated each time.
12. Clear applicant details: all fields reset and the personalised timeline disappears. Reload: no previous personal details are restored. Reset filters: programme filters reset while the applied applicant profile stays intact.
13. Check labels, keyboard navigation, form submission and narrow-screen layout. Open official rule sources and confirm the check date, conditions and explanations are readable. Confirm the single header and QS information remain intact.

Skill assessment: the user confirmed keeping this workflow in project documentation. No separate skill was created.

## Completed verification

The static build and all 46 automated tests pass. Tests cover missing facts, CBSE/ISC and PR combinations, pending/available instructions, named state-board isolation, overlapping rules, unavailable institutions, rule-source validation, form callbacks retaining multiple values, and no deadline list for unresolved routes. Generated JSON consistency is included in the tests. HTTP checks on port 4181 return 200 for the page, matching JavaScript and JSON, and 404 for source rule YAML. The served page has one header. git diff --check passes. Browser interaction was declined; actual browser rendering, keyboard and mobile acceptance remain for the manual checklist above.

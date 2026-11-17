# Singapore undergraduate data — review preview

Research checked: 17 November 2026. Draft PR #30 is stacked on the unmerged YAML dashboard PR #25. Neither should be merged without the user's review confirmation.

## What is included

31 real undergraduate programme records, across eight institution/provider records: NUS (5), NTU (15), SMU (2), SIM/University of London (4), SIM/University at Buffalo (1), SIM/RMIT (1), SUSS (1), Kaplan/Murdoch (2). SIM's awarding universities are separate provider records, not three Singapore campuses. The nine other engineering/economics combinations at NTU are individual programmes, alongside Computer Science and Computer Engineering.

The 37 real programme/intake records include both published UOL August/September starts and Buffalo January/May/August starts. Eight older fictional programmes remain clearly labelled, for 39 programmes and 45 programme/intake records overall. Results count programme/intake options rather than unique degrees. Initial filters select Singapore, Economics, Bachelor's, all intakes (34 real options). Selecting only Criminology produces four real options: NUS Economics with an optional Criminal Justice minor, SUSS, and two Kaplan/Murdoch programmes. The NUS minor is not a criminology degree or a guaranteed course allocation.

Programme URLs describe the award and combination; notes distinguish degrees, second majors, optional minors and elective coursework. The notes do not guarantee 2027 elective availability or eligibility. RMIT's possible Economics/Business and Technology combination is not claimed as confirmed. Kaplan's recurring January/May/August pattern is not extrapolated into confirmed 2027 intakes; its intake month stays null.

## Dates and limits

- NUS publishes 16 December 2026–17 February 2027 for international qualifications and IB, but also displays an inconsistent Closed label. Both opening and application stages are Needs review, with the published dates retained for inspection.
- NTU explicitly separates India Standard 12, IB and the listed January-closing qualification group. The latter is not a generic international route. No automatic route selection from citizenship or residence is performed.
- SMU preserves the 11:59 pm Singapore-time cutoff in visible wording. The 16 June acceptance date applies only to second-window offers. Earlier offers follow their own instructions. IB applicants have specified test exemptions.
- SUSS's official intake name is July 2027, although teaching begins 10 August. Matriculation is a separate published window. Two offer windows are preserved in wording, without inventing one universal deadline.
- UOL's four Singapore economics programme pages each list 1 February 2027 as the application deadline. August and September remain separate intake records with the same deadline.
- Buffalo's international and local deadlines differ. The January, May and August intake records retain their own deadlines. Teaching start dates are not represented as enrolment deadlines.
- RMIT's published January 2027 deadline was 23 October 2026 and is already past at the check date. Later 2027 deadlines are not supplied.
- Kaplan has no verified 2027 closing dates in this import. All stages are Not verified and deadlines are null.

Sources in each annual YAML file contain official URLs, human-written evidence summaries and checkedAt dates. These summaries are paraphrases, not verbatim quotations. Verification means the recorded rule was found on the linked source; it is not an automated live recheck, personal eligibility decision, or guarantee that the institution will not change a date. Shared university admission calendars are applied to the listed undergraduate routes; programme-specific interview invitations and portal choices still control.

Unknown deadlines use Not verified, not Not yet published: failure to establish a date does not establish that no date has been published anywhere. Approximate outcome/interview periods remain explanatory text when exact bounds were not established. Conditional rules remain relative; they are not turned into guessed dates. Admissions decisions are an additional stage; the eight original stages remain present.

## Manual acceptance tests

1. Open http://127.0.0.1:4180/ and reload. Confirm the real-data notice, Singapore/Economics defaults, 34 options and Real programme badges. Clear subject filters and check that Harbour is labelled fictional, with illustrative evidence.
2. Select NTU Economics. Choose India Standard 12: closing date 19 March 2027. Choose the January-closing qualification group: closing date 20 January 2027, with the qualification limitation visible. Choose IB: documents 22 March 2027. No citizenship is inferred.
3. Select NUS Economics. Confirm opening/application show Needs review, the 17 February closing date remains visible, and the inconsistent Closed label is explained. Expand evidence and open the official source; check 17 November 2026 is displayed.
4. Clear Economics and select Criminology. Confirm four options including NUS's optional minor, SUSS and two Kaplan degrees. Select Kaplan: intake month not verified, every deadline unavailable, no verified badges. Filter August 2027: Kaplan must disappear.
5. Select Economics and filter August 2027. Choose Buffalo: international deadline 28 June; local 12 July. Switch January and May intakes and confirm different closing dates. Teaching starts must not become enrolment deadlines.
6. Select UOL Economics. Switch August/September: both have the 1 February deadline but different intake labels. No duplicate cards for the same programme/cycle/month.
7. Select SMU Economics. Check the 19 March cutoff wording includes 11:59 pm Singapore time; scores show 31 March with exemptions; acceptance wording visibly limits 16 June to second-window offers.
8. Select SUSS under Criminology: July intake, enrolment 14 June–23 July, teaching 10 August in wording; acceptance explains both windows without a single guessed date.
9. Select RMIT Economics / January: confirm the 23 October 2026 closing date and already-passed explanation. No later 2027 date should be invented.
10. Select Technology (clear Economics first, since subjects are OR filters). Check the formal NUS/NTU/SMU combinations and programme links. Confirm RMIT is not advertised as a confirmed economics/technology combination.
11. Add Japan or a new subject: no invented programmes appear. Reset returns to Singapore/Economics. Check keyboard selection, evidence disclosures, source links and narrow-screen readability.

12. Confirm only one site header appears. The duplicate header from issue #31 has been removed following the user's explicit request.
13. Check QS World 2027 badges: NUS #10, NTU #12, SMU #=411, RMIT #=119, Buffalo #=416 and Murdoch #422. Open a programme and check the QS source, edition and research date. For SIM/Kaplan, confirm the badge and detail identify the awarding university. SUSS and University of London show Rank not verified; neither receives a regional ranking or LSE's rank. Fictional universities receive no invented QS rank.

## QS World University Rankings

University YAML records have optional qsRanking metadata: edition, rank as a string (preserving ties/bands), status, institution being ranked, official QS URL, checkedAt and explanatory notes. Verified values above were found on the official QS institution profiles for the 2027 edition on 17 November 2026. University of London's separate federal rank and SUSS's overall world rank were not established, so these remain null and Not verified. SUSS's displayed regional table is not an overall world rank. No subject ranking is substituted for the overall ranking. Ranking evidence is validated separately from admissions evidence: adding QS sources does not allow them to verify admission deadlines.

## Review status

The completed ranking/header update passes the static build and all 34 automated tests, including generated-JSON consistency and ranking validation. Earlier HTTP checks confirmed the page, JavaScript and JSON return 200 while YAML and the retired collection endpoint return 404. Browser interaction was stopped by the user with Escape; visual, mobile and keyboard acceptance have not been claimed as passed. Each further terminal command and any browser/desktop interaction require permission under the user's updated preference. The PR push remains pending permission; nothing has been merged.

Skill assessment: project documentation is sufficient for this first curated import. A reusable official-source admissions research skill could help future countries; creating one requires user confirmation under AGENTS.md.

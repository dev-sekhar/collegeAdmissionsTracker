# Static YAML dashboard — manual review

Preview: http://127.0.0.1:4180/. Run npm run dev for the default port 4173. The page and all data must clearly say fictional/dummy. No program here is a real admissions opportunity.

1. Initial view: expect six Computer Science/Bachelor’s programs across six countries. Select a different program; its university, intake and all eight timeline stages must update.
   For Harbour's Computer Science program, switch between the two dummy applicant routes. The application window must close on 15 March 2027 for General and 5 March 2027 for Alternative; switching programs must reset the route to that program's first route.
2. Filters: select Singapore, then Business to narrow the list. Choose Master's with Computer Science and expect no results. Reset filters restores the initial six programs. Choosing no country or no subject means all options in that group.
3. Exact intake: August 2027 must show only the Singapore sample. February 2028 must show only the Australian sample. No seasonal or neighbouring month may be inferred.
4. Applicant routes: select Harbour University Computer Science. Switch from General applicant route to Alternative qualification route. The application window closes on 5 March 2027 instead of 15 March 2027. Switching programs resets the route selection; no identity-based classification is made.
5. Dates: expand Wording & evidence. Check fixed dates, opening/closing windows and the literal Within 14 days of receiving an offer rule. Dummy URLs and unchecked evidence must be clearly labelled. They must not appear as real verified sources.
6. Missing states: Netherlands tests says Not yet published; Germany interview says Not researched; Australia deposit says Source unavailable; UK tests says Needs review. Each displays Date unavailable and its explanatory wording, rather than a guessed date.
7. Add country: add Japan. It appears as a selected session filter, with no dummy matches and an explanation that YAML records are needed. Reset restores results. Add Holland and expect the existing Netherlands option to prevent a duplicate. Add a new subject; it filters existing dummy records and supplies no invented programs. A reload removes session-only custom options.
8. Keyboard/mobile: Tab through filters, Add controls, program cards, route selection and evidence disclosures. At 320/390 px width, fields/cards must stack without horizontal overflow. Program list scrolls separately on narrow screens so the timeline remains reachable.
9. YAML publishing: edit a dummy date in an annual YAML file, run npm run build, reload and confirm the new date. Restore the edit, rebuild and confirm. Introduce an invalid date or missing program reference; build must fail and leave generated JSON intact. npm run check:data must fail if YAML and tracked JSON differ.

Automated checks cover the complete repository data build, YAML parsing errors, duplicate/dangling IDs, source restrictions, status/date consistency, all-stage completeness, invalid dates/windows, filter combinations and relative/date display. Browser-based checks are recorded in the running feature document; mobile and keyboard checks require explicit manual review.

Skill assessment: keep this initial authoring/publishing workflow in project documentation. A reusable skill may be worthwhile after real source review is introduced; no skill has been created without user confirmation.

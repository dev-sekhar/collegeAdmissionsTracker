# University → programme → timeline

Preview: http://127.0.0.1:4180/

## What to review

1. Reload. The default Singapore/Economics/Criminology undergraduate view shows **8 university/provider cards and 31 programmes**, with no timeline or writer controls. QS rankings retain the awarding-university label where relevant.
2. Select SIM / University at Buffalo. Its programme callout contains **one** BA Economics entry, with January, May and August 2027 intakes. Select the programme; the category remains unselected and no deadline is inferred.
3. Choose August 2027 and International applicants: application closes **28 June 2027**. Select Local applicants: it changes to **12 July 2027**. Change to May: category clears; select International applicants and confirm **29 March 2027**. Other programmes and intakes must not repeat on university cards.
4. Use the breadcrumb to return to the university's programmes, then all universities. Choose NTU and confirm 15 distinct programmes. Navigate between programmes and confirm each category is chosen explicitly rather than carried over.
5. Open stage **Details** to read conditions and official evidence. Open **Requirements & programme details** and **All sources**. Buffalo’s linked requirements PDF and QS source remain available; none of this supporting text is expanded initially.
6. Check NUS application dates still say **Needs review**. Kaplan’s intake and dates remain unverified; no date is invented. Check SMU's acceptance rule retains its conditional windows. SUSS includes its appeal and matriculation periods.
7. Expand **Destinations & subjects**. Change filters and confirm the university/programme counts follow them. Choose September 2027 while on an August-only programme: the old timeline must disappear. Reset returns to the university list. Add a country or subject and confirm it filters catalogue entries without inventing data; Holland must not create another Netherlands option.
8. On NTU Economics, expand **Applicant details (optional)**. Set CBSE, India, PR No and Available results; apply. The India category is selected, completed-result instructions are retained, and the section stays open. Clear details and confirm the category clears. Review the incomplete-input and unsupported-board messages; published categories remain available manually.
9. Use Tab/Enter/Space to select cards, programmes, selectors and disclosures. Focus should move to the callout or timeline heading after navigation. On a narrow screen, cards and fields stack without clipped controls or an internally scrolling card list.

No merge until the user confirms the preview/manual review. Browser/visual checks remain with the user.

## Automated checks

`npm run build` and `npm test`. New journey tests traverse all **31 real programmes, 37 intakes and 75 category timelines**, comparing displayed deadlines with the existing catalogue. Tests cover grouping, explicit category selection, intake resets, filter invalidation, breadcrumb navigation and preserved applicant matching. The retained writer tests remain in the suite, but reader/writer controls are deferred from the page.

## Scope and skill assessment

Shared university card, programme callout, breadcrumb, disclosure and compact timeline components implement the approved mockup. Existing YAML, generated catalogue content, requirements, rankings, source evidence and matching rules are unchanged. The default includes Economics and Criminology to show all current real Singapore programmes.

This is a project-specific presentation change. Recommend keeping its workflow and acceptance checks in project documentation rather than creating another skill. Confirmation is requested with the preview. Admission extraction and any later writer workflow remain separate.

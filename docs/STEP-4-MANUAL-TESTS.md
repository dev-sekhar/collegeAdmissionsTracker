# Step 4 — Official-source verification

## Use

Run `npm run verify-deadlines` after collection, then reload the dashboard. Verification uses fresh browser visits to official program pages and the collected source pages. No external service APIs are used.

Exact published start months appear under Target intake. Select August 2027 for the initial NUS examples or September 2027 for UBC, then click Find programs. Seasons such as Autumn 2027 are deliberately not mapped to a month automatically.

**Source verified** means the record was reproduced on the current official source for the selected published intake, with a valid explicit date. It does not determine the user's applicant category or eligibility, infer a missing round, or establish an unpublished cutoff time.

Records can instead require scope, cycle, date/rule or document review; indicate a changed, blocked or stale source; identify conflicting dates; or be excluded as a different intake. Generic linked university deadlines do not establish scope by themselves: the source must be within the program's page path or explicitly name the program in a heading, in addition to being linked from its current official page. Checks expire after seven days and are reassessed when the page loads or the program/filter view is rendered. There is no scheduled background recheck yet.

The source evidence fingerprint includes stage, value, intake context, applicant category, URL, supporting passage, record kind and extraction method. Changed records cannot inherit an old proof. A verification report is local in `data/verification.json`; history is in `data/verification-runs/`. Both are ignored by Git.

## Manual checks

1. Reload and confirm only Netherlands appears, even with a previously saved Holland option.
2. Run verify-deadlines. Confirm the source recheck timestamp appears separately from collection time.
3. Select Singapore, Computer Science, Master's and August 2027. Select NUS Computer Science Specialisation. Confirm the opening and closing records show Source verified with the original source passage and recheck time.
4. Select Canada and September 2027. Confirm UBC's application, transcript and referee records retain Canadian/International categories and do not conflict solely because their document types or categories differ.
5. Inspect the excluded-record disclosure. UBC's January 2028 records must not appear as September 2027 deadlines. Select January 2028 and confirm the groups reverse.
6. Confirm Autumn 2027 is absent from discovered mode when published month choices exist. Choose an exact month explicitly. Toggle to fictional samples and back; confirm the discovered month selection is restored. Seasonal labels remain available only in the separate sample view or when no published months have been collected.
7. Confirm a program with no collected dates stays explicit about missing collection and never receives a verified date.
8. Verify the applicant-category warning remains visible. Selecting a destination country must never select a citizenship/residency category automatically.
9. Use the automated regression tests for blocked/changed/stale sources, invalid calendar dates, old cycles, conflicting same-scope dates, document-type separation, distinct applicant categories and labelled rounds. A missing proof or changed passage must remain unverified.
10. PDF/OCR records must remain Document review needed; they are not automatically approved from text extraction. No live PDF/OCR review is claimed by this step.
11. Switch between fictional and discovered modes. Sample dates must not display Source verified.
12. Test keyboard navigation and the layout at mobile widths; expand long evidence passages and other-intake disclosures.

## Limits

Verification is bounded by the discovery and collection coverage already documented. It rechecks collected sources, not every possible conflicting publication on the university website. Conflicts are detected among collected, rechecked records for the same program, stage/document type, intake, applicant category and labelled round. Unlabelled-round disagreements are held for review. Relative windows, yearless dates, numeric/localized date formats that are not explicitly parsed, and unpublished times remain unresolved. No date is rolled into a new year.

Skill assessment: retain these verification rules in project documentation for now; creating a reusable skill remains a separate decision requiring user confirmation.

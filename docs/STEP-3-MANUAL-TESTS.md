# Step 3 — Admission-stage evidence

## Collect

Run `npm run collect-deadlines` after discovery. It uses the latest local catalogue and its intake context. To restrict countries/subjects or change the requested intake, supply a downloaded preference file: `npm run collect-deadlines -- "C:/path/to/discovery-request.json"`.

The collector visits each matching program page and at most two linked official application/deadline pages. It reads visible HTML content and explicit intake/date tables. It does not call external service APIs.

Linked PDF notices whose link text identifies an admission application/deadline source can be downloaded through the browser. Text extraction requires Poppler's `pdftotext`. Scanned notices require `pdftoppm` and Tesseract on PATH. PDF text is limited to ten pages; OCR is limited to three pages. Missing tools, unreadable files, and blocked access are reported as source failures. OCR and table-reading results always need visual/source review.

Local reports: `data/deadlines.json`, historical `data/deadline-runs/` and downloaded document evidence in `data/deadline-files/`. These are ignored by Git. The latest deadline report replaces the previous one; historical reports remain. A failed run before final replacement preserves the prior report.

## Manual acceptance

1. Reload a browser that previously saved Holland. Confirm only Netherlands appears. Add Holland or The Netherlands; confirm the existing destination message and no duplicate checkbox.
2. Run the collector and reload. Confirm the number of collected stage records appears separately from discovered program counts.
3. Select UBC Computer Science. Expand application, transcript and referee evidence; confirm that applicant categories and intake headings stay distinct and cross-year deadlines retain their original years.
4. Select a NUS program with published application information. Confirm opening and closing dates from an intake table remain separate stages and the source link opens the application notice.
5. Confirm each real collected date says Needs verification. There must be no inferred midnight cutoff, timezone conversion, personal eligibility decision or invented year.
6. Confirm webinar dates, scholarship deadlines and accommodation dates are excluded.
7. Check stages with no collected dates. They should say No date collected, rather than claiming the institution has not announced a date.
8. Change the requested intake and submit. Evidence collected for the old requested intake should be withheld with an explanation until a matching request is collected.
9. Confirm relative offer rules stay as text and are not converted into dates without a personal offer date.
10. Expand Sources checked and verify the collected pages and any failed sources are visible.
11. Switch to fictional sample mode. Confirm sample dates never appear as real source evidence.
12. Test keyboard use and 320px layout, including long evidence passages and multiple applicant groups.
13. Where an admission PDF is linked, compare extracted rows with the original PDF visually. For a scanned notice, confirm the OCR label, page limit and manual review requirement. The initial live HTML run does not by itself verify these PDF/OCR paths.

Stage 3 collects evidence. Stage 4 will verify publication cycle, program scope, applicant category and conflicting sources before a date can be treated as an applicable admission deadline.

Skill assessment: deadline collection and verification may become a reusable skill. Recommend keeping these source rules in project documentation until the verification step is established, pending user confirmation.

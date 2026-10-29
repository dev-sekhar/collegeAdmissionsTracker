# Step 1 manual verification

Run `npm run dev` and open http://127.0.0.1:4173.

1. **Default view:** two Computer Science master's sample programs appear for Autumn 2027; the first program's stages are visible.
2. **Multiple destinations:** uncheck United Kingdom and submit. Only Northbridge University appears. Restore both countries and confirm both return.
3. **Multiple subjects:** add Business and submit. Three master's programs appear. Select each and confirm its title and timeline update and only one card is selected.
4. **Degree:** choose Bachelor's with both subjects and submit. Only Maple Coast College appears.
5. **Empty results:** choose PhD or Spring 2028 and submit. A clear empty state appears and no old timeline remains.
6. **Validation:** clear every country, then submit. An error appears and prior results remain unchanged. Repeat with no subjects. Restore valid selections and confirm the error clears on submission.
7. **Timeline states:** confirm fixed dates, unpublished dates and the offer-relative rule are clearly distinguished. No fictional date is labelled verified and no cutoff time is inferred.
8. **Evidence:** expand Evidence and verification. Confirm it explicitly says the preview has no source evidence or verification date.
9. **Applicant context:** confirm there is no citizenship/residency inference based on chosen study destinations. Applicant details are deferred beyond step 1.
10. **Keyboard:** use Tab, Space and Enter to change selections, submit, select a program and expand evidence. Focus remains visible and stays on the selected program button.
11. **Responsive layout:** inspect at 320px, 768px and desktop widths. Confirm readable controls, stacked panels on narrow screens, no clipped dates and no horizontal page overflow.
12. **No APIs:** inspect browser Network after interacting. Only local HTML, CSS and JavaScript files should load; changing filters should make no network requests.

Merge only after user confirmation. Target branch: dev.

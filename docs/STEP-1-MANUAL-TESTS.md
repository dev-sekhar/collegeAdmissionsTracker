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

## User-added countries and subjects

1. Add Japan under New country and Physics under New subject. Confirm each appears once, selected. Click Find programs and confirm the summary includes the additions.
2. Deselect all original countries and subjects, keeping only Japan and Physics. Submit and confirm a clear empty result without invented programs or dates.
3. Try blank input and ` japan ` after adding Japan. Confirm a helpful message and no duplicate. Repeat for subjects.
4. Add `New   Zealand` and confirm it appears as `New Zealand`.
5. Press Enter in either New field to add an option. Confirm it does not submit Find programs.
6. Reload the page. Added options should remain available, unchecked; default selections return. Entries are browser-local and do not sync across devices.
7. Test long names and 320px width. Labels should wrap and Add buttons remain usable.
8. With browser storage disabled, add an option and confirm the session-only message and usable checkbox.

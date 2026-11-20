# Split-pane and popup review

Preview: http://127.0.0.1:4180/ — refresh after the build.

1. On desktop, confirm universities appear as a left-hand list. Select a university near the bottom of that list: its programme cards must appear at the top of the right pane without scrolling the page down to a callout.
2. Select NTU and confirm 15 distinct programme cards. Select a programme; its details open in a popup, with both lists visible behind it. Close it, then repeat with Escape. The same programme card should regain keyboard focus and both pane scroll positions should be retained.
3. Open SIM/Buffalo BA Economics. Choose August 2027 and International applicants: application closes 28 June; Local applicants shows 12 July. Switch to May: category clears; International applicants shows 29 March. Close the popup and confirm the university selection is retained.
4. Check Details, Requirements & programme details, All sources and optional applicant details still work inside the popup. Confirm all unknown/review labels remain and writer controls are absent.
5. With the popup open, Tab/Shift+Tab must stay within it; Escape must close it. Confirm the underlying page does not scroll while reading popup details. Scroll within the popup and verify the Close button remains accessible.
6. On a narrow screen, select a university: programme cards replace the list in place. All universities returns to the university list. Open a programme and check the popup fits without horizontal clipping.
7. Change/reset filters after closing the popup. A removed university/programme must not leave stale details. Existing data and ranking/source links should be unchanged.

Automated journey tests traverse all 31 real programmes, 37 intakes and 75 category timelines. Additional checks cover the native-dialog contract, Close/Escape callbacks, focus return and pane scroll restoration. Browser-native focus trapping, actual geometry and mobile scrolling remain manual checks.

No merge until the user confirms the preview. This is a component/layout refinement; no additional skill is needed.

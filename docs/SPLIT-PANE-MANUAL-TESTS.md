# Split-pane and popup review

Preview: http://127.0.0.1:4180/ — refresh after the build.

## Upcoming deadlines — PR #46

- The unselected summary now lists recorded real activities ending **today through today + 7 days, inclusive**, using Singapore calendar dates. Events ending today through **today + 2 days** are red and explicitly labelled Urgent. Relative dates are never guessed; window dates use the end, not the start. Opening events and fictional examples are excluded.
- For 20–27 November 2026, expect an empty message with the displayed range. The next recorded ending is 30 November 2026, outside this window. Do not add fake dates just to fill the preview.
- When an entry appears, check its university, programme, stage, intake, category and date. Select its programme to open the exact intake/category timeline. Review/manual statuses must remain visible.
- Change filters and confirm unrelated activities disappear. Check the summary remains readable on desktop/mobile. Leaving the summary open across Singapore midnight should update the date window and urgency within a minute, or when the tab becomes visible again.
- Automated fixed-clock tests cover the live-data 30 November event: it is listed three days ahead on 27 November, turns red two days ahead on 28 November, and opens Buffalo's January 2027 / International category. Additional tests cover today/day-2/day-7 boundaries, past/out-of-range dates, relative/unknown exclusions, window ends, leap dates and category/intake separation.

## Unselected right-pane summary — PR #45

- Reload with no university selected. The right pane should show **Universities 8** and **Programs 31**, plus Upcoming deadlines clearly marked Coming later. No sample deadline dates should appear.
- Select a university: its programme cards replace the summary. Reset filters or use All universities on mobile: the summary returns. Programme popups should behave as before.
- Change the intake filter to September 2027: the unselected summary should show **1 university and 4 programs**, rather than counting intake rows. A filter with no matches should show zeroes. Reset restores 8 and 31.
- Check the summary fits desktop/mobile screens and the old count line no longer repeats above the panes.

## Country tiles — PR #44

- Confirm Singapore is a single background tile with a larger country label and no Universities heading above it. Click the country header, or focus it and press Enter/Space, to minimise/expand its university list.
- Check tinted university rows, a visibly selected state, short ranks and single-line names. On limited widths, hover a shortened name to see the full name; selecting it also shows the full name above its programme cards.
- Collapse a country, change/reset filters or open/close a programme popup, and confirm the country’s expanded/collapsed state is retained. Check each country works independently when several destinations are selected.
- Check desktop and mobile sizing, keyboard focus, country-label prominence and the existing programme-popup flow. No data or writer controls should change.

## Compact cards — PR #43

- Confirm Singapore appears once as a country heading above its universities. With multiple countries selected, each country has its own heading.
- Cards should show the full university name and short rank (NTU #12, NUS #10), without a repeated country or QS label. Ties retain their equals sign; unverified ranks show a dash. Ranking sources remain in the programme popup.
- Check the narrower list and modest padding are readable on desktop/mobile, long names wrap without clipping, and selecting a university still opens the right programme pane and popup normally.

## Split-pane behaviour

1. On desktop, confirm universities appear as a left-hand list. Select a university near the bottom of that list: its programme cards must appear at the top of the right pane without scrolling the page down to a callout.
2. Select NTU and confirm 15 distinct programme cards. Select a programme; its details open in a popup, with both lists visible behind it. Close it, then repeat with Escape. The same programme card should regain keyboard focus and both pane scroll positions should be retained.
3. Open SIM/Buffalo BA Economics. Choose August 2027 and International applicants: application closes 28 June; Local applicants shows 12 July. Switch to May: category clears; International applicants shows 29 March. Close the popup and confirm the university selection is retained.
4. Check Details, Requirements & programme details, All sources and optional applicant details still work inside the popup. Confirm all unknown/review labels remain and writer controls are absent.
5. With the popup open, Tab/Shift+Tab must stay within it; Escape must close it. Confirm the underlying page does not scroll while reading popup details. Scroll within the popup and verify the Close button remains accessible.
6. On a narrow screen, select a university: programme cards replace the list in place. All universities returns to the university list. Open a programme and check the popup fits without horizontal clipping.
7. Change/reset filters after closing the popup. A removed university/programme must not leave stale details. Existing data and ranking/source links should be unchanged.

Automated journey tests traverse all 31 real programmes, 37 intakes and 75 category timelines. Additional checks cover the native-dialog contract, Close/Escape callbacks, focus return and pane scroll restoration. Browser-native focus trapping, actual geometry and mobile scrolling remain manual checks.

No merge until the user confirms the preview. This is a component/layout refinement; no additional skill is needed.

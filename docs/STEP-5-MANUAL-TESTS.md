# Step 5 manual checks

Open http://127.0.0.1:4173/ with the local preview server running. Existing local discovery, deadline and verification reports are needed for real evidence; see step 4 setup.

1. Choose September 2027, find programs and select UBC Computer Science. Expand Applicant context. Enter fictional citizenship India and residence India. Apply without a category. Open a date record: it must remain unconfirmed for applicant applicability.
2. Select International Applicants and apply without checking confirmation. Expect an explanation asking for confirmation. Check the official rules, tick confirmation and apply. Open an international record: expect Matches your declared category and a statement that classification is not independently verified. Canadian records must remain visible, and publication verification counts must not change.
3. Edit citizenship or residency. The confirmation checkbox must clear. Apply with category Unconfirmed, then return to the program. No previous declaration should apply. Switch programs and confirm declarations do not leak.
4. Enter India, Germany, india. Opt into Remember, apply and reload. Reopen the panel: expect India, Germany and restored residence/timezone. Clear context and reload: personal fields must be blank and Remember off. Custom destinations and subjects must remain available.
5. Enter Invalid/Zone and apply. Expect an error. Use Asia/Kolkata and apply. Open current date-only evidence: original date must stay unchanged with no timezone conversion. Current collected records do not exercise explicit cutoff conversion; automated tests cover that separately.
6. Leave all optional identity fields blank and confirm normal program search still works. In sample mode, no real program category can be declared.
7. At a 320-pixel viewport, check that fields stack, text and buttons remain usable and no horizontal scrolling is required. Use keyboard navigation to reach fields, confirmation, Apply and Clear.

Automated validation: npm test (26 passing). Desktop checks 1, 2, saving/restoration/clear in 4, and 5 were exercised in-browser. Program switching, mobile and full keyboard acceptance remain user checks.

Limits: citizenship/residence/residency are context only; institutional membership rules are not automatically evaluated. The official program link may require following its category guidance. No eligibility decision is made. Saving uses this browser's local storage; shared browser profiles can access saved context. No external service APIs are used.

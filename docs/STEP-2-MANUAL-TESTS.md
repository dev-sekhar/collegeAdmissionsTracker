# Step 2 manual tests

1. Run `npm install`, then `npm run dev`. Confirm all six supported destinations appear and custom countries/subjects can still be added.
2. Choose desired preferences and download the discovery request. Check that the JSON matches the form, including custom selections and target intake.
3. Run the displayed command using that file's full path. Confirm local output reports institutions, program matches and source failures separately.
4. Reload. Confirm discovered mode is selected, real institution names replace fictional samples, and no illustrative deadlines appear for real programs.
5. Select a discovered program. Open its official page, catalogue link and directory evidence. Confirm its name, degree and any stated campus match the evidence.
6. Confirm intake availability and deadlines remain unconfirmed even when changing the intake. Changing form values without clicking Find programs must not change the applied result context.
7. Filter Singapore, Australia, Netherlands and Germany individually. Compare the result count with the matching collected records. Verify that partial directory and catalogue coverage remains visible.
8. Add Holland and use it alone as a country. Confirm it matches the Netherlands records. Requesting both should collect the Netherlands once.
9. Add an unconfigured country, export a request and run it. Confirm Source setup needed rather than invented institutions. For a country not in the last run, confirm Not collected in this run.
10. Check blocked directory and failed program sources under Institution directory & source issues. Verify these do not appear as successful zero-result searches.
11. Turn Show discovered programs off and on. Confirm sample deadlines are only shown in sample mode, labelled fictional.
12. Test keyboard navigation, evidence disclosure, 320px mobile layout and long program names.
13. Verify Network: dashboard interactions use local assets and the static local catalogue only. The collector uses browser navigation, not external service APIs.
14. Verify a missing or malformed latest report leaves sample mode available with an explanatory message. Verify a new collector run preserves historical reports.

Do not merge step 2 into dev until the user confirms the preview and manual tests.

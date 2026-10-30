# Admissions Explorer

The college admissions tracker includes **fictional sample institutions and dates**, plus local browser workflows for discovering real programs, collecting date evidence and rechecking official sources. It does not determine applicant eligibility and uses no external service APIs.

Requires Node.js 18 or later. For browser discovery, run `npm install` and have Microsoft Edge installed. The dashboard alone has no runtime package dependencies.

```sh
npm run dev
```

Open http://127.0.0.1:4173. Run `npm test` for the program filtering checks. The server is intended for local preview only.

Select countries, subjects, degree and intake, then choose **Find programs**. Select a program to view its sample admission stages. Some combinations intentionally have no sample programs.

Use **New country** or **New subject** and **Add** to create extra options. They are saved in this browser, selected when added, and applied with Find programs. Reloading restores the available options with default selections. New options do not fetch or generate programs.

See [the feature record](docs/FEATURES.md) and [manual tests](docs/STEP-1-MANUAL-TESTS.md).

Step 2 adds local browser discovery and a separate real-program catalogue, with partial source coverage for Canada, the UK, Singapore, Australia, the Netherlands and Germany. See [discovery setup and limitations](docs/DISCOVERY.md) and [step 2 tests](docs/STEP-2-MANUAL-TESTS.md). No external APIs or deadline extraction are included.

Step 3 adds `npm run collect-deadlines` to collect admission-stage evidence from the local catalogue's official sources. Reload to view records marked **Needs verification**. These are collected source statements, not yet verified applicable deadlines. See [step 3 setup, limitations and manual tests](docs/STEP-3-MANUAL-TESTS.md).

Step 4 adds `npm run verify-deadlines` to recheck official sources. Choose an exact published intake month to assess Source verified records, other-intake exclusions, source failures and review states. Publication verification does not establish personal eligibility. See [step 4 manual tests and limits](docs/STEP-4-MANUAL-TESTS.md).

Step 5 adds optional citizenship, residence, residency and a display timezone. Applicant categories are explicitly self-declared per program. Context stays in the current page unless browser saving is selected. Date-only evidence never shifts timezone. See [step 5 manual tests and limits](docs/STEP-5-MANUAL-TESTS.md).

# Admissions Explorer

Step 1 of the college admissions tracker: a dashboard shell with **fictional sample institutions and dates**. It does not discover institutions, fetch deadlines, call APIs, or determine applicant eligibility.

Requires Node.js 18 or later. No packages need installing.

```sh
npm run dev
```

Open http://127.0.0.1:4173. Run `npm test` for the program filtering checks. The server is intended for local preview only.

Select countries, subjects, degree and intake, then choose **Find programs**. Select a program to view its sample admission stages. Some combinations intentionally have no sample programs.

Use **New country** or **New subject** and **Add** to create extra options. They are saved in this browser, selected when added, and applied with Find programs. Reloading restores the available options with default selections. New options do not fetch or generate programs.

See [the feature record](docs/FEATURES.md) and [manual tests](docs/STEP-1-MANUAL-TESTS.md).

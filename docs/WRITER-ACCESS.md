# Editing admission dates

Everyone can read the dashboard without signing in. The local Node server supports one authenticated writer account. This is a local preview capability, not a production multi-user hosting service.

## Private setup

In the repository terminal run `npm run writer:setup` to configure the account named `writer`. For a different name, run `npm run writer:setup -- yourname`. Enter a password of at least 12 characters, then confirm the password. The password is hidden while typing. Do not send it in chat or put it in a command argument.

Only a salted password hash is stored in the ignored `.local-writer/credentials.json` file. Do not commit or share that folder. Setup can be repeated to change the writer account; existing sessions are then invalidated. There is no default password. Writer sign-in remains disabled until setup is completed.

Run `npm run dev` for the preview at http://127.0.0.1:4180/. Keep this server local. Static hosting retains public reading but cannot provide authenticated filesystem editing; production hosting needs a separate deployment/security design.

## Saving a date

Sign in under Writer access. Select the exact programme, intake, published applicant category and stage. Choose a date, date window, relative rule or unavailable date; enter a description and an explanation. Save writes directly to the corresponding admission YAML file, validates the complete catalogue, regenerates the tracked JSON and refreshes the preview data. It does not commit, push or merge the change.

Every manual save is labelled **Manual entry — unverified**. It cannot declare an official-source verification. Existing requirements, rankings, programme information and unrelated stages are retained. The previous stage value and writer name are recorded locally in `.local-writer/audit.jsonl`.

If another edit changed the YAML since the form was loaded, saving is blocked. Reload the record before making another change. Sessions expire after 30 minutes and sign-out removes access. Password rotation also revokes old sessions.

## Manual checks before merge

1. Open the fixed preview URL in a private window. Confirm programme deadlines and requirements can be read without signing in and no editing controls are available.
2. Complete private writer setup, then try an incorrect password. It must not enable editing. Sign in with the configured account.
3. Choose a Singapore programme and intake. Check the displayed YAML path and category, then save a temporary date with an explanation. Confirm the timeline labels it **Manual entry — unverified**.
4. Open the displayed YAML file in the editor. Confirm the date, writer name, note and timestamp are stored directly; confirm adjacent stages, sources, admission requirements and rankings remain intact.
5. Reload the dashboard. The saved manual date must remain. Restore the original YAML using the editor after this check and run `npm run build`.
6. Load the same record in two writer tabs. Save from one tab, then attempt a save from the stale tab. It must request a reload instead of overwriting.
7. Sign out and confirm saving is no longer available. Confirm `.local-writer/credentials.json` cannot be fetched through the preview URL.
8. Check SMU acceptance shows the conditional May/June windows; SUSS shows supporting documents with application, applicable test scores on 31 March, and the April–May appeal window. NUS conflicts and Kaplan missing dates must remain visibly unverified.

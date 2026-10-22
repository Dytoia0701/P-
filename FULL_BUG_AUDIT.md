# Bridge Protocol v23.1 — Full Bug and Error Audit

Date: 2026-10-17

## Executive result

**Outcome: 3 confirmed issues found and corrected; static, structural, syntax, and targeted workout-data unit tests pass. Full browser/device verification is still blocked and therefore not claimed.**

This audit tested the actual v23 archive, then corrected the source and packaging for v23.1. It does not claim that every interaction has been exercised in a live browser.

## Confirmed defects found in v23

### 1. Willie Bag manual number grid did not render as intended — fixed

The deployed HTML contained a literal Python template expression where buttons 1–8 should have been. The SVG targets and random-call functions existed, but the separate manual selector grid was not real HTML. Replaced the expression with eight concrete buttons and added explicit QA assertions for all eight IDs and for absence of the template placeholder.

### 2. Imported workout records were not normalised — fixed

The workout log was read from local storage and backup imports without validating the shape of each entry. Rendering expects string fields and a safe ID; a malformed record could throw during rendering, while an unsafe ID could be interpolated into an inline handler. Added `normalizeWorkoutLog` on initial load and backup import. It filters invalid record shapes, bounds the log size and field lengths, normalises numeric values, and replaces IDs outside a safe character set before rendering.

### 3. Several smoke assertions were unreachable — fixed

The original QA script called `sys.exit(0)` before the workout/Willie Bag checks, so those checks never affected the test result. Moved all feature assertions before the final decision, corrected the cache-version assertion, and added a Node unit test against the actual normalisation function in `app.js`.

## Checks run and results

| Check | Result | Notes |
|---|---|---|
| ZIP integrity | PASS | Original v23 archive extracted successfully; final v23.1 archive rechecked after packaging. |
| Inline JavaScript syntax | PASS | Extracted deployed script passes `node --check`. |
| `app.js` mirror syntax and parity | PASS | `app.js` matches the embedded runtime; syntax check passes. |
| `test-notes.js` syntax | PASS | `node --check` passes. |
| QA smoke suite | PASS | Notes/topic presence, app views, persistence keys, backup features, workout features, Willie Bag calls and selectors checked. |
| Workout normalisation unit tests | PASS | Malformed records, hostile IDs, field bounds, valid-record preservation and 1,000-entry cap tested against the deployed normaliser. |
| HTML parse / structure | PASS | Parsed with lxml; 138 IDs and no duplicate IDs. |
| App sections | PASS | 14 `view-*` sections found, including Training. |
| Willie Bag selector | PASS | Eight concrete manual selector buttons found. |
| Inline event-handler references | PASS | 104 inline handlers inspected; no missing top-level function references found by the static scan. |
| Manifest JSON | PASS | `manifest.json` parses as valid JSON. |
| Service-worker shell | PASS | Cache version updated for v23.1; referenced local shell files exist in the package. |
| Browser runtime / console | NOT VERIFIED | Headless Chromium navigation was blocked by the environment (`ERR_BLOCKED_BY_ADMINISTRATOR`) for both localhost and file URLs. No successful live browser session was available. |
| Real phone / offline install | NOT VERIFIED | Requires installation and interaction testing on the target device. |

## Important remaining manual tests

1. Open Training → Willie Bag; check all eight selector buttons, SVG targets, stance changes, random calls, voice output and Start/Stop behaviour.
2. Save, reload, delete and re-save a workout entry.
3. Export a backup containing workout entries, restore it on a test profile, and verify the entries persist.
4. Confirm an older backup with no workout key still restores without error.
5. Install from HTTPS, load once online, then launch in airplane mode and navigate between sections.
6. Verify notes search, quizzes, tasks, projects, habits, weekly review and macro calculator after upgrade.

## Release guidance

Use a backup before replacing an existing deployment. v23.1 preserves existing local-storage keys and adds normalisation around workout history; nevertheless, backup/restore and offline operation must be checked on the actual phone before relying on the new build.

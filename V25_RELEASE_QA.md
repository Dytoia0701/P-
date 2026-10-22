# Bridge Protocol v26 — Full Regression and Navigation QA

## Scope

This release retains v24's existing personal OS and study/training features while replacing the 15-item horizontally scrolling bottom navigation with a five-item mobile navigation bar and a searchable grouped section menu.

## Automated checks run

- `node --check app.js` — PASS
- `node --check test-notes.js` — PASS
- `node --check qa-workout-unit-test.js` — PASS
- `node --check qa-lifeos-unit-test.js` — PASS
- `node --check qa-navigation-unit-test.js` — PASS
- `node --check service-worker.js` — PASS
- `node qa-workout-unit-test.js` — PASS
- `node qa-lifeos-unit-test.js` — PASS
- `node qa-navigation-unit-test.js` — PASS: menu open/close, filtering, group visibility, route selection, active state, invalid route guard, Escape dismissal
- `python qa-smoke-test.py` — PASS
- Manifest JSON parse — PASS
- Duplicate HTML IDs — none found
- Inline event handler function-reference audit — PASS
- Deployed inline JavaScript and `app.js` mirror — exact match
- All 15 views are present and accessible from the primary bar or section menu — PASS
- All service-worker app-shell assets exist — PASS
- ZIP integrity — verified after packaging

## Browser limitation

A Chromium headless launch did not complete within the environment's time limit. Therefore, real browser rendering, service-worker installation, actual offline launch and device-specific accessibility remain unverified. Navigation logic was exercised using a focused Node VM unit test, but this is not a substitute for live-device testing.

## Manual acceptance tests still required

1. On a phone, open More and search for `Life OS`, `Knowledge`, `Willie Bag`/`Training`, `Backups`, and `Weekly Review`.
2. Select each result and verify the correct section opens and More remains highlighted for secondary sections.
3. Verify the menu closes after selection, on tapping the backdrop, and on Escape where a keyboard is available.
4. Test Ctrl/Cmd+K on a keyboard-enabled device.
5. Confirm the five-item bar remains reachable above the Android/iOS safe-area inset and does not obscure page controls.
6. Regression-test tasks, planner, notes search, quizzes, training log, Willie Bag speech, Life OS forms, backup export/restore and offline startup.
7. Export a backup before deploying. Verify a v24 backup restores into v26 and that the new version label is present in newly exported backup metadata.

## Data and compatibility

The navigation update does not alter application storage keys or data schemas. The service-worker cache name is bumped to `bridge-protocol-v26-navigation-audit` so the previous app-shell cache is not reused as v26. Backup format remains compatible; new exports identify the app as v26.

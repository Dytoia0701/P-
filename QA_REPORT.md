# QA Report — Bridge Protocol v23 Whole-Life Productivity

## Code audit findings
- v15 was an offline-capable revision app with training schedule, timer, checklist, notes/search, quiz, and macro calculator.
- Existing feature views and localStorage keys were retained.
- Added task and project data under versioned keys `bp_tasks_v1` and `bp_projects_v1`.
- Reworked bottom navigation to support the expanded feature set on small screens.
- Added manual JSON backup/restore and local-data reset controls.

## Automated checks completed
- Embedded application JavaScript extracted to `app.js` and parsed with `node --check`.
- Existing `test-notes.js` parsed with `node --check`.
- Duplicate static HTML IDs checked.
- Subject note topic counts checked against project smoke-test minimums.
- New view IDs and navigation IDs checked for consistency.
- Backup, restore, task/project CRUD, and Command Centre functions checked for presence.
- Service worker cache version checked as `bridge-protocol-v17`.
- ZIP archive integrity checked after packaging.
- Headless Chromium smoke launch attempted against a local HTTP server, but the process timed out before returning a DOM snapshot; runtime browser behaviour is therefore not marked as passed.

## Behaviour to verify manually on a real phone
- Create, edit, complete and delete tasks; test date filters and priorities.
- Verify Planner month navigation, task/project date markers, selected-day items and add-task date prefill.
- Add several habits, mark/unmark historical dates, check streak behavior across missed days, and verify habit history survives backup/restore.
- Create/edit/pause/complete projects and link tasks to them.
- Export a backup, clear test data, restore it, and verify notes/tasks/projects return.
- Check that the previous schedule, timer, checklist, notes search, quizzes and macro calculator still work.
- Install through GitHub Pages and verify offline launch after one successful online load.
- Test browser back behaviour, keyboard visibility, safe areas, and small-screen horizontal navigation.

## Known limitations
- This release is a foundational phase, not the complete personal operating system roadmap.
- No cloud sync, push notifications, calendar integration, or automated rescheduling is included.
- Storage uses browser localStorage, which can be cleared by the user/browser and has finite quota; manual backups are important.
- Full OCR A Biology/Chemistry and Edexcel Maths specification coverage and scientific accuracy remain under separate audit; the app should not yet be treated as the sole revision resource.
- Headless tests cannot substitute for physical-device testing across Android/iOS browsers.


## v17 additions
- Added monthly Planner view using task due dates and project target dates.
- Added Habits view with local daily check-ins, history navigation and streak calculation.
- Static smoke test expanded to cover the new views, functions and habit persistence key.
- Browser/mobile interaction testing remains a manual requirement; static checks do not prove layout behavior on a real phone.


## v18 audit pack update
- Added `SPECIFICATION_AUDIT.md` with current official source references, version caveats, first-pass subject findings and an ordered audit plan.
- Added `TOPIC_COVERAGE_MATRIX.csv` containing all existing topic groups and their first-pass mapping. This is not line-by-line certification.
- Runtime app code is unchanged from v17; prior runtime-testing limitations still apply.


## Content expansion pass (16 October 2026)
- Added 4 Biology and 4 Chemistry A* gap-fill topic groups to deployed notes data.
- Synced `app.js` and `test-notes.js` with the updated `index.html` notes/runtime.
- Updated topic coverage matrix to 39 Biology / 38 Chemistry / 25 Maths groups.
- Full specification-point mapping and browser/mobile interaction tests remain outstanding; no audited percentage is claimed yet.


## v19 PMT-informed question/mark-scheme pass
- Added 3 exam-technique notes groups and 30 original PMT-pattern questions (10 per subject).
- Added question-pattern labels and revised test-section guidance to explain the limits of keyword marking.
- PMT source review log: `PMT_QUESTION_MARK_SCHEME_AUDIT.md`.
- Static checks and browser-level interaction tests must be run before claiming full QA.


## v19 static verification results
- `qa-smoke-test.py`: PASS after updating checks for the v19 cache and the new PMT-informed bank.
- `node --check app.js`: PASS.
- `node --check test-notes.js`: PASS.
- Current question bank: 191 original/curated app questions; 30 new PMT-pattern questions (10 per subject).
- Topic groups indexed by static smoke test: 40 Biology, 39 Chemistry, 26 Maths. These are topic-group counts, not proof of full specification coverage.
- Browser/mobile interaction testing remains unverified; the automated smoke test is static.


## v20 Save My Exams supplementary notes
- Added 6 notes groups (2 per subject) with topic-level revision notes and cross-reference links.
- Content is newly written; the public topic outlines were used as a coverage/navigation reference, not copied verbatim.
- Static syntax and smoke tests must be rerun after packaging. Browser/mobile interactions remain unverified.


## v20 static verification
- Added Save My Exams supplementary revision-note groups and clickable source cross-references.
- Current topic-group counts: 39 Chemistry, 40 Biology, 26 Maths (counts are note cards, not verified specification coverage).
- `qa-smoke-test.py`, `node --check app.js`, and `node --check test-notes.js` passed after the update.
- Real-device/browser interaction testing remains unverified.


## v21 Connected Daily System checks
- Added estimated task effort and compatibility fallback for tasks imported from older backups.
- Added task-linked Focus Mode; session duration uses the selected task estimate and does not auto-complete tasks.
- Added overdue-task suggestions with explicit approve confirmation and persistent dismissal; no date changes occur without approval.
- Added the new local dismissal state to the existing `bp_` backup/export flow and updated restore reload behavior.
- Static smoke tests and JavaScript syntax checks are run before packaging. Browser-driven and real-device tests are still required for final confidence, especially task editing, approval/dismissal persistence, backup round-trips and offline startup.
- Headless Chromium launch was attempted in this environment, but it timed out before returning a DOM snapshot. This is recorded as **not verified**, not as a pass. No physical Android/iOS device test was available in this run.


## v23 whole-life productivity additions
- Added life-area task tags and weekly review persistence. Static/syntax checks should be rerun on the v23 build.
- Manual tests still required: edit an old untagged task, classify quick-captured tasks, save/reload weekly reflections, export/restore a backup containing weekly review data, and verify offline launch on a real device.


## v23 re-check (2026-10-17)
- Static smoke suite: PASS (topic arrays detected: Biology 40, Chemistry 39, Maths 26).
- JavaScript syntax checks: PASS for embedded runtime and `app.js` mirror.
- Duplicate HTML IDs: none.
- ZIP integrity: verified after packaging.
- Chromium headless page-dump attempt did not complete within the available execution window; no successful full browser interaction test is claimed. Real phone and offline installation tests remain outstanding.


## v23 Training Lab additions
- Training Lab navigation and section added.
- Local workout log key `bp_workoutLog_v1` included by generic `bp_` backup export/import and reset handling.
- Willie Bag interactive SVG target diagram, 1–8 random calls, speech synthesis with visible fallback, configurable interval/count and stance-aware legend added.
- General strength/hypertrophy/power template and boxing-specific programming notes added with cited evidence in README.
- Run `python3 qa-smoke-test.py` and manual browser/device checks before release.


### Release metadata
- Backup metadata label updated to v23.
- Backup and reset descriptions explicitly include workout history.
- Static smoke checks and Node syntax checks passed after the final edits.
- Headless Chromium snapshot attempt timed out in this environment; no claim of full browser interaction or real-device verification is made.


## v23.1 audit fixes and re-test (2026-10-17)
- Fixed the literal, unexpanded Python template expression in the Willie Bag selector grid; all eight buttons are now real markup.
- Added workout log normalisation at load and backup import to reject malformed record shapes, replace unsafe IDs, bound fields and cap log size.
- Fixed QA script ordering so workout/Willie checks are included in the pass/fail result; added `qa-workout-unit-test.js` against the actual normalizer.
- `python qa-smoke-test.py`, Node syntax checks, workout normalisation unit tests, HTML structure/ID checks, and inline handler reference scan passed.
- Full browser/device tests are **not verified**: Chromium navigation was blocked by the environment. See `FULL_BUG_AUDIT.md` for detailed findings and remaining manual tests.

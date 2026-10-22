# Bridge Protocol v26 — Performance and Regression QA

## Changes

- Lazy-built, cached search index for static Biology, Chemistry and Maths notes. Static note titles, section headings and points are lowercased once, rather than repeatedly on every keystroke.
- 90 ms debounce for the global notes search input. Direct calls to `searchAllNotes()` remain immediate, including clear/reset paths.
- Removed backdrop blur from the sticky header and fixed bottom navigation, replacing translucent surfaces with opaque dark backgrounds to reduce mobile GPU compositing work while scrolling.
- Bumped app title, backup metadata and service-worker cache to v26. No local-storage keys or data schemas were changed.

## Automated checks

- `node --check app.js` — PASS
- `node --check test-notes.js` — PASS
- `node --check qa-workout-unit-test.js` — PASS
- `node --check qa-lifeos-unit-test.js` — PASS
- `node --check qa-navigation-unit-test.js` — PASS
- `node --check service-worker.js` — PASS
- `node qa-workout-unit-test.js` — PASS
- `node qa-lifeos-unit-test.js` — PASS
- `node qa-navigation-unit-test.js` — PASS
- `python qa-smoke-test.py` — PASS; 39 Chemistry, 40 Biology and 26 Maths topic entries detected
- Inline JavaScript exactly matches `app.js` — PASS
- Duplicate HTML IDs — none detected
- Manifest JSON and service-worker shell assets — PASS
- Performance hooks present; fixed-surface backdrop blur absent — PASS

## What is not yet measured

A reliable browser trace and real-phone benchmark were not available in this run. The changes target identified sources of repeated work, but this QA does not claim a measured percentage improvement or certify that all lag is eliminated. Live testing should compare startup time, typing latency in global notes search, scrolling with the bottom bar visible, and transitions between high-content sections on the target phone.

## Suggested device acceptance test

1. Install/update v26 and open it once online so the new service-worker shell is cached.
2. Search a common term such as `energy`, then a rarer term, and confirm results update promptly and still identify subject/section.
3. Edit/add/delete a custom note and confirm global search reflects the changes immediately.
4. Scroll a long expanded notes topic with the bottom navigation visible.
5. Navigate repeatedly between Home, Notes, Life OS and Training; check for delayed taps, frozen frames or lost state.
6. Export a backup before update and verify v26 can restore it.

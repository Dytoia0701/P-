# Bridge Protocol v27 — Release QA

## Scope
Added universal local search to the existing v26 performance build. No new local-storage keys or backup schema changes. Existing app modules, offline-first architecture and manual backup flow are retained.

## User-facing change
- Open **More → Search all**, or press **Ctrl/⌘ + Shift + F**.
- Search revision topic and section content, custom notes, tasks, projects, habits, training log, Life OS quick captures, reading/resources, routines, meals, finance entries, decision journal, exam-practice questions, checklist items and weekly schedule templates.
- Results identify the source section. Revision-note results open the corresponding topic/section; exam-practice results open the selected question.
- Search is local-only and does not require a network connection.

## Automated checks
- `node --check app.js` — PASS
- `node --check service-worker.js` — PASS
- `node qa-navigation-unit-test.js` — PASS
- `node qa-workout-unit-test.js` — PASS
- `node qa-lifeos-unit-test.js` — PASS
- `python qa-smoke-test.py` — PASS; Chemistry 39, Biology 40, Maths 26 topic records detected
- HTML parser — PASS
- Duplicate HTML IDs — none detected
- `app.js` exactly matches the inline JavaScript in `index.html` — PASS
- `manifest.json` parses — PASS
- Service worker cache name is `bridge-protocol-v27-universal-search` — PASS
- `unzip -t` on the packaged ZIP — PASS; no archive errors

## Limitations / manual acceptance required
Chromium headless rendering did not complete within the 30-second test window in this environment, so browser-rendered interaction, Android layout, keyboard focus, service-worker installation and a true offline relaunch are **not verified**. Before relying on the release, open the ZIP on a local static server or deploy it to GitHub Pages, then test search and existing workflows on the phone. Export a backup before replacing the currently deployed build.

# Bridge Protocol v32 — Easier navigation + 9 new features

## Navigation (the "clunky" fix)
- **Five areas in the bottom bar:** Home · Plan · Study · Train · More. Study (notes, flashcards, quiz, exams) is now one tap away; before, it was buried in the More menu.
- **Section tabs under the header** for the area you are in (e.g. Notes · Flashcards · Quiz · Exams & papers). Switching between related sections is one tap.
- **Each area remembers where you were.** Tapping the area you are already in jumps to its first section.
- **Android back gesture works:** it steps back through the sections you visited, and closes the search or section menu instead of leaving the app. Reopening a link like `#/progress` goes straight there.
- **Search is always in the header.** The More menu lists every section, grouped by area, with a filter box.
- Slimmer header. Fixed: "Checklist" was filed under Study as "Coverage tracking" — it is the tendon-safety check, now under Train.

## New features
1. **Editable week plan** (Plan → Week plan): edit any day's training or study block, reset to the original. The Coach plans from your edited version.
2. **Morning check-in** (Today): sleep, energy, soreness in ~10 seconds. A low score makes the Coach lighten training automatically.
3. **Flashcards** (Study → Flashcards): 514 cards built from your notes, spaced repetition (Again/Hard/Good/Easy), 15 new cards a day, most-missed list. Due cards show up in the Coach.
4. **Progress** (Train → Progress): estimated 1-rep-max and RPE charts per exercise, stalled-lift alerts (no new best in 3 weeks), 14-day sleep chart. Charts have tap tooltips and a "show as table" view.
5. **Past papers** (Study → Exams & papers): log marks and weak spots, see % and a trend line.
6. **Calendar export**: one button (Exams & papers, or Calendar) downloads an `.ics` file of upcoming exams and task deadlines, with reminders. Open it and choose **Samsung Calendar**. (Google Calendar's phone app can't import .ics files; on a computer use calendar.google.com → Settings → Import.) Re-exporting updates the same events.
7. **Bodyweight log** (Train → Body & food): 7-day average, week-on-week change, optional weight-class target with the weekly rate required. Warns if loss is faster than ~1% of bodyweight a week.
8. **Light mode and larger text** (More → Settings → Appearance): Dark / Light / Match phone; Normal / Large / Extra large.
9. **Single source of code**: `index.html` now loads `data.js` (notes + questions) and `app.js` (code) instead of embedding a copy. The stale `test-notes.js` mirror is removed. The service worker caches all three files.

## Not done as described
- **"Load the notes only when opened"**: notes are now in their own file (`data.js`), cached separately by the service worker (cache `bridge-protocol-v32-1`), so a code update does not re-download them. True on-demand loading was not done: flashcards, search, the Coach and exam pace all need the notes at start-up, and the whole app still loads in ~0.4 s, so it would add complexity for no visible gain.

## Storage
New keys (in backups, validated on restore, cleared by reset): `bp_schedule_v1`, `bp_checkins_v1`, `bp_flashcards_v1`, `bp_papers_v1`, `bp_bodyweight_v1`, `bp_appearance_v1`. No existing data changes shape.

## Independent code review (fixed before release)
A separate reviewer read and ran the new code. Findings, all fixed and covered by tests:
- Chart tooltips vanished when the finger lifted on a phone → they now stay until you tap elsewhere.
- At Large/Extra-large text, tooltips were misplaced and could make the page scroll sideways → positioned in unzoomed pixels and kept inside the chart.
- Clearing the weight-class target saved a 25 kg target → clearing now removes it.
- A past paper with blank marks saved as 0% → now rejected.
- Reps like "3x5", "3 min" or "AMRAP" gave wrong strength estimates → only real rep counts are used (3x5 → 5 reps, 8-10 → 8).
- Some axis labels were mis-rounded (80.25 shown as 80.3) → decimals follow the step.
- A very fast double tap in the menu could drop the navigation → guarded.
- The flashcard Start button could overstate the session size → matches the 60-card cap.
- Also fixed during development: .ics lines folded by bytes (not characters), and impossible weights (e.g. 999 kg) are rejected instead of clamped.

## Tests
- `qa-regression-v32.js` — new features and every review finding (86 checks, real browser, including a touch-screen phone profile).
- `qa-navigation-unit-test.js` — rewritten to run in a real browser; keeps every original check and adds hubs, tabs, back gesture, overlays, deep links.
- v29, v30, v31 suites, unit tests and `qa-smoke-test.py` all pass (selectors/version strings updated where the layout moved).
- Automated contrast audit of every visible text element in all 19 sections, dark and light: no text below 3:1.
- Offline reload over HTTP with the service worker: PASS.

## Not verified
On-device behaviour on a Galaxy A54: the back gesture in the installed app, .ics import into Samsung Calendar, text zoom, light mode in sunlight.

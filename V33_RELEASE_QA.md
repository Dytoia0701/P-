# Bridge Protocol v33 — Spec checklists, study tracking, mistake book, boxing tools

## New
1. **One-tap workout logging** (Train → Training, top card): today's planned exercises are parsed into rows (e.g. "Back Squat 4x5" → 4 sets × 5), your last weight pre-fills, untick what you skipped, add kg/RPE, save. Pick another day from the dropdown if needed.
2. **Study time tracking** (Train → Timer): choose subject and topic, start a study session. It is logged when the timer finishes, or when you reset after 5+ minutes; boxing presets don't count. Add untimed study by hand. Weekly hours per subject show on the Timer and Weekly review; the Coach flags a neglected subject.
3. **Mistake book** (Study → Mistakes): quiz mark points you miss, flashcards you mark "Again" and blurt points you forget are collected automatically. "Practise" reopens the exact question/card/notes. Each clears after two correct goes in a row.
4. **Blurting** (Study → Blurt): pick a topic, write everything you remember, and it is marked against the note points by key terms (a guide, not an examiner). Missed points can go to the mistake book; best/last scores are kept per topic.
5. **Spec checklists** (Study → Spec checklist): red/amber/green confidence for every learning outcome — see sources below. 🔎 searches your notes for that point. Red points for your next exam's subject feed the Coach.
6. **Combo caller** (Train → Timer → Boxing rounds): tick "Call combos during rounds" — combos are spoken (and shown large) at Steady/Sharp/Fast pace, only during rounds, never in the last 3 s.
7. **Fight camp** (Train → Fight camp): fight date, weigh-in, weight limit → countdown, current phase (Base / Build / Peak / Taper / Fight week), and the weekly rate needed to make weight from your bodyweight log, with a warning above ~1% a week and a note against dehydration cutting. One tap sets it as your bodyweight target. The Coach mentions the camp.
8. **Home-screen shortcuts**: long-press the app icon → Check in, Rounds, Flashcards, Coach.
9. **Share backup** (More → Settings): sends the backup file through Android's share sheet (Drive, WhatsApp, email…). Falls back to a download where sharing isn't supported.
10. **Swipe** left/right on a page to move between its section tabs (ignored on sliders, tab strips, charts and text boxes).
11. **Weekly report** (Home → Weekly review): one-page summary of study time, tasks, quiz, flashcards, papers, spec progress, mistakes, training, sleep, weight, camp and next exam. Share as text or Save as PDF.

## Spec checklist sources
Points are short paraphrases of the official learning outcomes, not the exam boards' exact wording.
- **Biology — OCR A H420:** 244 outcomes from OCR's specification v2.7 (Feb 2024). ocr.org.uk was under maintenance for the current v3.x; OCR's change notices say v3 changed wording only (no outcomes added or removed) in 2.1.2(i)(q), 2.1.6(k)(l) and 4.1.1(a).
- **Chemistry — OCR A H432:** 291 outcomes. Modules 1 to 5.3.1 (243) from OCR's current specification v3.1 (May 2026). The PDF reader stops before Module 6, so 5.3.2 and Module 6 (48 outcomes) were paraphrased from a school site that quotes the H432 statements; their counts match OCR's own mapping guide, but check their wording against your copy of the spec.
- **Maths — Pearson Edexcel 9MA0:** 89 content statements from Specification Issue 4 (Feb 2020).

## Fixed
- Section tabs could leave the active tab scrolled out of sight after switching areas.
- A task with a very long title stretched the Focus "Session objective" dropdown and made the page scroll sideways (found by the monkey test; present since v28).
- When browser storage is full, every save now shows one clear warning. Before, flashcard, spec, quiz and some other saves failed silently.

## Independent code review (all fixed, all covered by tests)
- **High:** if the app stayed open past midnight, the quick log kept yesterday's exercises and could save them under the wrong session. It now rebuilds for the new day and refuses a stale save.
- Starting another timer mid-study-session threw away the minutes already done. They are now logged if the session ran 5+ minutes.
- Android only shares certain file types, so "Share backup" would always fall back to a download. It now shares a `.txt` file (JSON inside); Restore accepts it.
- Blurt mistakes never cleared. Recalling a point now counts towards clearing it.
- With over 600 mistakes, the newest were dropped. Now the oldest go.
- Printing the weekly report produced blank pages. Only the report is laid out now.
- The previous blurt answer carried into the next topic. It is now cleared.
- Fight camp called an old weigh-in a "7-day average". It now uses the last 7 days and says when weigh-ins are stale; so does Body & food.

## Storage
New keys (in backups, validated on restore, cleared by reset): `bp_studyLog_v1`, `bp_mistakes_v1`, `bp_blurt_v1`, `bp_specRag_v1`, `bp_camp_v1`. Timer settings gain `combos`/`comboPace`; flashcard state gains a daily review count. New file `specs.js` (cached offline).

## Tests
- `qa-regression-v33.js`: 83 checks in a real browser, including fake-clock timer tests, touch swipes, midnight roll-over and full-storage behaviour.
- `qa-monkey-test.js` (new): random taps, typing (including hostile input such as huge numbers, emoji and HTML) and selections across every section. Final run: 12,000 actions in 6 sessions, no errors, crashes, XSS or sideways scrolling.
- Stress: a year of heavy data (1,000 workouts, 2,500 study sessions, 365 check-ins, every spec point rated, 400 tasks) reloads in 0.15 s, with every section opening in under 50 ms. 2,400 section switches showed no memory or DOM leak. Offline reload over HTTP: PASS.
- v29–v32 suites, navigation test, unit tests and `qa-smoke-test.py` pass.
- Contrast audit of all 23 sections in dark and light: no text below 3:1.

## Not verified
On a real Galaxy A54: spoken combos over the bell, the Android share sheet, home-screen shortcuts, swipe feel.

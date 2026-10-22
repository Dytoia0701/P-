# Bridge Protocol v38 — Music: YouTube Music playlists (on top of v37 performance, v36 question bank and v28 notes)

See `V29`–`V38_RELEASE_QA.md` and `COVERAGE_REPORT.md`. Verify with `node qa-regression-v38.js .` (and `-v29` to `-v37`, `qa-monkey-test.js`, `qa-navigation-unit-test.js`, `python3 qa-smoke-test.py`); the browser tests need Node + Playwright.

**Files (v32+):** `index.html` (markup + CSS), `app.js` (all code — the single source), `data.js` (notes and questions), `specs.js` (exam-spec checklists), `service-worker.js`, `manifest.json`, icons. Upload all of them when deploying.


Bridge Protocol is an offline-first personal operating system PWA. It preserves the existing training schedule, round/focus timer, tendon-safety checklist, A-level notes and global notes search, question practice, and macro calculator while adding a personal task/project layer.

## Historical v23.1 audit fixes
- Fixed an unexpanded Python template placeholder that prevented the manual Willie Bag number-selector buttons 1–8 from rendering. The SVG targets remain available as well.
- Added workout-log normalization for existing local records and imported backups. Invalid workout IDs are replaced with safe IDs before they are used in inline handlers; field types and numeric ranges are bounded.
- Fixed the QA smoke-test ordering so all workout and Willie Bag assertions run before the final PASS/FAIL decision. Added workout-normalization unit tests.

## Historical v23 training additions
- Dedicated Training Lab for evidence-informed strength, hypertrophy, explosive power and boxing-specific strength and conditioning.
- Workout log stores exercise/drill, date, session, sets/rounds, reps/duration, optional load, RPE and notes locally under `bp_workoutLog_v1`; the existing generic backup exporter includes it automatically.
- Willie Bag drill with the historical Cus D’Amato 1–8 mapping, interactive numbered target diagram, manual random calls, spoken auto-calls, adjustable interval and drill length, and orthodox/southpaw hand labels. Speech output gracefully falls back to visible cues if the browser speech engine is unavailable.
- Existing local-storage keys and app sections are preserved; service-worker cache bumped to `bridge-protocol-v29-hardening`.

## Evidence basis and limits
- ACSM 2026 overview of reviews: https://pmc.ncbi.nlm.nih.gov/articles/PMC12965823/
- Review of strength and punch impact force: https://pubmed.ncbi.nlm.nih.gov/35836314/
- Boxing strength-training scoping review (notes low/very-low certainty): https://www.mdpi.com/2076-3417/14/21/9706
- Historical Willie Bag numbering overview/product guide: https://www.opentip.com/TITLE-Boxing-CUS-D-Amato-Willie-Heavy-Bag-p-14334563

The training template is a practical starting point, not a universally optimal prescription. Boxing-specific research is less certain than general resistance-training evidence. Adjust volume to current boxing load, training experience, recovery, and coaching advice.

## What's new in v19 PMT-informed pack
- Tactical, minimalist dark visual system with compact information cards and horizontally scrollable mobile navigation.
- **Command Centre** with daily brief, task metrics, overdue count, priority queue, active projects and quick capture.
- **Task manager** with due dates, priority, status, optional project association, notes, filters, completion and deletion.
- **Projects & goals** with target dates, status, outcome description and linked-task completion progress.
- **System & backups** to export/import a JSON backup, view approximate local-storage usage, and reset local app data with two confirmations.
- Defensive JSON reads for saved preferences so a malformed stored value is less likely to prevent app startup.
- Backup import checks the archive shape and normalises task/project records before restoring them.
- Service-worker cache bumped to `bridge-protocol-v29-hardening`.

- **Planner** with a monthly calendar showing task deadlines and project target dates; selecting a date reveals its linked items and lets you start a task for that date.
- **Habit tracker** with dated check-ins, historical browsing, consecutive-day streaks and daily completion metrics. Habit history is stored locally and included in JSON backups.

## Storage and privacy
- Tasks, projects, settings and custom notes are saved locally in the browser using `localStorage`.
- No account, server or cloud sync is required.
- Data is not automatically shared across devices. Use **System → Export backup** to make a portable JSON backup, and keep that file somewhere safe.
- Clearing browser/site data may erase the local copy. Export backups regularly.
- Restore replaces matching Bridge Protocol keys included in the backup. Export the current state first if you need a rollback point.

## Deploy on GitHub Pages
1. Extract the ZIP.
2. Upload the **contents** of the folder to the repository root, including `index.html`, `app.js`, `data.js`, `specs.js`, `manifest.json`, `service-worker.js`, and both icons.
3. Enable GitHub Pages for the desired branch and `/ (root)`.
4. Open the HTTPS Pages URL on your phone.
5. If an older version remains cached, close installed app tabs and reload the site; the service-worker cache name is now `bridge-protocol-v29-hardening`.

## Run locally
From this folder run:

```sh
python3 -m http.server 8000
```

Then open `http://localhost:8000`. Service workers require localhost or HTTPS; opening `index.html` directly with `file://` does not enable PWA installation/offline caching.

## Files
- `index.html` — markup and styles; loads `data.js` then `app.js`.
- `app.js` — all application code (single source of truth since v32).
- `data.js` — revision notes (NOTES) and practice questions (QUESTIONS).
- `specs.js` — specification checklists (SPECS): paraphrased OCR H420/H432 and Edexcel 9MA0 learning outcomes.
- `manifest.json`, icons, and `service-worker.js` — PWA installation and offline shell.
- `qa-smoke-test.py` — repeatable static checks.
- `SPECIFICATION_AUDIT.md` — known exam-specification coverage limitations.
- `QA_REPORT.md` — checks run and remaining manual tests.


## Specification audit pack (baseline v18; updated for v19)
- `SPECIFICATION_AUDIT.md` records the audit baseline, source versions, first-pass findings and next steps.
- `BIOLOGY_OBJECTIVE_TRACKER.csv` extracts 207 objective rows from the uploaded Biology checklist for note-level mapping. All remain unverified until matched to actual note content.
- `TOPIC_COVERAGE_MATRIX.csv` indexes all existing topic groups. “Not yet verified” is intentional until each numbered specification statement is checked against actual note content.
- Eight new specification-focused Biology/Chemistry gap-fill topic groups have been added to the deployed notes data. Existing app features and storage keys were left in place; app.js and test-notes.js mirrors are synchronised with index.html.


## v19 PMT-informed exam practice
- The Test section now includes 30 original practice questions based on recurring PMT question/mark-scheme patterns.
- Each new question indicates the type of exam pattern it targets. The notes include a practical/calculation/mark-scheme technique section per subject.
- See `PMT_QUESTION_MARK_SCHEME_AUDIT.md` for reviewed source pages, scope and limitations.
- `SAVEMYEXAMS_NOTES_AUDIT.md` for supplementary note sources and limitations.
- Automated keyword marking is formative; use the model answer and mark points to self-check.


## v20 Save My Exams supplementary notes
- Added six additional notes groups: two each for OCR A Biology H420, OCR A Chemistry H432 and Edexcel Mathematics 9MA0.
- Content is a concise, original synthesis of publicly visible Save My Exams topic outlines plus standard syllabus-level explanations; it is not a reproduction of the site's full paid notes.
- The notes include direct cross-reference URLs so the user can open the corresponding topic resources. Save My Exams pages may require an account or subscription for full note/PDF access.
- Biology source index: https://www.savemyexams.com/a-level/biology/ocr/17/revision-notes/
- Chemistry source index: https://www.savemyexams.com/a-level/chemistry/ocr/17/revision-notes/
- Maths Pure: https://www.savemyexams.com/a-level/maths/edexcel/18/pure/revision-notes/
- Maths Statistics: https://www.savemyexams.com/a-level/maths/edexcel/18/statistics/revision-notes/
- The revision-note outlines are cross-references, not proof of full specification coverage; all topics still require current-spec verification.


## v21 Connected Daily System
- Added task effort estimates (5–480 minutes, rounded to five-minute increments). Existing tasks and older backups default to 25 minutes when no estimate exists.
- Focus Mode can launch a timer using the selected open task's estimate. Starting or finishing a timer does not change task status automatically. Standalone focus sessions and existing boxing/rest presets remain available.
- Command Centre now proposes a reviewable change for overdue tasks (move the due date to today). Applying it requires an explicit confirmation; dismissals are saved locally and can be superseded if the task's due date changes. No task is rescheduled silently.
- New fields and suggestion dismissals remain in local storage and are included in the existing `bp_` JSON backup mechanism. Import normalization retains task effort estimates while keeping old backups compatible.
- Existing training schedule, timer, tendon-safety checklist, notes/global search, quizzes, macro calculator, tasks, projects, planner, habits and manual backup/restore are retained.
- QA checks include JavaScript syntax, duplicate IDs, feature/navigation presence, offline cache version and archive integrity. Real-phone interaction and offline-install verification remain manual tests; this release is not claimed to have passed those tests.


## v22 Whole-Life Productivity
- Added task life-area tagging (personal, study/learning, work/career, health/fitness, home/errands, relationships, finance, life admin, other) to task entry and quick capture. Existing tasks and older backups default to Personal; existing task IDs and fields are retained.
- Command Centre shows a lightweight view of open tasks by the life areas actually in use. The weekly review displays all areas without assuming that every area must have a task.
- Added Weekly Review with local reflections (wins, friction, next-week focus and a possible change), a workload summary, life-area overview and review prompts. Review notes are stored under `bp_weeklyReview_v1` and included in the existing manual JSON backup/export mechanism.
- Suggestions are descriptive only. They never change due dates, tasks, habits or schedules; any existing overdue rescheduling still requires explicit approval.
- Preserved the prior training schedule, focus timer, checklist, notes/global search, quizzes, macro calculator, projects, planner, habits and local storage keys.
- Automated static checks do not replace browser/device testing. Verify life-area editing, weekly review persistence, export/restore and offline launch on the target phone before relying on the release.


## v26 Whole-Life OS expansion
- Added a connected Life OS view: quick-capture inbox with task conversion, task-capacity estimate, approval-required task due-date changes, manual GBP finance ledger and savings target, meal calories/protein log, recurring routine check-ins, reading/resource library, decision journal, cross-module descriptive analytics, local change history and offline/storage diagnostics.
- Life OS data uses versioned `bp_life*` localStorage keys and is included in the existing manual JSON backup mechanism. No cloud sync or automatic plan changes were introduced.
- Due-date edits show a before/after confirmation and are recorded in the local history. Finance, nutrition and training metrics are user-entered estimates, not bank data or medical advice.
- This build preserves existing sections and uses the existing local-first PWA architecture. Full real-device/browser regression testing is still required.


## v26 navigation update
Primary navigation is reduced to Home, Tasks, Planner, Train and More. More opens a searchable, grouped section menu; Ctrl/Cmd+K opens it where keyboard shortcuts are available.


## v26 navigation and regression testing
The mobile bottom bar now prioritises Home, Tasks, Planner, Training and More. More opens a searchable menu grouped by workflow. See `V26_RELEASE_QA.md` for automated results and device acceptance tests.


## v26 performance pass

See `PERFORMANCE_AUDIT.md` and `V26_PERFORMANCE_QA.md` for search indexing/debouncing, reduced fixed-surface compositing, and validation scope.


## v27 universal search
- Added a global search modal reachable from More → Search all, or Ctrl/⌘ + Shift + F.
- Searches revision topic/section text, custom notes, tasks, projects, habits, workout log entries, Life OS captures, reading/resources, routines, meals, finance records and decision journal entries.
- Results are grouped by source and open the relevant app section; revision-note results open the matched topic/section. Search runs locally and does not require network access.
- Existing storage keys and backup format are unchanged. Service-worker cache version is `bridge-protocol-v28-biology-chemistry-notes`.
- Automated static and regression tests passed. Actual Android browser/device interaction and offline-install testing still require manual verification.


## v28 Biology and Chemistry content expansion
- Added 17 new OCR A H420 Biology topic notes covering membranes, DNA/protein synthesis, enzymes, cell division, exchange surfaces, mammalian and plant transport, immunity, photosynthesis, respiration, homeostasis/kidneys, neuronal and hormonal communication, inheritance, evolution, gene technology and ecology.
- Added 13 new OCR A H432 Chemistry topic notes covering atomic structure/mass spectrometry, quantitative chemistry/titrations, bonding, enthalpy, kinetics, equilibrium, acids/buffers, entropy, redox/electrode potentials, organic mechanisms, carbonyls, aromatic chemistry and analytical spectroscopy.
- Notes include key definitions, equations, worked calculations, practical methods/evaluation, common misconceptions and original exam-style mark points.
- Topic records are not a certification of complete specification coverage. The content still needs a line-by-line audit against the current official specifications, particularly exact required practical wording and any course-specific teacher emphasis.
- Official specification references: Biology A H420 https://www.ocr.org.uk/Images/687834-download-a-level-specification.pdf ; Chemistry A H432 https://www.ocr.org.uk/Images/171720-specification-accredited-a-level-gce-chemistry-a-h432.pdf .

After editing `data.js` or `specs.js`, run `python3 update-data-hash.py` so phones download the new data (app-code updates no longer re-download it).

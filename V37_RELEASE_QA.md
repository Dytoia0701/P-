# Bridge Protocol v37: performance

No features changed. Every change below makes the app start faster, scroll more smoothly or use less mobile data, and each has a test.

## Changes
1. **Date formatting was the biggest hidden cost.** Every task card, exam and calendar label created a new date formatter, which costs about 0.5 ms each on a phone. The app now keeps one formatter per format. The text is identical (tested against the old method). "Today" is also worked out once per second instead of thousands of times while sorting tasks.
2. **Start-up does less.** The home screen was drawn twice at start-up; now it's drawn once. Notes (about 90 topics), the Quiz and the Checklist are drawn the first time you open them instead of at every launch. An invalid saved notes subject is still corrected at start-up.
3. **Opening a note topic redraws only that card**, instead of the whole list of 80–90 topics, so the page no longer jumps.
4. **Off-screen list items are skipped** (`content-visibility: auto`) for task cards, note cards, spec-checklist rows and search results. The browser only lays out what's on screen. Jumping to a note section near the end of Notes still lands on it (tested).
5. **The search index is built just after search opens**, in a spare moment, so the first letter you type isn't delayed. It's reused until search closes.
6. **App updates no longer re-download your notes and questions.** The offline cache is now split in two:
   - `bridge-protocol-v37` holds the app code, about 0.4 MB.
   - `bridge-data-<fingerprint>` holds `data.js` and `specs.js`, about 2.5 MB.

   The data cache's name is a fingerprint of those files, so a code-only update keeps it and downloads only the code. After editing `data.js` or `specs.js`, run `python3 update-data-hash.py` so phones fetch the new data once. A test fails if you forget.
   - The first update from v36 to v37 still downloads the data once, because v36 kept everything in one cache.

## Measured (Chromium, CPU slowed 4× to approximate a phone, 6 months of saved data)
| | v36 | v37 |
|---|---|---|
| Page ready (DOMContentLoaded), median of 7 | 538 ms | 459 ms |
| App start-up script | 184 ms | 147 ms |
| Open Tasks (150 tasks) | 141 ms | 32 ms |
| Open home screen | 86 ms | 47 ms |
| Build 150 task cards (script only) | 106 ms | 2 ms |
| Open Notes | 56 ms | 38 ms |
| App update download (code-only release) | ~2.9 MB | ~0.4 MB |

Tried and rejected: storing the notes and questions as JSON strings for faster parsing. It saved only about 14 ms and used 5 MB more memory.

## Tests
| Check | Result |
|---|---|
| `qa-regression-v37.js` (18 checks): separate data cache and fingerprint, an update keeps the data cache and doesn't re-download `data.js`, offline after update, lazy screens (including opening straight into `#/notes` and `#/test`), single-card note toggle, "Mark as revised", jump-to-section with skipped layout, identical date text, task-card speed, search index ready before typing | pass |
| v29–v36 suites, navigation, workout and Life OS unit tests, smoke test | pass |
| Random-tap test (4,500 actions) | no errors |
| Contrast audit, dark and light | 0 issues |
| Offline reload over HTTP | pass |

**Test updates:**
- v29's notes check now opens Notes before counting topics, because Notes are drawn on first open.
- v31's Smart-mode check now compares against the baseline instead of a fixed 15%. With v36's larger question bank (about 50 Chemistry topics), the expected rate for the weakest topic is about 13%, so the fixed cutoff passed only by luck.

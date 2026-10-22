# Bridge Protocol v35: every spec point covered by the notes

## What changed
- **269 new note sections**: one for every specification point that v34 found partly covered (225) or missing (44).
  - Biology: 115 sections in 29 topics.
  - Chemistry: 90 sections in 29 topics.
  - Maths: 64 sections in 18 topics.
- **Notes coverage is now 100%**: Biology 244/244, Chemistry 291/291, Maths 89/89.
- **Where to find them:** Notes → the "Spec completion notes" group at the end of each subject. Each topic is named after its spec topic, e.g. "Spec completion — 2.1.4 Enzymes" or "Spec completion — Statistics: Topic 4 …". Each section heading starts with its spec code.
- **Spec checklist:** every point now links to its new note. The summary says how many points were filled in v35. The "only points your notes miss" filter is hidden while there are no gaps.
- **Flashcards, search, blurt and revision progress include the new sections.**
  - Flashcards: 269 new cards, still limited to 15 new cards a day.
  - Revision progress: there are 76 more topics to mark as revised, so the remaining count and exam pace go up.
- The new topics are plain notes, so their last section is not styled as an "A* tips" block.

## How the notes were made
1. **Writing:** each spec point was written up from the official spec wording and what the old notes lacked. Sections have 3–9 bullets, with worked examples where useful. Every number in a worked example was recalculated in Python.
2. **Fact-checking:** a separate reviewer checked every section against the spec point and standard A-level content.
   - Results: 211 passed as written and 58 were corrected (Biology 14, Chemistry 17, Maths 27). Most Maths corrections removed claims about the formula booklet that couldn't be verified.
   - Example corrections: atrial vs ventricular fibrillation on an ECG; the order of steps in DNA extraction; haemodialysis access via an arm fistula; what clinostat seedlings do; the time interval in a trig modelling example; the arcsin derivative labelled as Further Maths.
3. **Final review:** I reviewed the flagged sections myself.
   - The TLC stationary phase was changed to "silica gel or alumina".
   - The remaining formula-booklet claims in Statistics and Mechanics were reworded as "learn this".

`COVERAGE_REPORT.md` lists every filled point, what it was before and where its note is now.

## Caveats
- This is AI-written revision material. It was checked carefully, but check anything surprising against your textbook or teacher.
- The Biology spec is OCR v2.7 (Feb 2024), because the newest version could not be downloaded. The sensitive-area case studies (6.3.2(e)) are kept general.

## Tests
| Check | Result |
|---|---|
| `qa-regression-v35.js` (16 checks): new topics well formed, every point covered and linked, links open the right section, A* styling, flashcards and search include the new sections, revision progress still reaches 100%, checklist summary and filter | pass |
| v29–v34 regression suites, navigation, workout and Life OS unit tests, `qa-smoke-test.py` | all pass |
| v34 suite fixes | it now waits for checklist rows to render (an occasional timing failure, which also happened on v34) and marks one point as a gap to keep testing the filter |
| Random-tap test, 4,500 actions over 3 sessions | no errors |
| Contrast audit, dark and light themes | 0 issues |
| Offline reload through the service worker (cache `bridge-protocol-v35`) | pass |
| Speed with the CPU slowed 4×: load / worst search / heap | 0.34 s (v34: 0.38 s) / ~50 ms / 17 MB (v34: 12 MB) |

`data.js` has grown from 0.63 MB to 1.1 MB. After the first visit it is cached, so it does not re-download until the next update.

## Not verified
On-device feel on the Galaxy A54 with the larger notes file. On the test machine it is no slower.

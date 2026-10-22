# Bridge Protocol v36: exam-style questions for every spec point, A* tips, PMT and Save My Exams links

## What's new
- **621 new exam-style questions with mark-scheme answers.** The bank grows from 194 to 815 questions.

  | Subject | Before | After | Marks added |
  |---|---|---|---|
  | Biology | 82 | 302 | 924 |
  | Chemistry | 88 | 336 | 1,039 |
  | Maths | 24 | 177 | 664 |

  Every one of the 624 spec points now has at least one question. All new questions say which spec points they test.
- **"Practise N questions" on every spec point** (Study → Spec checklist). It opens the Quiz focused on that one point. The focus chip shows "spec point …"; tap ✕ Clear to go back to normal.
- **A\* tips & common mistakes** for all 76 "Spec completion" topics added in v35. Each topic gets 4–6 bullets drawn from mark-scheme patterns.
- **Practise-online links** (these need internet and open in your browser):
  - **Spec checklist, Biology and Chemistry:** each module links to its Physics & Maths Tutor (PMT) page of topic questions, mark schemes and notes, and to its Save My Exams page.
  - **Spec checklist, Maths:** each of the 19 topics links to its PMT page, and Pure, Statistics and Mechanics each link to Save My Exams notes.
  - **Exams & papers:** a new "Real past papers" card links to OCR A Biology and Chemistry Papers 1–3 and Edexcel Maths A-level and AS papers on PMT, all with mark schemes. Do one timed, mark it, and log it below.
- **Smarter auto-marking** (this applies to every question, old and new):
  - **Blocking phrases:** a marking point can list phrases that stop the mark. For example, "insufficient evidence of correlation" no longer scores for "evidence of correlation", and a swapped indicator no longer scores.
  - **Two-part points:** a keyword written as "a && b" needs both parts, for example "octahedral && 6".
  - **Spacing and symbols:** "1 < k < 4" and "1<k<4" mark the same, as do ≤ and <=, π and pi, √ and sqrt, Sₙ and Sn, and "A -> B" and "A->B".
- **Faster search:** the search index is now built once each time you open search, so typing stays fast with the bigger question bank.

## Why the questions are new, not copied
Past-paper questions belong to OCR and Pearson, and Save My Exams' notes are their own paid content, so none of that is copied into the app.

Instead, writers read PMT's topic question papers and mark schemes, about 120 mark schemes across all topics. From them they learned:
- what each spec point is usually asked as
- the command words
- how marks are split
- what wording mark schemes accept or reject

They then wrote new questions with new contexts and numbers. The links above take you to the real papers.

## How the questions were checked
1. **Writing:** 11 blocks, one per group of modules. Every number in every question and model answer was recalculated in Python.
2. **Fact-check:** a separate checker reviewed each block as an examiner would. Of 621 questions, 234 passed as written, 384 were fixed and 3 were replaced.
   - **Science or data errors found and fixed, examples:**
     - a cyanohydrin wrongly called optically active (it forms as a racemate)
     - an energy profile mixing per-mole and per-2-mole values
     - Kc and ionisation-energy data that didn't match real values
     - implausible chromatography Rf values and enzyme-inhibitor data
     - "striated" given as a difference between skeletal and cardiac muscle
     - a micropropagation tip with the hormone order wrong
   - **Most fixes were to the auto-marking keywords:**
     - removing keywords a student could copy straight from the question
     - blocking common wrong answers and misconceptions
     - stopping wrong numbers matching right ones (230 for 23, 1/37 for 1/3)
     - adding the correct phrasings students actually type
3. **Wrong-answer test:** for every question the checker scored one plausible wrong answer and one correct answer in different words. Every wrong answer scored clearly less than the correct one.
4. **Automatic checks** in `qa-regression-v36.js`:
   - every model answer scores full marks with the app's own marker
   - a non-answer scores 0
   - no blocking phrase blocks its own model answer
   - no duplicate questions

## Known limitations
- **Keyword marking is a guide, not an examiner.** Some answers that list several options, or swap two items, can still earn about half marks. A few correct answers in unusual wording may miss a mark. Always compare your answer with the model answer.
- **An unfinished final pass:** it was meant to apply "a && b" pairing to about 12 flagged points where a fully swapped answer still scores about half marks. The weekly usage limit stopped it after 2 fixes.
- **Formula booklet:** the Maths questions and tips never claim what is or isn't in the formula booklet.
- **Larger download:** `data.js` is now 2.3 MB, up from 1.1 MB. It is cached after the first load. On a 4× slowed CPU, load time is 0.5 s (v35: 0.34 s).

## Tests
| Check | Result |
|---|---|
| `qa-regression-v36.js` (21 checks): question bank, spec coverage, marker rules, blocking and two-part keywords, symbol handling, A* tips, Practise-a-spec-point flow, links | pass |
| v29–v35 regression suites, navigation, workout and Life OS unit tests, smoke test | pass |
| v35 suite updated so its section counts exclude the A* tips sections | pass |
| Random-tap test (6,500 actions, 5 sessions) | no errors |
| Contrast audit, dark and light | 0 issues |
| Offline reload through the service worker (cache `bridge-protocol-v36`) | pass |

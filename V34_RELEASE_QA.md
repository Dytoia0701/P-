# Bridge Protocol v34 — Notes coverage check

## New
- **Notes coverage in the Spec checklist** (Study → Spec checklist). Every one of the 624 spec points now shows whether your notes cover it — ✓ covered, ½ partly, ✗ missing — with a short note of what is missing and buttons that open the exact note section. A "YOUR NOTES COVER" bar summarises each subject, and "Only points your notes miss or only partly cover" filters to the gaps.
- **COVERAGE_REPORT.md**: the same results as a document. It has a summary table, the biggest gaps per subject, and every partly-covered or missing point listed by module.

## Results
| Subject | Points | Fully covered | Partly | Missing |
|---|---|---|---|---|
| Biology (OCR H420) | 244 | 129 (53%) | 95 | 20 |
| Chemistry (OCR H432) | 291 | 201 (69%) | 77 | 13 |
| Maths (Edexcel 9MA0) | 89 | 25 (28%) | 54 | 10 |

How it was judged: keyword search matched each point to its 3 most likely note sections. Six AI reviewers then read those sections, searched the full notes before calling anything missing, and gave a verdict and a gap note. I spot-checked 14 of the most surprising verdicts against the notes. 13 held up, and one ("cofactors missing") was softened to "partly". Treat the results as a guide, not a guarantee.

## Fixed
- **Two factual errors in the notes:**
  - Chemistry: acid hydrolysis of a polyamide gives the *ammonium salt* of the amine, not the free amine.
  - Maths: 3D vectors *are* examined in 9MA0; vector line equations and the scalar product are Further Maths and are now labelled as such.
- **Crash:** each subject's notes list had an empty slot (a stray comma in the data). Once every topic in a subject was marked revised, the exam countdown and the Coach crashed, and revision progress could never reach 100%. The slots are removed and a test guards against it.

## Tests
- `qa-regression-v34.js`: 11 checks. No gaps in the data; every point judged; every note link resolves; every gap explained; filter, open-note and back navigation work.
- v29–v33 suites, navigation, unit tests and smoke test pass. Contrast audit is clean in both themes. Monkey test: 4,500 random actions, no errors.

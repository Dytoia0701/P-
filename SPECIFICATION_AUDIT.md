# Bridge Protocol — Specification Audit (v18 audit pack)

**Audit date:** 16 October 2026  
**Purpose:** establish a traceable, honest baseline for checking the revision notes against the user's course requirements.  
**Scope:** current v17 PWA source and the uploaded Biology checklist / Chemistry specification, cross-checked against official exam-board specification pages.  

## Executive finding

The upgraded PWA now has **39 Biology topic groups, 38 Chemistry topic groups and 25 Maths topic groups** (including eight new A* gap-fill groups). The notes are substantial, but these counts are not a completeness measure. At this stage, **no subject is certified as fully specification-complete** because each numbered learning outcome has not yet been matched to a specific note, example, question and answer point.

The accompanying `TOPIC_COVERAGE_MATRIX.csv` lists each existing topic group and first-pass specification area. `BIOLOGY_OBJECTIVE_TRACKER.csv` contains 207 objective rows extracted from the uploaded school checklist; each is deliberately left as “Needs note-level verification” until it is matched to actual note content. Six new gap-fill topic groups were added for quantitative/practical Chemistry, organic routes/spectra, inorganic qualitative analysis, practical Biology, synoptic Biology, and targeted immunity/chemiosmosis/ECG/plant-hormone detail. Their presence improves the revision resource, but does not itself prove 90–100% coverage; line-by-line mapping remains required.

## Source hierarchy and version notes

1. **Biology:** the uploaded school checklist is the working checklist for teaching/revision order. The official OCR/Cambridge OCR H420 specification is the authority for exam content. The current official specification search result identifies **Version 4.0 (November 2025)** for first assessment in 2025; OCR's assessment page also lists a student revision checklist. Use the latest official version if a discrepancy arises.
2. **Chemistry:** the uploaded PDF is titled OCR Chemistry A H432, first assessment in 2017, but its opening pages do not show a clear current version number. It must therefore be treated as the user's reference copy, not assumed to be the latest. The official OCR/Cambridge OCR Chemistry A H432 page lists the current qualification resources; a recent official specification search result identifies **Version 3.1 (May 2026)**.
3. **Maths:** because the checklist is unavailable, use Pearson Edexcel 9MA0 **Specification Issue 4** as the reference. The three papers are Pure Mathematics 1, Pure Mathematics 2, and Statistics and Mechanics. The standard content areas are Pure: proof, algebra/functions, coordinate geometry, sequences/series, trigonometry, exponentials/logarithms, differentiation, integration, numerical methods and vectors; Statistics: sampling, data presentation/interpretation, probability, distributions and hypothesis testing; Mechanics: quantities/units, kinematics, forces/Newton's laws and moments.

## Update — 16 October 2026: first content expansion

Added eight specification-focused gap-fill topic groups directly into the deployed `NOTES` data in `index.html` and synchronised `app.js` and `test-notes.js` mirrors. New material covers quantitative Chemistry with a worked non-1:1 titration, practical Chemistry and uncertainty, organic synthesis/spectra, Biology experimental design and calculations, practical method patterns, and synoptic Biology mechanisms/answer quality. The new groups are searchable through the existing notes system.

**Important status:** this is a content expansion, not a completed audit. The new Biology practical notes are a general method framework and must be checked against the current OCR practical activity/PAG list. The exact objective-by-objective comparison is still needed before reporting an audited percentage. The tracker is a work queue, not a completed coverage result.

## First-pass findings by subject

### Biology — priority 1

The topic index broadly aligns to the six OCR modules: practical skills; foundations; exchange/transport; biodiversity/evolution/disease; communication/homeostasis/energy; genetics/evolution/ecosystems. It includes several useful cross-topic groups (e.g. microscopy/calculations, water potential, chi-squared, sampling and practical evaluation).

**Items requiring specific verification:**
- Map each checklist objective (including lettered subpoints) to the exact note heading(s); mark complete, partial or missing only after inspecting the actual content.
- Verify the full practical-method, apparatus, risk, variable-control, data processing, uncertainty, statistics and evaluation requirements rather than relying on a general “practical skills” topic.
- Check overlapping groups (e.g. cell/membrane, immunity/disease, oxygen transport/heart, gene expression/epigenetics, photosynthesis, respiration, inheritance and ecology) so content is neither omitted nor double-counted.
- Some sections are explicitly labelled “Beyond A-Level” or include degree-level detail. Keep this clearly separated from examinable OCR content, and verify claims before treating them as revision facts.
- The uploaded checklist appears to use topic headings and objective wording that should be preserved in the final checklist; the app's topic names are not a substitute for those objectives.

### Chemistry — priority 2

The 34 topic groups cover broad areas across OCR modules 1–6, including quantitative chemistry, atomic structure, bonding, periodicity, energetics, kinetics, equilibrium, acids, redox/electrochemistry, transition elements, organic functional groups, synthesis, spectroscopy and practical skills.

**Items requiring specific verification:**
- Extract and map every numbered/lettered outcome in the current H432 specification, especially Module 1 practical skills and the links between physical chemistry, inorganic chemistry and organic analysis.
- Confirm all required reagents, conditions, mechanisms, observations, equations, units and exceptions against the latest specification.
- Check repeated/deepening topics (rate equations, equilibrium calculations, Ka/pH, electrochemical cells and synthesis routes) for consistency and for clear links back to core topics.
- Build practical-specific records: method, apparatus, safety, variables, raw/processed data, uncertainties, graph treatment and evaluation.
- Do not silently replace the uploaded reference PDF's wording with current specification wording; record differences explicitly where they matter.

### Mathematics — priority 3

The 25 topic groups appear to span the three 9MA0 papers, but several labels combine multiple specification areas. That is acceptable for learning navigation only if each official content statement can still be found and tracked.

**Items requiring specific verification:**
- Build a checklist using the official topic numbers, not only broad app topic titles.
- Confirm explicit coverage of **quantities and units in mechanics**, moments, proof methods, numerical methods, the prescribed large data set, and calculator/statistical notation.
- Check the Maths topic “moments” is taught as the specification requires; projectiles, differential equations, partial fractions and 3D vector material should be tagged against the exact 9MA0 statements and labelled as extension if any detail goes beyond the qualification.
- Ensure every worked example has a full method, appropriate notation, units where relevant, and a checked final answer.

## Cross-subject requirements

For each official specification statement, the final audit should record:

- specification code and exact statement;
- app topic and note section;
- status: **Complete / Partial / Missing / Needs accuracy check**;
- a worked example or calculation where appropriate;
- at least one relevant exam-style question and a mark-point answer;
- practical/PAG link where relevant;
- source/version used and date checked.

A question bank existing is not enough: question-to-spec mapping and mark-point validation are separate checks. Original questions should be labelled “original exam-style practice”, not official past-paper questions. Official papers and mark schemes should be linked to their awarding-body sources when used.

## QA and implementation constraints

- Existing v17 static smoke test and JavaScript syntax checks passed in the prior QA pass.
- A headless browser test timed out, so browser-level behaviour is **not verified**.
- Preserve existing PWA functions and localStorage keys while adding academic audit data. Do not overwrite or migrate user data without a tested backup/restore path.
- The PWA is offline-first and local-storage based; it does not cloud-sync. Keep manual JSON backups available.

## Official references

- OCR/Cambridge OCR Biology A H420 specification: https://www.ocr.org.uk/Images/687834-download-a-level-specification.pdf
- OCR/Cambridge OCR Biology A assessment/resources page (includes student checklist listing): https://www.ocr.org.uk/qualifications/as-and-a-level/biology-a-h020-h420-from-2015/assessment/
- OCR/Cambridge OCR Chemistry A H432 official qualification page: https://www.ocr.org.uk/qualifications/as-and-a-level/chemistry-a-h032-h432-from-2015/
- OCR/Cambridge OCR Chemistry A H432 specification PDF: https://www.ocr.org.uk/images/171720-specification-accredited-a-level-gce-chemistry-a-h432.pdf
- Pearson Edexcel A Level Mathematics 9MA0 official page: https://qualifications.pearson.com/en/qualifications/edexcel-a-levels/mathematics-2017.html
- Pearson Edexcel Mathematics 9MA0 Specification Issue 4 PDF: https://qualifications.pearson.com/content/dam/pdf/A%20Level/Mathematics/2017/specification-and-sample-assesment/a-level-l3-mathematics-specification-issue4.pdf

## Next execution order

1. **Biology:** transcribe the uploaded checklist into a row-level tracker; map each objective to the actual notes and flag missing/partial/accuracy-check points.
2. **Biology:** fix confirmed gaps, create required-practical and data-analysis checklists, then re-run automated checks.
3. **Chemistry:** obtain the exact objective list from the latest H432 spec and compare it with the uploaded reference copy; audit equations, conditions, mechanisms and practicals.
4. **Maths:** build the row-level 9MA0 tracker from official topic statements, then check all worked answers and remove/label extension-only content.
5. **QA:** run syntax/static tests and complete real-phone interaction tests; only then describe runtime behaviour as verified.

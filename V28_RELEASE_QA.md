# Bridge Protocol v28 Release QA — Biology & Chemistry Expansion

## Changes
- 17 new Biology note topic records added (OCR A H420 focus).
- 13 new Chemistry note topic records added (OCR A H432 focus).
- App entrypoint `index.html` and mirrored `app.js` contain matching source.
- Service-worker cache bumped to `bridge-protocol-v28-biology-chemistry-notes`.
- No storage schema or local-storage key changes. Existing navigation, universal search, training, Life OS and backup/restore retained.

## Automated checks
- `node --check app.js`: PASS.
- `node --check service-worker.js`: PASS.
- Navigation unit tests: PASS.
- Workout normalizer tests: PASS.
- Life OS normalization tests: PASS.
- Smoke test: PASS; topic records now report Biology 57, Chemistry 52, Maths 26. These counts are records, not percentage of specification covered.
- Inline `index.html` script equals `app.js`: PASS.
- Manifest JSON: PASS. ZIP integrity: PASS. Duplicate HTML IDs: none. Inline HTML script matches `app.js`: PASS.

## Not verified
- Actual Android phone interaction, browser rendering across devices, service-worker installation, and offline relaunch have not been manually verified.
- Full objective-by-objective specification coverage is not certified. Added material is original revision content, not official OCR material.

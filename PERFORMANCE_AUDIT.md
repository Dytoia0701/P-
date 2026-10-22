# Bridge Protocol v26 — Performance pass

## Changes made

- Added a one-time, lazy-built search index for static Biology, Chemistry and Maths notes. Search no longer lowercases and traverses every static point from scratch for each character typed.
- Debounced notes-search input by 90 ms to avoid rerendering results for every intermediate keystroke. Explicit calls to `searchAllNotes` remain immediate.
- Removed `backdrop-filter: blur(12px)` from the sticky header and fixed bottom navigation. These surfaces now use opaque dark backgrounds, reducing repeated backdrop blur/compositing work during scrolling on mobile GPUs.
- Bumped app title, backup metadata and service-worker cache version to v26. Existing local-storage keys and data schemas are unchanged.

## Validation

Automated syntax, smoke, unit, mirror, asset and archive-integrity checks are recorded in `V26_PERFORMANCE_QA.md`.

## Limitations

No reliable browser performance trace or real-phone benchmark could be collected in this environment. The changes target identifiable repeated work and costly fixed-surface effects, but actual FPS/startup/search latency improvements must be verified on the user's device.

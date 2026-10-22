# Bridge Protocol v29 — Hardening & Bug-Fix Release

Based on v28. No new features; no storage key or schema changes (existing backups restore as before).

## Bugs fixed
| # | Severity | Bug | Fix |
|---|----------|-----|-----|
| 1 | High | A saved `bp_notesSubject` that no longer matches a subject (e.g. from an old/edited backup) threw during startup and aborted the rest of the script, leaving the app half-initialised (Life OS crashed with a `lifeRead` TDZ error). | Subject is validated on load, on render and on import; falls back to Chemistry. |
| 2 | High | `null`/wrong-typed entries in saved tasks, projects, habits or custom notes crashed the Command Centre / Habits / Notes views. Only *imports* were normalised, not data already in storage. | All four lists are normalised on load (bad records dropped, fields coerced to valid values). |
| 3 | High | Timer counted `remaining--` per interval tick, so a locked phone / backgrounded tab made rounds run long. | End time is an absolute timestamp, ticked every 250 ms, re-synced on `visibilitychange`. |
| 4 | Medium | Timer bell was silent on iOS (AudioContext created outside a user gesture) and leaked a new AudioContext per round. | One shared context, primed on Start. Screen Wake Lock requested while a timer runs (where supported). |
| 5 | High | Backup import wrote *any* `bp_*` key unvalidated (habits, notes, Life OS…), could half-restore if storage filled, and left macro/notes/habit state stale. | Known keys only, shape-checked and normalised, staged then written with automatic rollback on failure, in-memory state refreshed. |
| 6 | Medium | "Reset all data" left Life OS records in memory; they reappeared on the next save. | Life OS and macro state reloaded after reset. |
| 7 | Medium | Quiz marking used raw substring matching: the single-letter keywords `a`/`b` in the rate-equation question gave free marks to nearly any answer; `uv`, `ph`, `die`, `tin`, `90`… matched inside other words. | Whole-token matching for short alphabetic/numeric keywords; question rewritten with real phrases. All 194 model answers still score full marks. |
| 8 | Low | "Completed this week" used the UTC date of a timestamp; tasks finished 00:00–01:00 BST fell into the previous day/week. | Converted to local date. |
| 9 | Low | Revision-note text and titles were injected as raw HTML (safe today only because no note contains `<` before a letter). | Escaped before linkifying. |
| 10 | Low | Four saves (`dayModes`, `checklist`, `notesExpanded`, `customNotes`) had no storage-full handling. | Guarded; custom-note save tells the user. |
| 11 | Low | Manifest name read "Universal Search v27"; theme colour differed between HTML and manifest. | Aligned. |
| 12 | Low | Service worker: unhandled offline miss, `?query` launches missed the cache, cache write not kept alive. | Stale-while-revalidate with shell fallback, `ignoreSearch` for navigations, `waitUntil`. Cache bumped to `bridge-protocol-v29-hardening`. |

## Measured performance (headless Chromium, 4× CPU throttle, 390×844)
Load ≈ 0.37 s; view switch 3–32 ms; notes render 4–6 ms (41 ms with every Biology topic expanded); global search 16–35 ms; JS heap ≈ 10 MB. No performance regression was found, so none was "optimised" speculatively.

## Tests
- `qa-regression-v29.js` (new, 18 checks, real browser): `node qa-regression-v29.js .`
- Existing navigation / workout / Life OS unit tests and `qa-smoke-test.py` pass (smoke test version strings updated).
- Storage-corruption matrix: 7 payload shapes × 20 `bp_` keys, every view visited — 0 errors (v28: 11 failing combinations).
- Offline reload over HTTP with the service worker: PASS.

## Not verified
Real-phone behaviour (iOS audio, Wake Lock, install prompt) — tested in desktop Chromium only.

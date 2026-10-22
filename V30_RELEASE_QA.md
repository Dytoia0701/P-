# Bridge Protocol v30 — Backup safety (on top of v29 hardening)

## Changes
- **Backup reminder** on the Command Centre when you have data and your last export is over 7 days old (or never). "Back up now" exports straight away; "Remind me in 3 days" snoozes it. Life OS-only data counts.
- **Last backup** date shown in System → Data status. Stored in new key `bp_lastBackup_v1` (snooze: `bp_backupSnooze_v1`); neither is restored from backups.
- **Persistent storage** requested on load (`navigator.storage.persist()`), with a plain-English "Storage protection: ON/OFF" line in System. Chrome on Android generally grants it once the app is installed to the home screen.
- **Pinch-zoom enabled** (removed `maximum-scale=1`). Safe on Android; iOS Safari may zoom into small text boxes.
- **Styling bug fixed:** `.suggestion-card` had no CSS, so the Weekly Review suggestions (existing since v28) rendered as bare text. Defined once; also used by the reminder.
- Header badge said "v28" (hard-coded); now v30. Service-worker cache `bridge-protocol-v30-backup-safety`.

## Tests
`node qa-regression-v30.js .` (15 checks) and `node qa-regression-v29.js .` (18 checks) both pass, as do the unit tests and smoke test. Layout checked by screenshot at 412×780 (Galaxy A54 class).

## Not verified
On-device behaviour (Chrome/Samsung Internet on a real A54): install, persistent-storage grant, wake lock, vibration.

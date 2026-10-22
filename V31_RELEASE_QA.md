# Bridge Protocol v31 — Round timer, smart practice, exam countdown, Daily Coach

## New
- **Boxing rounds timer** (Focus Timer screen): rounds, round length, rest, get-ready, 10-second warning. Bell at round start, double beep at rest, 3-2-1 ticks, triple bell at the end, vibration, Pause/Resume, presets (8×3:00, 6×2:00, 10×1:00). Settings are remembered. Uses real clock time, so a locked or backgrounded phone cannot drift or skip phases (a long suspension lands in the correct phase).
- **Smart question practice** (Test screen): your results are recorded per topic; Smart mode shows weaker and less-recent topics more often (Random mode keeps the old behaviour). "Weakest topics" list with tap-to-drill. Empty answers are not recorded.
- **Exam countdown** (Daily Coach screen): add exam dates; days left, plus a daily pace ("41 of 60 Biology topics not yet revised → about 3 per day"). New **"Mark as revised"** button on every note topic feeds the pace.
- **Daily Coach** (menu → Daily Coach, plus a "Today's top 3" card on the Command Centre): a chat that builds the day from your overdue/due tasks, weekly schedule, habits, quiz weak spots, revised topics and exam dates. Understands "plan my day", "I have 30 minutes", "I'm tired", "what's urgent", "what should I revise", "plan tomorrow", "how is my week going", "help". After 22:00 it plans tomorrow and says sleep matters. Each suggestion has a button that jumps to the right screen.
  **It is rules-based and fully offline — it is not an AI model.** Nothing leaves the phone.

## Other fixes
- Date maths in the coach uses calendar arithmetic, not "+24 h", so "tomorrow" is correct on the night the clocks go forward.
- Disabled timer controls now look disabled.
- Smoke-test checks that were tied to the old question picker updated.

## Storage
New keys (all included in backups, validated on restore, wiped by reset): `bp_questionStats_v1`, `bp_exams_v1`, `bp_notesRevised_v1`, `bp_timerCfg_v1`.

## Tests
`qa-regression-v31.js` (about 60 checks, real browser, fake clock for timer/DST/late-night cases), plus v29 and v30 suites, unit tests and smoke test — all pass. Corrupt/hostile payloads for every new key are survivable. Load time unchanged (≈0.4 s at 4× CPU throttle); offline reload verified.

## Not verified
Real-phone behaviour (bell loudness, vibration, wake lock, install) on a Galaxy A54.

# Bridge Protocol v38: Music (YouTube Music playlists)

## What it does
- **♪ button in the header**, next to Search. It opens a Music sheet with your saved YouTube Music playlists or songs.
- **▶ Play** opens the playlist straight in the YouTube Music app (Android) and closes the sheet, so when you switch back you're exactly where you were. With Premium it keeps playing in the background, and you control it from the notification shade or lock screen.
- **Adding a playlist:** in YouTube Music, open a playlist or song, tap Share → Copy link, then paste it in. YouTube and youtu.be links work too, and "Liked music" (`list=LM`) works. Give it a name and choose what it's for:
  - Study & focus
  - Training & boxing
  - Wind down
  - Anything
- **Suggestions:** when you start a focus timer, a small bar above the bottom navigation offers your Study & focus playlist. Starting the round timer offers your Training & boxing one. It's only a link and never plays by itself. It appears at most once every 45 minutes per kind, and you can turn it off in the Music sheet.
- Edit, delete, and up to 30 saved items. Your list is included in backups and checked when a backup is restored.

## Why it works this way
Google offers no way for other apps to control YouTube Music, sign in to it, or read your library. So the app keeps your links and hands them to the YouTube Music app.

## Safety
- Only `music.youtube.com`, `youtube.com`, `m.youtube.com` and `youtu.be` links are accepted.
- Look-alike domains and `javascript:` links are rejected.
- Each saved link is rebuilt from its validated playlist or video ID, which also removes tracking parameters such as `si=`.
- Names are shown as text, never as HTML.

## Tests
| Check | Result |
|---|---|
| `qa-regression-v38.js` (25 checks): link parsing for every link type, rejected links, the add/edit/delete form, the Android app link with website fallback, a new tab on desktop, ▶ closes the sheet and remembers the last played, back gesture and Escape, suggestions for both timers plus the 45-minute limit, off switch and no-match cases, reload, backup and safe restore, header fit at 360 px at every text size, XSS | pass |
| v29–v37 suites, navigation (now taps Search by its label, since ♪ is the first header button), workout and Life OS unit tests, smoke test | pass |
| Random-tap test (4,500 actions) | no errors |
| Contrast audit, dark and light | 0 issues |

The data files are unchanged, so updating to v38 downloads only the app code (about 0.4 MB).

## Not verified
Opening the YouTube Music app from the link on a real Galaxy A54. The link uses Android's standard way of opening a specific app; if the app isn't installed, it opens music.youtube.com instead.

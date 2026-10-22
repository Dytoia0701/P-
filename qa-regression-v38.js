// v38 tests: Music (saved YouTube Music playlists). Usage: node qa-regression-v38.js [folder]
const { chromium } = require(process.env.PLAYWRIGHT_PATH || '/opt/node22/lib/node_modules/playwright');
const path = require('path'); const dir = path.resolve(process.argv[2] || __dirname);
let fails = 0; const ok = (c, m) => { console.log((c ? 'PASS' : 'FAIL') + ': ' + m); if (!c) fails++; };
const ANDROID_UA = 'Mozilla/5.0 (Linux; Android 14; SM-A546B) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/129.0.0.0 Mobile Safari/537.36';
(async () => {
  const b = await chromium.launch({ executablePath: process.env.CHROMIUM_PATH || '/opt/pw-browsers/chromium', args: ['--no-sandbox'] });
  const errs = [];
  const mk = async (opts = {}) => { const ctx = await b.newContext({ serviceWorkers: 'block', viewport: { width: 390, height: 844 }, timezoneId: 'Europe/London', ...opts }); const p = await ctx.newPage(); p.on('pageerror', e => errs.push(e.message)); p.on('dialog', d => d.accept()); await p.goto('file://' + dir + '/index.html'); return { ctx, p }; };
  const { ctx, p } = await mk({ userAgent: ANDROID_UA });
  ok(await p.evaluate(() => JSON.parse(buildBackupJSON()).appVersion === 'v38'), 'app reports v38');
  // 1. Link parsing
  const parse = await p.evaluate(() => {
    const t = u => { const r = musicParse(u); return r ? r.web : null; };
    return {
      sharePlaylist: t('https://music.youtube.com/playlist?list=PLx9Ab_cd-12345&si=AbCdEf'),
      liked: t('https://music.youtube.com/playlist?list=LM'),
      song: t('https://music.youtube.com/watch?v=dQw4w9WgXcQ&si=zz'),
      ytPlaylist: t('https://www.youtube.com/playlist?list=PLabcdef123'),
      ytWatchList: t('https://m.youtube.com/watch?v=dQw4w9WgXcQ&list=PLabcdef123'),
      short: t('https://youtu.be/dQw4w9WgXcQ?si=1'),
      bad: ['https://evil.example/playlist?list=PLabc', 'javascript:alert(1)', 'https://music.youtube.com/', 'https://music.youtube.com/playlist?list=<script>', 'not a link', 'https://music.youtube.com.evil.example/playlist?list=PLabc'].map(t)
    };
  });
  ok(parse.sharePlaylist === 'https://music.youtube.com/playlist?list=PLx9Ab_cd-12345', 'YouTube Music share link → clean playlist link (tracking dropped)');
  ok(parse.liked === 'https://music.youtube.com/playlist?list=LM', '"Liked music" (list=LM) is accepted');
  ok(parse.song === 'https://music.youtube.com/watch?v=dQw4w9WgXcQ', 'song links are accepted');
  ok(parse.ytPlaylist === 'https://music.youtube.com/playlist?list=PLabcdef123' && parse.ytWatchList === 'https://music.youtube.com/watch?v=dQw4w9WgXcQ&list=PLabcdef123' && parse.short === 'https://music.youtube.com/watch?v=dQw4w9WgXcQ', 'youtube.com, m.youtube.com and youtu.be links open in YouTube Music');
  ok(parse.bad.every(x => x === null), 'non-YouTube, look-alike, script and empty links are rejected');
  // 2. Sheet: open, empty state, add via the form, play link format on Android
  await p.click('.hdr-music');
  ok(await p.evaluate(() => musicIsOpen() && /No playlists saved yet/.test(document.getElementById('musicBody').textContent)), '♪ opens the Music sheet with how-to text when empty');
  await p.fill('#musicName', '<img src=x onerror=window.__xss=1>Revision');
  await p.fill('#musicUrl', 'https://evil.example/x');
  await p.click('.music-form .btn-primary');
  ok(await p.evaluate(() => /doesn't look like/.test(document.querySelector('.music-msg').textContent) && music.playlists.length === 0), 'an invalid link shows a message and is not saved');
  await p.fill('#musicUrl', 'https://music.youtube.com/playlist?list=PLstudy12345&si=x'); await p.selectOption('#musicTag', 'study'); await p.click('.music-form .btn-primary');
  await p.fill('#musicName', 'Boxing'); await p.fill('#musicUrl', 'https://youtu.be/dQw4w9WgXcQ'); await p.selectOption('#musicTag', 'training'); await p.click('.music-form .btn-primary');
  const st = await p.evaluate(() => ({ n: music.playlists.length, xss: window.__xss, names: [...document.querySelectorAll('.music-name')].map(x => x.textContent), hrefs: [...document.querySelectorAll('a.music-play')].map(a => [a.getAttribute('href'), a.getAttribute('target')]) }));
  ok(st.n === 2 && st.names.some(n => n.startsWith('<img')) && !st.xss, 'playlists are added; a name with HTML is shown as text, not run');
  const studyHref = st.hrefs.find(h => /PLstudy12345/.test(h[0])) || [];
  ok(studyHref[0] === 'intent://music.youtube.com/playlist?list=PLstudy12345#Intent;scheme=https;package=com.google.android.apps.youtube.music;S.browser_fallback_url=' + encodeURIComponent('https://music.youtube.com/playlist?list=PLstudy12345') + ';end' && !studyHref[1], 'on Android, ▶ opens the YouTube Music app directly (with a website fallback)');
  // 3. Play closes the sheet and records last played; back gesture / Escape close it
  await p.evaluate(() => document.addEventListener('click', e => { if (e.target.closest('a.music-play,a.music-toast-play')) e.preventDefault(); }, true));
  await p.click('a.music-play'); await p.waitForTimeout(800);
  ok(await p.evaluate(() => !musicIsOpen() && music.playlists.some(x => x.last)), 'tapping ▶ closes the sheet (you return to where you were) and remembers what you played');
  await p.evaluate(() => showView('notes')); await p.click('.hdr-music'); await p.goBack(); await p.waitForTimeout(300);
  ok(await p.evaluate(() => !musicIsOpen() && currentView === 'notes'), 'Android back closes the Music sheet without leaving the section');
  await p.click('.hdr-music'); await p.keyboard.press('Escape'); await p.waitForTimeout(300);
  ok(await p.evaluate(() => !musicIsOpen()), 'Escape closes the Music sheet');
  // 4. Edit and delete
  await p.click('.hdr-music');
  await p.evaluate(() => { const row = [...document.querySelectorAll('.music-row')].find(r => /Boxing/.test(r.textContent)); row.querySelector('.link-btn').click(); });
  await p.fill('#musicName', 'Boxing rounds'); await p.click('.music-form .btn-primary');
  ok(await p.evaluate(() => music.playlists.some(x => x.name === 'Boxing rounds') && music.playlists.length === 2), 'editing a playlist renames it');
  await p.evaluate(() => { const row = [...document.querySelectorAll('.music-row')].find(r => /Boxing rounds/.test(r.textContent)); row.querySelector('.music-del').click(); });
  ok(await p.evaluate(() => music.playlists.length === 1), 'deleting a playlist removes it');
  await p.evaluate(() => { music.playlists.push({ id: 'mb', name: 'Boxing', url: 'https://music.youtube.com/watch?v=dQw4w9WgXcQ', tag: 'training', last: '' }); saveMusic(); closeOverlay(); });
  await p.waitForTimeout(300);
  // 5. Suggestions when timers start
  const sug = await p.evaluate(() => { showView('timer'); startPreset(60); const t = document.getElementById('musicToast'); const r = { shown: !!t && t.classList.contains('show'), text: t ? t.textContent : '' };
    hideMusicToast(); pauseTimer && pauseTimer(); startPreset(60); r.again = document.getElementById('musicToast').classList.contains('show'); resetTimer(); return r; });
  ok(sug.shown && /Study & focus/.test(sug.text) && /img|Revision/.test(sug.text), 'starting a focus timer suggests your Study & focus playlist');
  ok(!sug.again, 'the same suggestion is not repeated within 45 minutes');
  const sug2 = await p.evaluate(() => { showView('timer'); ivStart(); const t = document.getElementById('musicToast'); const r = { shown: t.classList.contains('show'), text: t.textContent, href: t.querySelector('a').getAttribute('href') }; ivStop(); hideMusicToast(); return r; });
  ok(sug2.shown && /Training/.test(sug2.text) && /dQw4w9WgXcQ/.test(sug2.href), 'starting the round timer suggests your Training & boxing playlist');
  const sug3 = await p.evaluate(() => { music.suggest = false; delete musicSuggested.study; startPreset(60); const s = document.getElementById('musicToast').classList.contains('show'); resetTimer(); music.suggest = true; music.playlists = music.playlists.filter(x => x.tag !== 'study'); delete musicSuggested.study; startPreset(60); const s2 = document.getElementById('musicToast').classList.contains('show'); resetTimer(); return { s, s2 }; });
  ok(!sug3.s && !sug3.s2, 'no suggestion when suggestions are off, or when no playlist matches');
  ok(await p.evaluate(() => document.getElementById('musicToast').getAttribute('role') === 'status' && !document.querySelector('#musicToast a').target), 'suggestion is announced politely and never plays by itself (it is just a link)');
  // 6. Saved, backed up, restored safely
  await p.evaluate(() => { music.playlists = [{ id: 'm1', name: 'Kept', url: 'https://music.youtube.com/playlist?list=PLkeep1234', tag: 'relax', last: '' }]; saveMusic(); });
  await p.reload();
  ok(await p.evaluate(() => music.playlists.length === 1 && music.playlists[0].name === 'Kept' && JSON.parse(buildBackupJSON()).data.bp_music_v1), 'playlists survive a reload and are included in backups');
  const restored = await p.evaluate(async () => { const data = JSON.parse(buildBackupJSON()); data.data.bp_music_v1 = { suggest: false, playlists: [{ name: 'Good', url: 'https://music.youtube.com/playlist?list=PLgood1234', tag: 'study' }, { name: 'Evil', url: 'javascript:alert(1)', tag: 'study' }, { name: 'Bad tag', url: 'https://youtu.be/dQw4w9WgXcQ', tag: '<x>' }] };
    const file = new File([JSON.stringify(data)], 'b.json', { type: 'application/json' }); const input = document.createElement('input'); input.type = 'file'; const dt = new DataTransfer(); dt.items.add(file); input.files = dt.files; importBackupFile(input);
    await new Promise(r => setTimeout(r, 600)); return { n: music.playlists.length, names: music.playlists.map(x => x.name), tags: music.playlists.map(x => x.tag), suggest: music.suggest }; });
  ok(restored.n === 2 && !restored.names.includes('Evil') && restored.tags.includes('any') && restored.suggest === false, 'restoring a backup keeps valid playlists and drops unsafe links (' + JSON.stringify(restored) + ')');
  await ctx.close();
  // 7. Desktop (non-Android): normal web link in a new tab; header fits at 360 px and at extra-large text
  const d = await mk({ viewport: { width: 360, height: 740 } });
  await d.p.evaluate(() => { music.playlists = [{ id: 'm1', name: 'Kept', url: 'https://music.youtube.com/playlist?list=PLkeep1234', tag: 'relax', last: '' }]; openMusic(); });
  const web = await d.p.evaluate(() => { const a = document.querySelector('a.music-play'); return [a.getAttribute('href'), a.target, a.rel]; });
  ok(web[0] === 'https://music.youtube.com/playlist?list=PLkeep1234' && web[1] === '_blank' && /noopener/.test(web[2]), 'off Android, ▶ opens music.youtube.com in a new tab');
  const fit = await d.p.evaluate(() => { closeMusic(); const r = []; for (const z of ['normal', 'large', 'xl']) { setAppearance('size', z); const h = document.querySelector('.hdr-row'); r.push(document.documentElement.scrollWidth <= innerWidth + 1 && h.scrollWidth <= h.clientWidth + 1); } setAppearance('size', 'normal'); return r; });
  ok(fit.every(Boolean), 'header with ♪ and Search fits at 360 px wide at every text size (' + fit.join(',') + ')');
  await d.ctx.close();
  ok(errs.length === 0, 'no errors (' + errs.join(' | ') + ')');
  await b.close(); console.log(fails ? '\n' + fails + ' FAILED' : '\nALL PASS'); process.exit(fails ? 1 : 0);
})();

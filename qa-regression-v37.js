// v37 tests: performance work. Usage: node qa-regression-v37.js [folder]
// - data cache keyed by a fingerprint, so a code-only update does not re-download the 2.5 MB of notes/questions
// - hidden screens drawn on first open; home screen drawn once at start-up
// - opening a note topic redraws only that card
// - cached date formatters give identical text
// - search index prepared before the first keystroke
const { chromium } = require(process.env.PLAYWRIGHT_PATH || '/opt/node22/lib/node_modules/playwright');
const path = require('path'), fs = require('fs'), http = require('http'), crypto = require('crypto');
const dir = path.resolve(process.argv[2] || __dirname);
let fails = 0; const ok = (c, m) => { console.log((c ? 'PASS' : 'FAIL') + ': ' + m); if (!c) fails++; };
const TYPES = { '.html': 'text/html', '.js': 'text/javascript', '.json': 'application/json', '.png': 'image/png' };
function serve(root, swOverride) { // tiny static server; counts requests per path
  const hits = {};
  const srv = http.createServer((req, res) => {
    let p = decodeURIComponent(req.url.split('?')[0]); if (p === '/') p = '/index.html';
    hits[p] = (hits[p] || 0) + 1;
    if (p === '/service-worker.js' && swOverride) { res.writeHead(200, { 'Content-Type': 'text/javascript', 'Cache-Control': 'no-store' }); return res.end(swOverride()); }
    const f = path.join(root, p); if (!f.startsWith(root) || !fs.existsSync(f)) { res.writeHead(404); return res.end(); }
    res.writeHead(200, { 'Content-Type': TYPES[path.extname(f)] || 'application/octet-stream', 'Cache-Control': 'no-store' }); fs.createReadStream(f).pipe(res);
  });
  return new Promise(r => srv.listen(0, '127.0.0.1', () => r({ srv, hits, url: 'http://127.0.0.1:' + srv.address().port + '/' })));
}
(async () => {
  const b = await chromium.launch({ executablePath: process.env.CHROMIUM_PATH || '/opt/pw-browsers/chromium', args: ['--no-sandbox'] });
  // 1. Data fingerprint matches the data files
  const sw = fs.readFileSync(path.join(dir, 'service-worker.js'), 'utf8'); const CODE = (sw.match(/const CACHE_NAME = '([^']+)'/) || [])[1];
  const h = crypto.createHash('sha256'); ['data.js', 'specs.js'].forEach(f => h.update(fs.readFileSync(path.join(dir, f)))); const digest = h.digest('hex').slice(0, 12);
  ok(sw.includes("const DATA_HASH = '" + digest + "'"), 'service worker DATA_HASH matches data.js + specs.js (run update-data-hash.py after editing data)');
  ok(!/APP_SHELL = \[[^\]]*data\.js/.test(sw) && /DATA_FILES = \['\.\/data\.js', '\.\/specs\.js'\]/.test(sw), 'notes/questions/spec data are cached separately from the app code');
  // 2. A code-only update keeps the data cache (no second download of data.js)
  let swName = CODE; const { srv, hits, url } = await serve(dir, () => sw.replace("'" + CODE + "'", "'" + swName + "'"));
  const ctx = await b.newContext({ viewport: { width: 390, height: 844 }, timezoneId: 'Europe/London' });
  const p = await ctx.newPage(); const errs = []; p.on('pageerror', e => errs.push(e.message));
  await p.goto(url); await p.evaluate(() => navigator.serviceWorker.ready); await p.waitForTimeout(500);
  const c1 = await p.evaluate(async () => { const k = await caches.keys(); const out = {}; for (const n of k) out[n] = (await (await caches.open(n)).keys()).map(r => new URL(r.url).pathname).sort(); return out; });
  const names = Object.keys(c1);
  ok(names.some(n => n === CODE) && names.some(n => n === 'bridge-data-' + digest), 'two caches after install: code (' + CODE + ') and data (fingerprint) (' + names.join(', ') + ')');
  ok((c1['bridge-data-' + digest] || []).join() === '/data.js,/specs.js' && !(c1[CODE] || []).includes('/data.js'), 'data.js and specs.js live only in the data cache');
  const before = hits['/data.js'] || 0; swName = CODE + '-test-update';
  await p.evaluate(async () => { const r = await navigator.serviceWorker.getRegistration(); await r.update(); });
  await p.evaluate(async code => { for (let i = 0; i < 50; i++) { const k = await caches.keys(); if (k.includes(code + '-test-update') && !k.includes(code)) return; await new Promise(r => setTimeout(r, 200)); } }, CODE);
  await p.waitForTimeout(800);
  const c2 = await p.evaluate(async () => caches.keys());
  ok(c2.includes(CODE + '-test-update') && !c2.includes(CODE) && c2.includes('bridge-data-' + digest), 'an app update replaces the code cache and keeps the data cache (' + c2.join(', ') + ')');
  ok((hits['/data.js'] || 0) === before, 'the update did not download data.js again (' + before + ' → ' + (hits['/data.js'] || 0) + ')');
  await ctx.setOffline(true); await p.reload(); await p.waitForTimeout(300);
  ok(await p.evaluate(() => typeof NOTES === 'object' && QUESTIONS.length > 500 && document.title.length > 0), 'offline reload after the update still has all notes and questions');
  await ctx.close(); srv.close();
  // 3. Start-up and screens (file://, no service worker)
  const ctx2 = await b.newContext({ serviceWorkers: 'block', viewport: { width: 390, height: 844 }, timezoneId: 'Europe/London' });
  const q = await ctx2.newPage(); q.on('pageerror', e => errs.push(e.message)); q.on('dialog', d => d.accept());
  await q.goto('file://' + dir + '/index.html');
  ok(await q.evaluate(() => { const v = JSON.parse(buildBackupJSON()).appVersion; return /^v(3[7-9]|[4-9]\d)$/.test(v) && document.querySelector('.hdr-row h1').textContent.includes(v); }), 'app reports a consistent version (v37 or later)');
  const lazy = await q.evaluate(() => ({ notes: document.getElementById('notesList').children.length, q: currentQ, check: document.getElementById('checklistList').children.length, cmd: document.getElementById('commandMetrics').children.length }));
  ok(lazy.notes === 0 && lazy.q === null && lazy.check === 0 && lazy.cmd > 0, 'start-up draws the home screen but leaves Notes, Quiz and Checklist until opened');
  const opened = await q.evaluate(() => { showView('notes'); const n = document.getElementById('notesList').children.length; showView('test'); const t = !!currentQ && document.getElementById('testBody').textContent.includes(currentQ.q.slice(0, 30)); showView('checklist'); const c = document.getElementById('checklistList').children.length; return { n, t, c }; });
  ok(opened.n > 50 && opened.t && opened.c > 0, 'Notes, Quiz and Checklist draw on first open (' + JSON.stringify(opened) + ')');
  const deep = await (async () => { const pg = await ctx2.newPage(); await pg.goto('file://' + dir + '/index.html#/notes'); const n = await pg.evaluate(() => document.getElementById('notesList').children.length); const pg2 = await ctx2.newPage(); await pg2.goto('file://' + dir + '/index.html#/test'); const t = await pg2.evaluate(() => !!currentQ); await pg.close(); await pg2.close(); return n > 50 && t; })();
  ok(deep, 'opening the app straight into #/notes or #/test still draws them');
  // 4. Opening a topic redraws only that card
  const tog = await q.evaluate(() => { notesSubject = 'Biology'; showView('notes'); renderNotes(); const other = document.getElementById('note-Biology-1'); const k = 'Biology-0'; notesExpanded[k] = false; toggleNote(k);
    const card = document.getElementById('note-Biology-0'); const r = { sameOther: document.getElementById('note-Biology-1') === other, opened: !!card.querySelector('.note-body'), chev: card.querySelector('.chev').classList.contains('open') };
    toggleNote(k); r.closed = !document.getElementById('note-Biology-0').querySelector('.note-body'); r.stillSame = document.getElementById('note-Biology-1') === other; return r; });
  ok(tog.opened && tog.chev && tog.closed && tog.sameOther && tog.stillSame, 'tapping a topic opens/closes just that card; other cards are untouched (' + JSON.stringify(tog) + ')');
  const rev = await q.evaluate(() => { notesExpanded['Biology-0'] = true; renderNotes(); toggleRevised('Biology', 0); const on = /Revised/.test(document.getElementById('note-Biology-0').textContent); toggleRevised('Biology', 0); return on; });
  ok(rev, '"Mark as revised" still works inside an opened card');
  // 4b. Off-screen cards are skipped (content-visibility), but jumping to a note section far down still lands on it
  const jump = await q.evaluate(() => new Promise(r => { const s = 'Chemistry'; const ti = NOTES[s].length - 3; const t = NOTES[s][ti]; const si = t.sections.length - 1; for (let i = 0; i < NOTES[s].length; i += 7) notesExpanded[s + '-' + i] = true;
    openNoteRef(s, [t.title, t.sections[si].heading]); setTimeout(() => { const el = document.getElementById('note-sec-' + s + '-' + ti + '-' + si); const top = el ? el.getBoundingClientRect().top : -1; r({ top, cv: getComputedStyle(document.querySelector('.note-card')).contentVisibility }); }, 400); }));
  ok(jump.cv === 'auto' && jump.top >= -2 && jump.top < 400, 'jumping to a section near the end of Notes puts it on screen (top ' + Math.round(jump.top) + ' px, content-visibility ' + jump.cv + ')');
  // 5. Cached date formatting gives exactly the same text
  const dates = await q.evaluate(() => { const ds = ['2026-01-05', '2026-10-22', '2027-03-14', '2025-12-31']; return ds.every(iso => { const d = new Date(iso + 'T12:00:00'); return niceDate(iso) === d.toLocaleDateString(undefined, { day: 'numeric', month: 'short', year: d.getFullYear() !== new Date().getFullYear() ? 'numeric' : undefined }) && fmtShortDate(iso) === d.toLocaleDateString(undefined, { day: 'numeric', month: 'short' }); }) && localISODate() === localISODate(new Date()); });
  ok(dates, 'cached date formatting matches toLocaleDateString exactly; today’s date is correct');
  const speed = await q.evaluate(() => { const ts = []; for (let i = 0; i < 150; i++) ts.push({ id: 'x' + i, title: 'T' + i, status: 'todo', priority: 'medium', due: '2026-11-' + String(1 + i % 28).padStart(2, '0'), area: 'study' }); const t0 = performance.now(); ts.forEach(t => taskCardHTML(t, false)); return performance.now() - t0; });
  ok(speed < 40, '150 task cards build quickly (' + speed.toFixed(1) + ' ms; was ~25 ms unthrottled before v37)');
  // 6. Search index prepared before typing; results unchanged
  const srch = await q.evaluate(() => new Promise(r => { openGlobalSearch(); setTimeout(() => { const ready = !!gsCache; renderGlobalSearch('enzyme'); const n = document.querySelectorAll('#globalSearchResults .global-search-result').length; closeGlobalSearch(); r({ ready, n }); }, 400); }));
  ok(srch.ready && srch.n > 10, 'search index is ready shortly after opening search, before typing (' + JSON.stringify(srch) + ')');
  ok(errs.length === 0, 'no errors (' + errs.join(' | ') + ')');
  await b.close(); console.log(fails ? '\n' + fails + ' FAILED' : '\nALL PASS'); process.exit(fails ? 1 : 0);
})();

// Regression tests for the v29 fixes. Usage: node qa-regression-v29.js [path-to-app-folder]
const { chromium } = require(process.env.PLAYWRIGHT_PATH || '/opt/node22/lib/node_modules/playwright');
const path = require('path'); const dir = path.resolve(process.argv[2] || __dirname);
let fails = 0; const ok = (c, m) => { console.log((c ? 'PASS' : 'FAIL') + ': ' + m); if (!c) fails++; };
(async () => {
  const b = await chromium.launch({ executablePath: process.env.CHROMIUM_PATH || '/opt/pw-browsers/chromium', args: ['--no-sandbox'] });
  const mk = async (init, tz='Europe/London') => { const ctx = await b.newContext({ serviceWorkers: 'block', timezoneId: tz, viewport:{width:390,height:844} }); const p = await ctx.newPage(); const errs=[]; p.on('pageerror', e => errs.push(e.message)); p.on('dialog', d => d.accept()); if (init) await p.addInitScript(init); await p.goto('file://' + dir + '/index.html'); return { ctx, p, errs }; };

  // 1. invalid saved notes subject must not brick startup
  { const { ctx, p, errs } = await mk(`localStorage.setItem('bp_notesSubject','Physics')`);
    ok(errs.length === 0, 'unknown saved notes subject does not throw at startup');
    ok(await p.evaluate(() => { const fellBack = notesSubject === 'Chemistry'; showView('notes'); return typeof lifeRenderAll === 'function' && fellBack && document.getElementById('notesList').children.length > 0; }), 'falls back to Chemistry at start-up and renders notes when opened'); await ctx.close(); }

  // 2. null / wrong-typed stored records are cleaned, not fatal
  { const { ctx, p, errs } = await mk(`localStorage.setItem('bp_tasks_v1',JSON.stringify([null,1,{title:'ok',priority:{},status:'weird',due:5},{title:''}]));localStorage.setItem('bp_habits_v1',JSON.stringify([null,{title:'h',checks:5}]));localStorage.setItem('bp_customNotes',JSON.stringify([null,{id:{},title:3,body:null}]))`);
    await p.evaluate(() => APP_VIEWS.forEach(showView));
    ok(errs.length === 0, 'malformed records render every view without errors');
    ok(await p.evaluate(() => tasks.length === 1 && tasks[0].priority === 'medium' && tasks[0].status === 'next' && tasks[0].due === ''), 'task record normalised, junk dropped'); await ctx.close(); }

  // 3. timer is wall-clock based: a suspended tab must not lose time
  { const { ctx, p } = await mk();
    await p.clock.install({ time: new Date('2026-01-01T12:00:00Z') });
    await p.evaluate(() => startPreset(180));
    await p.clock.fastForward(60000); // simulates a throttled/suspended tab: due timers fire once only
    const shown = await p.evaluate(() => document.getElementById('timerDisplay').textContent);
    ok(shown === '02:00', 'after a 60s suspension the 3:00 timer shows 02:00 (got ' + shown + ')');
    await p.evaluate(() => pauseTimer()); await p.clock.fastForward(30000);
    ok(await p.evaluate(() => document.getElementById('timerDisplay').textContent) === '02:00', 'paused timer holds its value');
    await p.evaluate(() => startTimer()); await p.clock.fastForward(121000);
    ok(await p.evaluate(() => document.getElementById('timerDisplay').classList.contains('done') && timerInterval === null), 'timer completes and stops its interval'); await ctx.close(); }

  // 4. quiz keyword marking
  { const { ctx, p } = await mk();
    const r = await p.evaluate(() => {
      const q = QUESTIONS.find(x => x.q.startsWith('The rate doubles when [A] doubles'));
      const sc = t => { const l = normMark(t); return q.points.filter(pt => pt.keywords.some(k => keywordHit(l, k))).length; };
      const full = QUESTIONS.every(x => { const l = normMark(x.model); return x.points.every(pt => pt.keywords.some(k => keywordHit(l, k))); });
      return { banana: sc('banana abba'), blank: sc(''), good: sc('First order with respect to A; zero order with respect to B; rate = k[A], overall order is 1'), full,
               uv: keywordHit(normMark('uvula'), 'uv'), uv2: keywordHit(normMark('under UV light'), 'uv'), n90: keywordHit(normMark('in 1900'), '90'), n90b: keywordHit(normMark('bond angle 90°'), '90') };
    });
    ok(r.banana === 0 && r.blank === 0, 'single-letter keywords no longer award free marks');
    ok(r.good === 3, 'correct answer still earns full marks');
    ok(r.full, 'every model answer still scores full marks on all ' + 194 + ' questions');
    ok(!r.uv && r.uv2 && !r.n90 && r.n90b, 'short keywords match whole tokens only'); await ctx.close(); }

  // 5. import: bad shapes ignored, unknown keys ignored, valid subject kept; atomic on quota failure
  { const { ctx, p, errs } = await mk();
    const res = await p.evaluate(async () => {
      const mkFile = o => new File([JSON.stringify(o)], 'b.json', { type: 'application/json' });
      const run = async o => { const dt = new DataTransfer(); dt.items.add(mkFile(o)); const inp = document.createElement('input'); inp.type = 'file'; inp.files = dt.files; importBackupFile(inp); await new Promise(r => setTimeout(r, 300)); };
      await run({ format: 'bridge-protocol-backup', data: { bp_notesSubject: 'Nonsense', bp_habits_v1: [null, { title: 'x' }], bp_lifeInbox_v1: 'oops', bp_evil_unknown: [1], bp_dayModes: [], bp_customNotes: [null] } });
      const out = { subj: localStorage.getItem('bp_notesSubject'), habits: JSON.parse(localStorage.getItem('bp_habits_v1')).length, inbox: localStorage.getItem('bp_lifeInbox_v1'), unknown: localStorage.getItem('bp_evil_unknown'), modes: localStorage.getItem('bp_dayModes') };
      // quota failure -> rollback
      localStorage.setItem('bp_habits_v1', JSON.stringify([{ id: 'keep', title: 'keep', created: '2026-01-01', checks: {} }]));
      const orig = Storage.prototype.setItem; let n = 0; Storage.prototype.setItem = function (k, v) { if (k.startsWith('bp_') && ++n === 2) throw new DOMException('full', 'QuotaExceededError'); return orig.call(this, k, v); };
      await run({ format: 'bridge-protocol-backup', data: { bp_tasks_v1: [{ title: 'a' }], bp_projects_v1: [], bp_habits_v1: [{ title: 'new' }] } });
      Storage.prototype.setItem = orig;
      out.afterFail = JSON.parse(localStorage.getItem('bp_habits_v1')).map(h => h.title).join(',');
      return out;
    });
    ok(res.subj === null && res.habits === 1 && res.inbox === null && res.unknown === null && res.modes === null, 'import skips invalid/unknown keys and drops null records');
    ok(res.afterFail === 'keep', 'failed restore rolls back (existing data preserved)');
    ok(errs.length === 0, 'no uncaught errors during import'); await ctx.close(); }

  // 6. reset clears Life OS in-memory state too
  { const { ctx, p } = await mk();
    const r = await p.evaluate(() => { document.getElementById('lifeCaptureText').value = 'x'; lifeAddCapture(); resetAllAppData(); return { mem: lifeInbox.length, stored: localStorage.getItem('bp_lifeInbox_v1') }; });
    ok(r.mem === 0 && r.stored === null, 'reset clears in-memory Life OS data (was left behind before)'); await ctx.close(); }

  // 7. weekly review uses LOCAL date (00:30 BST on a Monday is still "this week")
  { const { ctx, p } = await mk(null, 'Europe/London');
    await p.clock.install({ time: new Date('2026-06-15T00:30:00+01:00') }); // Monday 00:30 BST == Sunday 23:30 UTC
    const r = await p.evaluate(() => { const iso = new Date().toISOString(); return { local: isoToLocalDate(iso), utc: iso.slice(0, 10), thisWeek: isThisWeek(isoToLocalDate(iso)) }; });
    ok(r.local === '2026-06-15' && r.utc === '2026-06-14' && r.thisWeek, 'task completed at 00:30 BST counts in the current week (local ' + r.local + ' vs UTC ' + r.utc + ')'); await ctx.close(); }

  // 8. notes escape markup but still linkify
  { const { ctx, p } = await mk();
    const r = await p.evaluate(() => { NOTES.Chemistry.unshift({ title: 'T<b>x', sections: [{ heading: 'a<i>b', points: ['x<y and a<script>window.__p=1</script> see https://example.com/a?b=1&c=2.'] }] }); notesExpanded['Chemistry-0'] = true; notesSubject = 'Chemistry'; renderNotes(); const li = document.querySelector('#note-Chemistry-0 li'); return { text: li.textContent, hasScript: !!li.querySelector('script'), href: li.querySelector('a')?.getAttribute('href'), p: window.__p }; });
    ok(!r.hasScript && r.p === undefined && r.text.includes('x<y and a<script>'), 'markup in notes is shown as text, not executed');
    ok(r.href === 'https://example.com/a?b=1&c=2', 'URLs are still linkified correctly (href=' + r.href + ')'); await ctx.close(); }

  await b.close(); console.log(fails ? '\n' + fails + ' FAILED' : '\nALL PASS'); process.exit(fails ? 1 : 0);
})();

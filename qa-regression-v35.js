// v35 tests: spec-completion notes cover every spec point.  Usage: node qa-regression-v35.js [folder]
const { chromium } = require(process.env.PLAYWRIGHT_PATH || '/opt/node22/lib/node_modules/playwright');
const path = require('path'); const dir = path.resolve(process.argv[2] || __dirname);
let fails = 0; const ok = (c, m) => { console.log((c ? 'PASS' : 'FAIL') + ': ' + m); if (!c) fails++; };
(async () => {
  const b = await chromium.launch({ executablePath: process.env.CHROMIUM_PATH || '/opt/pw-browsers/chromium', args: ['--no-sandbox'] });
  const ctx = await b.newContext({ serviceWorkers: 'block', viewport: { width: 390, height: 844 }, timezoneId: 'Europe/London' });
  const p = await ctx.newPage(); const errs = []; p.on('pageerror', e => errs.push(e.message)); p.on('dialog', d => d.accept());
  await p.goto('file://' + dir + '/index.html');
  ok(await p.evaluate(() => { const v = JSON.parse(buildBackupJSON()).appVersion; return /^v(3[5-9]|[4-9]\d)$/.test(v) && document.querySelector('.hdr-row h1').textContent.includes(v); }), 'app reports a consistent version (v35 or later)');
  // 1. New topics exist, are well-formed and marked plain
  const nt = await p.evaluate(() => Object.fromEntries(Object.entries(NOTES).map(([s, a]) => { const n = a.filter(t => /^Spec completion — /.test(t.title)); return [s, { topics: n.length, sections: n.reduce((x, t) => x + t.sections.filter(z => z.heading !== 'A* tips & common mistakes').length, 0), allPlain: n.every(t => t.plain === true || t.sections[t.sections.length - 1].heading === 'A* tips & common mistakes'), grouped: n.every(t => /^Spec completion notes · /.test(t.group)), wellFormed: n.every(t => t.sections.every(z => z.heading && z.points.length >= 2 && z.points.every(q => typeof q === 'string' && q.trim()))), dupTitles: new Set(a.map(t => t.title)).size !== a.length }]; })));
  ok(Object.values(nt).every(v => v.topics > 0), 'each subject has spec-completion topics (' + JSON.stringify(nt) + ')');
  ok(Object.values(nt).every(v => v.allPlain && v.grouped && v.wellFormed), 'new topics are plain (or end with A* tips), grouped and well-formed');
  ok(Object.values(nt).every(v => !v.dupTitles), 'no duplicate topic titles');
  ok(await p.evaluate(() => [...Object.values(NOTES), QUESTIONS].every(a => a.length === Object.keys(a).length)), 'no empty slots in notes or questions');
  // 2. Every spec point is now covered, with a working reference into a spec-completion section or an existing note
  const cov = await p.evaluate(() => Object.fromEntries(Object.entries(SPECS).map(([s, v]) => [s, { n: v.points.length, covered: v.points.filter(x => x.cov && x.cov.s === 'c').length, badRefs: v.points.flatMap(x => (x.cov && x.cov.r) || []).filter(r => !NOTES[s].some(t => t.title === r[0] && t.sections.some(z => z.heading === r[1]))).length, noRef: v.points.filter(x => !(x.cov && x.cov.r && x.cov.r.length)).length }])));
  ok(Object.values(cov).every(c => c.covered === c.n), 'every spec point is covered by the notes (' + JSON.stringify(cov) + ')');
  ok(Object.values(cov).every(c => c.badRefs === 0 && c.noRef === 0), 'every point links to a real note section');
  const filled = await p.evaluate(() => Object.values(SPECS).reduce((n, v) => n + v.points.filter(x => x.cov.f).length, 0));
  ok(filled === Object.values(nt).reduce((n, v) => n + v.sections, 0), 'each filled point has exactly one new section (' + filled + ')');
  // 3. Notes UI: plain topics are not styled as A* tips; existing topics still are
  const sty = await p.evaluate(() => { notesSubject = 'Biology'; showView('notes'); const i = NOTES.Biology.findIndex(t => /^Spec completion — /.test(t.title)); openNotesAt('Biology', i); const plainStar = document.querySelectorAll('#note-sec-Biology-' + i + '-0 ~ ul.astar-list').length - (NOTES.Biology[i].plain ? 0 : 1); const j = NOTES.Biology.findIndex(t => !t.plain && t.sections.length > 1); openNotesAt('Biology', j); return { plainStar, normalStar: document.querySelectorAll('ul.astar-list').length > 0 }; });
  ok(sty.plainStar === 0, 'only an A* tips section is styled as tips in spec-completion notes');
  ok(sty.normalStar, 'existing topics keep their A* tip styling');
  // 4. Tapping a filled point in the checklist opens its new note
  await p.evaluate(() => { specSubject = 'Chemistry'; specFilter = 'all'; specGapsOnly = false; showView('spec'); document.querySelectorAll('.spec-mod').forEach(d => d.open = true); }); await p.waitForTimeout(100);
  const want = await p.evaluate(() => { const rows = [...document.querySelectorAll('.spec-row')]; const k = SPECS.Chemistry.points.findIndex(x => x.cov.f); const link = rows[k] && rows[k].querySelector('.cov-link'); if (link) link.dataset.t = '1'; return SPECS.Chemistry.points[k].cov.r[0]; });
  await p.click('[data-t="1"]'); await p.waitForTimeout(250);
  const got = await p.evaluate(() => ({ view: currentView, subj: notesSubject }));
  const visible = await p.evaluate(h => [...document.querySelectorAll('.note-subhead')].some(e => e.textContent === h), want[1]);
  ok(got.view === 'notes' && got.subj === 'Chemistry' && visible, 'checklist link opens the new section (' + want[1].slice(0, 50) + ')');
  const ui = await p.evaluate(() => { specSubject = 'Maths'; specGapsOnly = false; showView('spec'); const t = document.getElementById('specBody').textContent; return { filledMsg: /points were filled in v35/.test(t), gapsBox: !!document.querySelector('.spec-gaps') }; });
  ok(ui.filledMsg && !ui.gapsBox, 'checklist says which points were filled and hides the now-empty gaps filter');
  // 5. Flashcards and search include the new sections
  const fc = await p.evaluate(() => { cardIndexCache = null; return cardIndex().filter(c => /^Spec completion — /.test(c.topic) && c.heading !== 'A* tips & common mistakes').length; });
  ok(fc === filled, 'flashcards include every new section (' + fc + ')');
  const sr = await p.evaluate(() => { notesSearchIndex = null; return buildNotesSearchIndex().filter(x => /Spec completion/.test(JSON.stringify(x))).length; });
  ok(sr > 0, 'notes search indexes the new sections (' + sr + ')');
  // 6. Revision progress still reaches 100% with the extra topics
  ok(await p.evaluate(() => { ['Chemistry', 'Biology', 'Maths'].forEach(s => NOTES[s].forEach(t => notesRevised[revisedKey(s, t.title)] = true)); try { return ['Chemistry', 'Biology', 'Maths'].every(s => nextUnrevisedTopic(s) === null && revisionProgress(s).remaining === 0); } catch (e) { return false; } }), 'marking every topic revised still works');
  ok(errs.length === 0, 'no errors (' + errs.join('|') + ')');
  await b.close(); console.log(fails ? '\n' + fails + ' FAILED' : '\nALL PASS'); process.exit(fails ? 1 : 0);
})();

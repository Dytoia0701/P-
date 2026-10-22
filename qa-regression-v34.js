// v34 tests: notes data has no gaps; notes-coverage in the Spec checklist.  Usage: node qa-regression-v34.js [folder]
const { chromium } = require(process.env.PLAYWRIGHT_PATH || '/opt/node22/lib/node_modules/playwright');
const path = require('path'); const dir = path.resolve(process.argv[2] || __dirname);
let fails = 0; const ok = (c, m) => { console.log((c ? 'PASS' : 'FAIL') + ': ' + m); if (!c) fails++; };
(async () => {
  const b = await chromium.launch({ executablePath: process.env.CHROMIUM_PATH || '/opt/pw-browsers/chromium', args: ['--no-sandbox'] });
  const ctx = await b.newContext({ serviceWorkers: 'block', viewport: { width: 390, height: 844 }, timezoneId: 'Europe/London' });
  const p = await ctx.newPage(); const errs = []; p.on('pageerror', e => errs.push(e.message)); p.on('dialog', d => d.accept());
  await p.goto('file://' + dir + '/index.html');
  // 1. Data integrity: no empty slots in NOTES / QUESTIONS (these crashed exam pace when every topic was revised)
  const holes = await p.evaluate(() => [...Object.values(NOTES), QUESTIONS].map(a => a.length - Object.keys(a).length));
  ok(holes.every(h => h === 0), 'notes and question lists have no empty slots (' + holes.join(',') + ')');
  ok(await p.evaluate(() => { ['Chemistry', 'Biology', 'Maths'].forEach(s => NOTES[s].forEach(t => notesRevised[revisedKey(s, t.title)] = true)); try { return ['Chemistry', 'Biology', 'Maths'].every(s => nextUnrevisedTopic(s) === null && revisionProgress(s).remaining === 0); } catch (e) { return false; } }), 'marking every topic revised works (no crash, progress reaches 100%)');
  await p.evaluate(() => { notesRevised = {}; });
  // 2. Coverage data present and sane
  const cov = await p.evaluate(() => Object.fromEntries(Object.entries(SPECS).map(([s, v]) => [s, { n: v.points.length, withCov: v.points.filter(x => x.cov && ['c', 'p', 'm'].includes(x.cov.s)).length, badRefs: v.points.flatMap(x => (x.cov && x.cov.r) || []).filter(r => !NOTES[s].some(t => t.title === r[0] && t.sections.some(z => z.heading === r[1]))).length, gapsWithoutText: v.points.filter(x => x.cov && x.cov.s !== 'c' && !x.cov.g).length }])));
  ok(Object.values(cov).every(c => c.withCov === c.n), 'every spec point has a coverage judgement (' + JSON.stringify(cov) + ')');
  ok(Object.values(cov).every(c => c.badRefs === 0), 'every note reference points to a real note section');
  ok(Object.values(cov).every(c => c.gapsWithoutText === 0), 'every partly-covered or missing point says what is missing');
  // 3. UI
  // v35: every point is now covered, so mark one as partly covered to exercise the gaps filter
  await p.evaluate(() => { const pt = SPECS.Biology.points[1]; pt.cov = Object.assign({}, pt.cov, { s: 'p', g: 'test gap' }); });
  await p.evaluate(() => { specSubject = 'Biology'; specFilter = 'all'; specGapsOnly = false; showView('spec'); });
  ok(/YOUR NOTES COVER/.test(await p.evaluate(() => document.getElementById('specBody').textContent)), 'summary shows how much the notes cover');
  await p.locator('.spec-mod summary').first().click();
  await p.waitForSelector('.spec-row .spec-cov', { timeout: 3000 }).catch(() => {});
  ok(await p.evaluate(() => document.querySelectorAll('.spec-row .spec-cov').length > 0), 'each point shows its notes coverage');
  await p.check('.spec-gaps input');
  const g = await p.evaluate(() => { document.querySelectorAll('.spec-mod').forEach(d => d.open = true); return new Promise(r => setTimeout(() => r({ rows: document.querySelectorAll('.spec-row').length, allGaps: [...document.querySelectorAll('.spec-row .spec-cov')].every(x => !x.classList.contains('cov-c')), expected: SPECS.Biology.points.filter(x => x.cov.s !== 'c').length }), 100)); });
  ok(g.rows === g.expected && g.allGaps, 'the gaps filter shows only partly-covered and missing points (' + g.rows + ')');
  await p.uncheck('.spec-gaps input');
  const target = await p.evaluate(() => { const pt = SPECS.Biology.points.find(x => x.cov.r.length); return pt.cov.r[0]; });
  await p.evaluate(() => document.querySelectorAll('.spec-mod').forEach(d => d.open = true)); await p.waitForTimeout(100);
  await p.locator('.cov-link').first().click(); await p.waitForTimeout(200);
  const opened = await p.evaluate(() => ({ view: currentView, subj: notesSubject }));
  ok(opened.view === 'notes' && opened.subj === 'Biology', 'tapping a note link opens that note (' + target[0] + ' › ' + target[1] + ')');
  await p.goBack(); await p.waitForTimeout(150); ok(await p.evaluate(() => currentView) === 'spec', 'back returns to the checklist');
  ok(errs.length === 0, 'no errors (' + errs.join('|') + ')');
  await b.close(); console.log(fails ? '\n' + fails + ' FAILED' : '\nALL PASS'); process.exit(fails ? 1 : 0);
})();

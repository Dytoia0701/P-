// v36 tests: question bank for every spec point, A* tips on spec-completion topics, practice links.  Usage: node qa-regression-v36.js [folder]
const { chromium } = require(process.env.PLAYWRIGHT_PATH || '/opt/node22/lib/node_modules/playwright');
const path = require('path'); const dir = path.resolve(process.argv[2] || __dirname);
let fails = 0; const ok = (c, m) => { console.log((c ? 'PASS' : 'FAIL') + ': ' + m); if (!c) fails++; };
(async () => {
  const b = await chromium.launch({ executablePath: process.env.CHROMIUM_PATH || '/opt/pw-browsers/chromium', args: ['--no-sandbox'] });
  const ctx = await b.newContext({ serviceWorkers: 'block', viewport: { width: 390, height: 844 }, timezoneId: 'Europe/London' });
  const p = await ctx.newPage(); const errs = []; p.on('pageerror', e => errs.push(e.message)); p.on('dialog', d => d.accept());
  await p.goto('file://' + dir + '/index.html');
  ok(await p.evaluate(() => { const v = JSON.parse(buildBackupJSON()).appVersion; return /^v(3[6-9]|[4-9]\d)$/.test(v) && document.querySelector('.hdr-row h1').textContent.includes(v); }), 'app reports a consistent version (v36 or later)');
  // 1. Question bank
  const qb = await p.evaluate(() => {
    const byS = {}; QUESTIONS.forEach(q => byS[q.subject] = (byS[q.subject] || 0) + 1);
    const codes = Object.fromEntries(Object.entries(SPECS).map(([s, v]) => [s, new Set(v.points.map(x => x.code))]));
    const nw = QUESTIONS.filter(q => q.v === 36);
    const badSpec = nw.filter(q => !Array.isArray(q.spec) || !q.spec.length || q.spec.some(c => !codes[q.subject].has(c))).length;
    const untested = Object.entries(SPECS).flatMap(([s, v]) => v.points.filter(x => !QUESTIONS.some(q => q.subject === s && Array.isArray(q.spec) && q.spec.includes(x.code))).map(x => s + ' ' + x.code));
    const topics = Object.fromEntries(Object.entries(NOTES).map(([s, a]) => [s, new Set(a.map(t => t.title))]));
    const badTopic = nw.filter(q => !topics[q.subject].has(q.topic)).length;
    const marksMismatch = QUESTIONS.filter(q => q.marks !== q.points.length).length;
    const notFull = QUESTIONS.filter(q => { const n = normMark(q.model); return q.points.some(pt => !(pt.keywords.some(k => keywordHit(n, k)) && !(pt.not || []).some(k => keywordHit(n, k)))); }).map(q => q.q.slice(0, 40));
    const blankHits = QUESTIONS.filter(q => { const n = normMark('I do not know the answer to this question.'); return q.points.some(pt => pt.keywords.some(k => keywordHit(n, k))); }).length;
    const dup = QUESTIONS.length - new Set(QUESTIONS.map(q => normMark(q.q))).size;
    return { total: QUESTIONS.length, byS, nw: nw.length, badSpec, untested, badTopic, marksMismatch, notFull, blankHits, dup };
  });
  ok(qb.nw >= 400 && qb.byS.Maths >= 120, 'question bank expanded (' + JSON.stringify({ total: qb.total, new: qb.nw, ...qb.byS }) + ')');
  ok(qb.badSpec === 0 && qb.badTopic === 0, 'new questions have valid spec codes and note topics');
  ok(qb.untested.length === 0, 'every spec point has at least one question (' + qb.untested.slice(0, 5).join(', ') + ')');
  ok(qb.marksMismatch === 0, 'marks equal marking points for every question');
  ok(qb.notFull.length === 0, 'every model answer scores full marks with the app marker (' + qb.notFull.slice(0, 3).join(' | ') + ')');
  ok(qb.blankHits === 0, 'a non-answer scores nothing on every question');
  ok(qb.dup === 0, 'no duplicate questions');
  // 1b. Blocking phrases ("not") stop a wrong answer that contains a correct keyword
  const blk = await p.evaluate(() => { showView('test'); const fake = { subject: 'Maths', topic: 'Hypothesis Testing', q: 'test', marks: 1, model: '', points: [{ label: 'conclusion', keywords: ['evidence of negative correlation'], not: ['insufficient evidence', 'no evidence'] }] };
    const run = t => { currentQ = fake; document.getElementById('testAnswer').value = t; markAnswer(); return lastResult.scored; };
    const r = [run('There is evidence of negative correlation.'), run('There is insufficient evidence of negative correlation.'), run('No evidence of negative correlation.')]; qStats.topics = {}; return r; });
  ok(blk.join() === '1,0,0', 'blocking phrases stop wrong answers that contain a correct keyword (' + blk.join() + ')');
  const both = await p.evaluate(() => { const fake = { subject: 'Chemistry', topic: 'Transition Elements', q: 'test2', marks: 1, model: '', points: [{ label: 'shape + CN', keywords: ['octahedral && 6'] }] };
    const run = t => { currentQ = fake; document.getElementById('testAnswer').value = t; markAnswer(); return lastResult.scored; };
    const r = [run('Octahedral, coordination number 6'), run('Coordination number 6'), run('Octahedral')]; qStats.topics = {}; return r; });
  ok(both.join() === '1,0,0', '"a && b" keywords need every part (' + both.join() + ')');
  const norms = await p.evaluate(() => [['1 < k < 4', '1<k<4'], ['x ≤ 3', 'x <= 3'], ['2π', '2pi'], ['√2', 'sqrt2'], ['Sₙ', 'Sn'], ['A → B', 'A->B']].every(([a, b]) => normMark(a) === normMark(b)));
  ok(norms, 'symbol and spacing variants mark the same (<, ≤, π, √, ₙ, →)');
  const notOk = await p.evaluate(() => QUESTIONS.filter(q => q.points.some(pt => pt.not && pt.not.some(k => keywordHit(normMark(q.model), k)))).length);
  ok(notOk === 0, 'no blocking phrase blocks its own model answer');
  // 2. A* tips on every spec-completion topic, styled as tips
  const at = await p.evaluate(() => { const sc = Object.entries(NOTES).flatMap(([s, a]) => a.map((t, i) => ({ s, t, i })).filter(x => /^Spec completion — /.test(x.t.title)));
    const missing = sc.filter(x => { const l = x.t.sections[x.t.sections.length - 1]; return !(l && l.heading === 'A* tips & common mistakes' && l.points.length >= 3); }).map(x => x.t.title);
    const one = sc[0]; notesSubject = one.s; showView('notes'); openNotesAt(one.s, one.i);
    return { n: sc.length, missing, styled: document.querySelectorAll('ul.astar-list').length > 0 }; });
  ok(at.n === 76 && at.missing.length === 0, 'all 76 spec-completion topics end with A* tips (' + at.missing.slice(0, 3).join(', ') + ')');
  ok(at.styled, 'A* tips are styled as tips');
  // 3. Practise a spec point from the checklist
  await p.evaluate(() => { specSubject = 'Maths'; specFilter = 'all'; specGapsOnly = false; showView('spec'); const d = document.querySelector('.spec-mod'); d.open = true; });
  await p.waitForSelector('.spec-q', { timeout: 3000 }).catch(() => {});
  const code = await p.evaluate(() => { const row = document.querySelector('.spec-q').closest('.spec-row'); return row.querySelector('.spec-code').textContent; });
  await p.click('.spec-q'); await p.waitForTimeout(200);
  const f = await p.evaluate(c => ({ view: currentView, focus: testTopicFocus, inSpec: currentQ && currentQ.spec && currentQ.spec.includes(c), chip: (document.querySelector('.insight-focus') || {}).textContent || '' }), code);
  ok(f.view === 'test' && f.inSpec && /spec point/.test(f.chip), 'Practise opens a question on that spec point (' + code + ', ' + f.chip.slice(0, 40) + ')');
  const stays = await p.evaluate(c => { for (let i = 0; i < 8; i++) { newQuestion(); if (!currentQ.spec || !currentQ.spec.includes(c)) return false; } return true; }, code);
  ok(stays, 'next questions stay on that spec point');
  await p.click('.insight-x'); ok(await p.evaluate(() => testTopicFocus === null), 'clearing the focus works');
  // 4. Links
  const links = await p.evaluate(() => { specSubject = 'Chemistry'; showView('spec'); document.querySelectorAll('.spec-mod').forEach(d => d.open = true);
    return new Promise(r => setTimeout(() => { const a = [...document.querySelectorAll('#specBody .ext-links a')]; showView('exams'); const pp = [...document.querySelectorAll('#paperSources a')];
      r({ spec: a.length, pp: pp.length, safe: [...a, ...pp].every(x => x.href.startsWith('https://') && x.target === '_blank' && /noopener/.test(x.rel)), hosts: [...new Set([...a, ...pp].map(x => new URL(x.href).host))] }); }, 200)); });
  ok(links.spec === 12 && links.pp === 8, 'Chemistry modules show PMT + Save My Exams links, and Exams shows 8 past-paper links (' + links.spec + ', ' + links.pp + ')');
  ok(links.safe && links.hosts.every(h => /physicsandmathstutor\.com|savemyexams\.com/.test(h)), 'links are https, open in a new tab, and only go to PMT / Save My Exams');
  const ml = await p.evaluate(() => { specSubject = 'Maths'; showView('spec'); document.querySelectorAll('.spec-mod').forEach(d => d.open = true); return new Promise(r => setTimeout(() => r([...document.querySelectorAll('#specBody .ext-links a')].map(a => a.href)), 200)); });
  ok(ml.filter(u => /maths-revision\/a-level-edexcel\//.test(u)).length === 19 && ml.filter(u => /savemyexams/.test(u)).length === 3, 'Maths shows a PMT link for each of the 19 topics and 3 Save My Exams links');
  ok(errs.length === 0, 'no errors (' + errs.join('|') + ')');
  await b.close(); console.log(fails ? '\n' + fails + ' FAILED' : '\nALL PASS'); process.exit(fails ? 1 : 0);
})();

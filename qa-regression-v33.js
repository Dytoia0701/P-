// v33 tests: quick log, study time, mistake book, blurting, spec checklists, combo caller, fight camp,
// share backup, swipe, weekly report, shortcuts, hardening.  Usage: node qa-regression-v33.js [folder]
const { chromium } = require(process.env.PLAYWRIGHT_PATH || '/opt/node22/lib/node_modules/playwright');
const path = require('path'); const fs = require('fs'); const dir = path.resolve(process.argv[2] || __dirname);
let fails = 0; const ok = (c, m) => { console.log((c ? 'PASS' : 'FAIL') + ': ' + m); if (!c) fails++; };
const today = (off = 0) => { const [y, m, d] = new Date().toLocaleDateString('en-CA', { timeZone: 'Europe/London' }).split('-').map(Number); return new Date(Date.UTC(y, m - 1, d + off)).toISOString().slice(0, 10); };
const seedJs = o => Object.entries(o).map(([k, v]) => `localStorage.setItem(${JSON.stringify(k)},${JSON.stringify(JSON.stringify(v))});`).join('');
(async () => {
  const b = await chromium.launch({ executablePath: process.env.CHROMIUM_PATH || '/opt/pw-browsers/chromium', args: ['--no-sandbox'] });
  const url = 'file://' + dir + '/index.html';
  const mk = async (init, opts = {}) => { const ctx = await b.newContext({ serviceWorkers: 'block', viewport: { width: 390, height: 844 }, timezoneId: 'Europe/London', acceptDownloads: true, ...opts }); const p = await ctx.newPage(); const errs = [], dialogs = []; p.on('pageerror', e => errs.push(e.message)); p.on('dialog', d => { dialogs.push(d.message()); d.accept(); }); if (init) await p.addInitScript(init); await p.goto(url + (opts.hash || '')); return { ctx, p, errs, dialogs }; };

  // ===== 1. Quick log from the week plan =====
  { const { ctx, p, errs, dialogs } = await mk(seedJs({ bp_workoutLog_v1: [{ id: 'old1', date: today(-7), type: 'x', exercise: 'Back Squat', sets: 4, reps: '5', load: 92.5, rpe: 8 }] }));
    const parsed = await p.evaluate(() => ['Back Squat 4x5 @RPE7-8', 'Bulgarian Split Squat 3x8/side', 'Box Jumps 4x3 (submax)', '6x3min shadowboxing (footwork focus)', '8x3min shadowboxing — numbered combos, full extension', 'Weighted Plank 3x40s', 'Jump rope finisher 5x1min high-tempo', 'Light walk 20-30min', 'Neck harness: flex/ext/lateral 3x15'].map(parsePlanItem));
    const want = [['Back Squat', 4, '5'], ['Bulgarian Split Squat', 3, '8/side'], ['Box Jumps', 4, '3'], ['shadowboxing (footwork focus)', 6, '3min'], ['shadowboxing — numbered combos, full extension', 8, '3min'], ['Weighted Plank', 3, '40s'], ['Jump rope finisher', 5, '1min'], ['Light walk 20-30min', 1, ''], ['Neck harness: flex/ext/lateral', 3, '15']];
    ok(parsed.every((x, i) => x.exercise === want[i][0] && x.sets === want[i][1] && x.reps === want[i][2]), 'plan lines parse into exercise / sets / reps (' + parsed.map(x => x.exercise + '|' + x.sets + '|' + x.reps).join('; ') + ')');
    await p.evaluate(() => { quickLogDay = 'Monday'; quickLogRows = null; showView('training'); });
    ok(await p.evaluate(() => quickLogRows[0].exercise === 'Back Squat' && quickLogRows[0].load === 92.5), 'last logged weight pre-fills (Back Squat 92.5 kg)');
    const rows = p.locator('#quickLog .ql-row');
    await rows.nth(2).locator('input[type=checkbox]').uncheck();
    await rows.nth(0).locator('input[placeholder=kg]').fill('95'); await rows.nth(0).locator('input[placeholder=RPE]').fill('8');
    await rows.nth(1).locator('input[placeholder=RPE]').fill('12'); await p.click('#quickLog .btn-primary');
    ok(dialogs.some(d => /RPE/.test(d)) && await p.evaluate(() => workoutLog.length) === 1, 'an impossible RPE (12) is rejected before saving');
    await rows.nth(1).locator('input[placeholder=RPE]').fill('7'); await p.click('#quickLog .btn-primary');
    const r = await p.evaluate(d => ({ n: workoutLog.filter(w => w.date === d).length, sq: workoutLog.find(w => w.date === d && w.exercise === 'Back Squat'), box: workoutLog.some(w => w.date === d && w.exercise === 'Box Jumps'), msg: document.getElementById('quickLog').textContent }), today());
    ok(r.n === 4 && r.sq.load === 95 && r.sq.rpe === 8 && r.sq.sets === 4 && r.sq.type === 'Lower Body Strength + Power' && !r.box, 'saves the ticked rows (4 of 5) with weights and RPE');
    ok(/Saved 4 exercises/.test(r.msg), 'confirms what was saved');
    ok(await p.evaluate(() => stalledLifts !== undefined && exerciseHistory().some(e => e.name === 'Back Squat' && e.sessions.length === 2)), 'quick-logged lifts feed Progress');
    ok(errs.length === 0, 'no errors (' + errs.join('|') + ')'); await ctx.close(); }

  // ===== 2. Study time =====
  { const { ctx, p, errs } = await mk(); await p.clock.install({ time: new Date(Date.now()) });
    await p.evaluate(() => showView('timer')); await p.selectOption('#focusSubject', 'Biology'); await p.fill('#focusTopic', 'enzymes');
    await p.click('button:text-is("Start study session")'); await p.clock.fastForward(25 * 60 * 1000 + 500);
    let s = await p.evaluate(() => studyLog.map(x => x.subject + '|' + x.topic + '|' + x.minutes + '|' + x.source));
    ok(JSON.stringify(s) === '["Biology|enzymes|25|timer"]', 'a finished 25-minute session logs 25 min of Biology (' + s + ')');
    await p.evaluate(() => startStudyFocus(1500)); await p.clock.fastForward(6 * 60 * 1000); await p.evaluate(() => resetTimer());
    await p.evaluate(() => startStudyFocus(1500)); await p.clock.fastForward(2 * 60 * 1000); await p.evaluate(() => resetTimer());
    s = await p.evaluate(() => studyLog.map(x => x.minutes)); ok(JSON.stringify(s) === '[25,6]', 'reset after 6 min logs 6 min; reset after 2 min logs nothing (' + s + ')');
    await p.evaluate(() => { startStudyFocus(600); startPreset(180); }); await p.clock.fastForward(181000);
    ok(await p.evaluate(() => studyLog.length) === 2, 'starting a boxing preset cancels the pending study session');
    await p.fill('#stMinutes', '40'); await p.selectOption('#stSubject', 'Maths'); await p.click('#studyTimeBox button:text-is("Add")');
    const m = await p.evaluate(() => studyMinutes(weekAgoISO(), localISODate())); ok(m.Biology === 31 && m.Maths === 40, 'manual entry adds 40 min of Maths (' + JSON.stringify(m) + ')');
    ok(await p.evaluate(() => /Study time · last 7 days · 1 h 11 min/.test(document.getElementById('studyTimeBox').textContent)), 'study card shows the weekly total');
    await p.evaluate(() => { studyLog.push({ id: 'x1', date: localISODate(), subject: 'Chemistry', topic: '', minutes: 200, source: 'manual' }); persistStudy(); });
    ok(await p.evaluate(() => coachReplyPlan({}).items.some(i => i.id === 'balance' && /Biology/.test(i.title))), 'Coach flags the neglected subject (Biology: 31 min vs 3 h 20 min Chemistry)');
    ok(errs.length === 0, 'no errors (' + errs.join('|') + ')'); await ctx.close(); }

  // ===== 3. Mistake book =====
  { const { ctx, p, errs } = await mk();
    await p.evaluate(() => { const q = QUESTIONS.find(x => x.q.startsWith('The rate doubles when [A] doubles')); testSubjectFilter = 'Chemistry'; showView('test'); currentQ = q; lastResult = null; renderTest(); });
    await p.fill('#testAnswer', 'zero order in B'); await p.click('text=Mark My Answer');
    let k = await p.evaluate(() => Object.values(mistakes).map(m => m.type + ':' + m.label)); ok(k.length === 2 && k.every(x => x.startsWith('quiz:')), 'missed quiz mark points are added (' + k.join(', ') + ')');
    const full = 'First order with respect to A; zero order with respect to B; rate = k[A], overall order is 1';
    for (let i = 0; i < 2; i++) { await p.evaluate(() => { lastResult = null; renderTest(); }); await p.fill('#testAnswer', full); await p.click('text=Mark My Answer'); }
    ok(await p.evaluate(() => Object.keys(mistakes).length) === 0, 'two correct answers clear them');
    await p.evaluate(() => { lastResult = null; renderTest(); }); await p.fill('#testAnswer', 'no idea really'); await p.click('text=Mark My Answer');
    await p.evaluate(() => showView('mistakes')); await p.locator('#mistakesBody button:text-is("Practise")').first().click();
    ok(await p.evaluate(() => currentView === 'test' && currentQ.q.startsWith('The rate doubles')), 'Practise reopens the exact question');
    await p.evaluate(() => { Object.keys(mistakes).forEach(k => delete mistakes[k]); const c = cardIndex()[5]; cardSession = { queue: [c.key], done: 0, again: 0, flipped: true, total: 1 }; showView('cards'); });
    await p.click('.fc-btn.r-again'); ok(await p.evaluate(() => Object.values(mistakes).some(m => m.type === 'card')), 'flashcard "Again" adds a mistake');
    await p.click('.fc-flip'); await p.click('.fc-btn.r-good'); ok(await p.evaluate(() => Object.values(mistakes)[0].streak) === 1, 'one correct go is counted');
    await p.evaluate(() => showView('mistakes')); await p.locator('#mistakesBody button:text-is("Remove")').first().click(); ok(await p.evaluate(() => Object.keys(mistakes).length) === 0, 'mistakes can be removed by hand');
    ok(errs.length === 0, 'no errors (' + errs.join('|') + ')'); await ctx.close(); }

  // ===== 4. Blurting =====
  { const { ctx, p, errs, dialogs } = await mk();
    const sc = await p.evaluate(() => { const t = NOTES.Biology[0], all = t.sections.flatMap(s => s.points).join(' '); return { full: blurtMark('Biology', 0, all).pct, junk: blurtMark('Biology', 0, 'I remember there was something about cells and stuff happening in a lab').pct }; });
    ok(sc.full === 100 && sc.junk < 30, 'marking: pasting the notes scores 100%, vague text scores low (' + sc.junk + '%)');
    await p.evaluate(() => { blurtSubject = 'Biology'; blurtIndex = 0; showView('blurt'); }); await p.fill('#blurtText', 'short'); await p.click('button:text-is("Mark my recall")');
    ok(dialogs.some(d => /bit more/.test(d)), 'too-short answers are not marked');
    const half = await p.evaluate(() => NOTES.Biology[0].sections[0].points.join(' '));
    await p.fill('#blurtText', half); await p.click('button:text-is("Mark my recall")');
    const res = await p.evaluate(() => ({ text: document.getElementById('blurtBody').textContent, hist: blurtHistory['Biology|' + NOTES.Biology[0].title] }));
    ok(/You recalled about \d+%/.test(res.text) && res.hist && res.hist.n === 1, 'result shown and saved to history (' + (res.hist && res.hist.last) + '%)');
    await p.locator('#blurtBody button', { hasText: 'to the mistake book' }).click();
    ok(await p.evaluate(() => Object.values(mistakes).some(m => m.type === 'note')), 'missed points can go to the mistake book');
    await p.evaluate(() => showView('mistakes')); await p.locator('#mistakesBody button:text-is("Open notes")').first().click();
    ok(await p.evaluate(() => currentView === 'notes' && notesSubject === 'Biology'), 'a blurt mistake opens the right notes');
    ok(errs.length === 0, 'no errors (' + errs.join('|') + ')'); await ctx.close(); }

  // ===== 5. Spec checklists =====
  { const { ctx, p, errs } = await mk(seedJs({ bp_exams_v1: [{ id: 'x1', name: 'Bio P1', subject: 'Biology', date: today(10) }] }));
    const info = await p.evaluate(() => Object.fromEntries(Object.entries(SPECS).map(([k, v]) => [k, v.points.length])));
    ok(info.Biology >= 200 && info.Maths >= 80, 'spec checklists loaded (' + JSON.stringify(info) + ')');
    ok(await p.evaluate(() => Object.values(SPECS).every(s => new Set(s.points.map(x => x.code)).size === s.points.length && s.points.every(x => x.code && x.module && x.topic && x.point))), 'every point has a unique code and all fields');
    await p.evaluate(() => { specSubject = 'Biology'; specFilter = 'all'; showView('spec'); });
    const mod1 = await p.locator('.spec-mod').first().locator('.spec-mod-count').textContent(); const m1 = await p.evaluate(() => SPECS.Biology.points.filter(x => x.module === SPECS.Biology.points[0].module).length);
    ok(mod1 === '0/' + m1 + ' ✓', 'module count uses that module\'s total (' + mod1 + ')');
    await p.locator('.spec-mod summary').first().click(); await p.locator('.spec-row').first().locator('.rag-r').click(); await p.locator('.spec-row').nth(1).locator('.rag-g').click();
    const st = await p.evaluate(() => JSON.parse(localStorage.getItem('bp_specRag_v1'))); ok(st['Biology|1.1.1(a)'] === 'r' && Object.values(st).filter(v => v === 'g').length === 1, 'ratings saved (' + JSON.stringify(st) + ')');
    ok(/1\/\d+ ✓/.test(await p.locator('.spec-mod').first().locator('.spec-mod-count').textContent()), 'module count updates live');
    await p.locator('.spec-row').first().locator('.rag-r').click(); ok(await p.evaluate(() => !('Biology|1.1.1(a)' in specRag)), 'tapping the same rating again clears it');
    await p.locator('.spec-row').first().locator('.rag-r').click();
    await p.click('#specBody .seg-btn:text-is("✗ Red")'); ok(await p.evaluate(() => { document.querySelectorAll('.spec-mod').forEach(d => d.open = true); return [...document.querySelectorAll('.spec-row')].length === 1; }), 'Red filter shows only red points');
    const plan = await p.evaluate(() => coachReplyPlan({}).items.find(i => i.id === 'spec')); ok(plan && /Biology/.test(plan.title) && /1.1.1\(a\)/.test(plan.detail), 'Coach suggests red spec points for the upcoming exam subject');
    await p.locator('.spec-row').first().locator('.rag-find').click(); ok(await p.evaluate(() => overlayIsOpen() && document.getElementById('globalSearchInput').value.length > 2), '🔎 searches your notes for that point');
    ok(errs.length === 0, 'no errors (' + errs.join('|') + ')'); await ctx.close(); }

  // ===== 6. Combo caller =====
  { const { ctx, p, errs } = await mk(); await p.clock.install({ time: new Date('2026-03-02T12:00:00Z') });
    await p.evaluate(() => { showView('timer'); ivCfg = normalizeTimerCfg({ rounds: 2, roundSec: 30, restSec: 10, prepSec: 0, warn: false, combos: true, comboPace: 2.5 }); ivRenderInputs(); window.__calls = []; window.comboSay = t => window.__calls.push([Date.now(), t]); window.ivBeep = () => {}; ivStart(); window.__t0 = Date.now(); });
    for (let i = 0; i < 300; i++) await p.clock.fastForward(250);
    const calls = await p.evaluate(() => window.__calls.map(c => (c[0] - window.__t0) / 1000));
    const inRest = calls.filter(t => t > 30 && t < 40), lastSecs = calls.filter(t => (t > 27 && t <= 30) || (t > 67));
    ok(calls.length >= 12 && inRest.length === 0 && lastSecs.length === 0, 'combos are called through both rounds, not during rest or the last 3 s (' + calls.length + ' calls)');
    ok(await p.evaluate(() => { const c = normalizeTimerCfg({ combos: true, comboPace: 99 }); return c.combos === true && c.comboPace === 3.5 && normalizeTimerCfg(null).combos === false; }), 'combo settings are validated and off by default');
    ok(errs.length === 0, 'no errors (' + errs.join('|') + ')'); await ctx.close(); }

  // ===== 7. Fight camp =====
  { const entries = []; for (let i = 13; i >= 0; i--) entries.push({ date: today(-i), kg: 66 });
    const { ctx, p, errs, dialogs } = await mk(seedJs({ bp_bodyweight_v1: { entries, target: null } }));
    ok(await p.evaluate(() => [60, 40, 20, 10, 3, 0, -1].map(d => (campPhase(d) || { label: 'none' }).label).join(',')) === 'Base,Build,Peak,Taper,Fight week,Fight week,none', 'phase boundaries (60→Base … 3→Fight week, past→none)');
    await p.evaluate(() => showView('camp')); await p.fill('#campName', 'Regional final'); await p.fill('#campFight', today(42)); await p.fill('#campLimit', '64'); await p.click('button:text-is("Save camp")');
    const t = await p.evaluate(() => document.getElementById('campBody').textContent);
    ok(/REGIONAL FINAL/.test(t) && /42/.test(t) && /Now: Build/.test(t), 'camp shows countdown and current phase (' + t.slice(0, 60).replace(/\s+/g, ' ') + '…)');
    ok(/2 kg over the limit/.test(t) && /Needs about 0\.34 kg a week/.test(t), 'weight plan uses the bodyweight log (66 → 64 kg in 41 days)');
    ok(/not by dehydrating/.test(t), 'includes the make-weight-safely note');
    await p.click('button:text-is("Use as my bodyweight target")'); ok(await p.evaluate(d => body.target && body.target.kg === 64 && body.target.date === d, today(41)), 'sets the bodyweight target to the limit and weigh-in date');
    ok(await p.evaluate(() => coachReplyPlan({}).lines.some(l => /Fight camp: 42 days to Regional final \(Build phase\)/.test(l))), 'Coach mentions the camp');
    await p.click('button:text-is("Edit camp")'); await p.fill('#campLimit', '400'); await p.click('button:text-is("Save camp")'); ok(dialogs.some(d => /25–300/.test(d)), 'impossible weight limit rejected');
    ok(errs.length === 0, 'no errors (' + errs.join('|') + ')'); await ctx.close(); }

  // ===== 8. Share backup =====
  { const { ctx, p } = await mk(seedJs({ bp_tasks_v1: [{ id: 't1', title: 'x', status: 'next' }] }));
    await p.evaluate(() => { window.__shared = null; navigator.canShare = () => true; navigator.share = async d => { window.__shared = d; }; showView('system'); });
    await p.click('button:has-text("Share backup")'); await p.waitForTimeout(100);
    const r = await p.evaluate(async () => { const f = window.__shared && window.__shared.files && window.__shared.files[0]; return { type: f && f.type, name: f && f.name, json: f && JSON.parse(await f.text()), last: !!localStorage.getItem('bp_lastBackup_v1') }; });
    ok(r.name && /^bridge-protocol-backup-\d{4}-\d{2}-\d{2}\.txt$/.test(r.name) && r.json.format === 'bridge-protocol-backup' && /^v\d+$/.test(r.json.appVersion) && r.json.data.bp_tasks_v1.length === 1 && r.last, 'shares a valid backup file and records the backup date');
    await ctx.close(); }
  { const { ctx, p } = await mk(); await p.evaluate(() => { navigator.canShare = undefined; showView('system'); });
    const [dl] = await Promise.all([p.waitForEvent('download'), p.click('button:has-text("Share backup")')]); ok(/\.json$/.test(dl.suggestedFilename()), 'falls back to a download where sharing is not supported'); await ctx.close(); }

  // ===== 9. Swipe between tabs =====
  { const { ctx, p } = await mk(null, { hasTouch: true, isMobile: true });
    const swipe = (sel, dx) => p.evaluate(([s, d]) => { const el = document.querySelector(s); const r = el.getBoundingClientRect(), x = r.left + r.width / 2, y = r.top + 20; const mkT = (X, Y) => new Touch({ identifier: 1, target: el, clientX: X, clientY: Y }); el.dispatchEvent(new TouchEvent('touchstart', { touches: [mkT(x, y)], changedTouches: [mkT(x, y)], bubbles: true })); el.dispatchEvent(new TouchEvent('touchend', { touches: [], changedTouches: [mkT(x + d, y + 5)], bubbles: true })); }, [sel, dx]);
    await p.evaluate(() => showView('notes')); await swipe('#view-notes .checklist-hint', -120); ok(await p.evaluate(() => currentView) === 'cards', 'swipe left moves to the next tab (Notes → Flashcards)');
    await swipe('#view-cards .view-subtitle', 120); ok(await p.evaluate(() => currentView) === 'notes', 'swipe right moves back');
    await swipe('#view-notes .subject-tabs', -120); ok(await p.evaluate(() => currentView) === 'notes', 'swipes on horizontal controls are ignored');
    await swipe('#view-notes .checklist-hint', 120); ok(await p.evaluate(() => currentView) === 'notes', 'no wrap-around at the first tab');
    await ctx.close(); }

  // ===== 10. Weekly report =====
  { const { ctx, p } = await mk(seedJs({ bp_studyLog_v1: [{ id: 's1', date: today(-1), subject: 'Biology', minutes: 90, source: 'manual' }], bp_checkins_v1: { [today(-2)]: { sleep: 7, energy: 4, soreness: 2 } } }));
    await p.evaluate(() => { window.__shared = null; navigator.share = async d => { window.__shared = d; }; window.print = () => { window.__printed = document.body.classList.contains('printing-report'); }; showView('weekly'); });
    const t = await p.evaluate(() => document.getElementById('weeklyReport').textContent);
    ok(/Study time1 h 30 min/.test(t) && /Sleepaverage 7 h over 1 check-in/.test(t) && /Spec points confident/.test(t), 'report summarises study, sleep and spec progress');
    await p.click('#weeklyReport button:text-is("Share")'); ok(await p.evaluate(() => window.__shared && /Weekly report/.test(window.__shared.title) && /Study time: 1 h 30 min/.test(window.__shared.text)), 'Share sends the report as text');
    await p.click('#weeklyReport button:has-text("PDF")'); ok(await p.evaluate(() => window.__printed === true), 'Save as PDF prints only the report');
    await ctx.close(); }

  // ===== 11. Shortcuts, tabs =====
  { const man = JSON.parse(fs.readFileSync(path.join(dir, 'manifest.json'), 'utf8'));
    ok(Array.isArray(man.shortcuts) && man.shortcuts.length === 4 && man.shortcuts.every(s => /^\.\/index\.html#\/(command|timer|cards|coach)$/.test(s.url)), 'manifest has 4 home-screen shortcuts with deep links');
    const { ctx, p } = await mk(null, { hash: '#/timer' }); ok(await p.evaluate(() => currentView) === 'timer', 'shortcut link opens the Timer directly');
    await p.evaluate(() => { showView('checklist'); showView('training'); });
    ok(await p.evaluate(() => { const box = document.getElementById('hubTabs'), a = document.querySelector('#hubTabs .hub-tab.active'), br = box.getBoundingClientRect(), ar = a.getBoundingClientRect(); return ar.left >= br.left - 1 && ar.right <= br.right + 1; }), 'the active section tab is always scrolled into view');
    await ctx.close(); }

  // ===== 12. Hardening =====
  { const keys = ['bp_studyLog_v1', 'bp_mistakes_v1', 'bp_blurt_v1', 'bp_specRag_v1', 'bp_camp_v1'];
    const bad = { garbage: '{{x', nul: 'null', num: '5', arr: '[1,null,{"date":"x","minutes":"lots"}]', obj: '{"q|x":{"misses":"many"},"n|":null,"Biology|1.1.1(a)":"purple","fightDate":"soon","Biology|T":{"best":500}}' };
    for (const [n, v] of Object.entries(bad)) { const probs = [];
      for (const k of keys) { const { ctx, p, errs } = await mk(`localStorage.setItem(${JSON.stringify(k)},${JSON.stringify(v)})`); await p.evaluate(() => { APP_VIEWS.forEach(x => showView(x)); coachReplyPlan({}); coachAnswer('how is my week going'); weeklyReportData(); }); if (errs.length) probs.push(k + ': ' + errs[0]); await ctx.close(); }
      ok(!probs.length, 'corrupt payload "' + n + '" in every new key is survivable' + (probs.length ? ' → ' + probs.join(' ; ') : '')); } }
  { const { ctx, p, errs } = await mk();
    const r = await p.evaluate(async d => {
      const data = { bp_studyLog_v1: [{ date: d, subject: 'Physics', minutes: 9999 }, { date: 'x', minutes: 5 }], bp_mistakes_v1: { 'q|Chemistry|x|y': { subject: 'Chemistry', label: 'L', misses: 3 }, 'z|bad': {} }, bp_specRag_v1: { 'Biology|1.1.1(a)': 'g', 'Biology|2.1.1(a)': 'x' }, bp_camp_v1: { name: 'Show', fightDate: d, weighInDate: '2099-01-01', limitKg: 999 }, bp_blurt_v1: { 'Biology|T': { best: 80, last: 60 } } };
      const dt = new DataTransfer(); dt.items.add(new File([JSON.stringify({ format: 'bridge-protocol-backup', data })], 'b.json')); const inp = document.createElement('input'); inp.type = 'file'; inp.files = dt.files; importBackupFile(inp); await new Promise(r => setTimeout(r, 300));
      return { study: studyLog, m: Object.keys(mistakes), rag: specRag, camp, blurt: blurtHistory };
    }, today(5));
    ok(r.study.length === 1 && r.study[0].subject === 'Other' && r.study[0].minutes === 600, 'import cleans study log (unknown subject → Other, minutes capped)');
    ok(JSON.stringify(r.m) === '["q|Chemistry|x|y"]' && JSON.stringify(r.rag) === '{"Biology|1.1.1(a)":"g"}', 'import cleans mistakes and spec ratings');
    ok(r.camp && r.camp.weighInDate === today(4) && r.camp.limitKg === 300 && r.blurt['Biology|T'].best === 80, 'import fixes an impossible weigh-in date and clamps the limit');
    const z = await p.evaluate(() => { resetAllAppData(); return { s: studyLog.length, m: Object.keys(mistakes).length, r: Object.keys(specRag).length, c: camp, b: Object.keys(blurtHistory).length }; });
    ok(!z.s && !z.m && !z.r && z.c === null && !z.b, 'reset clears every new feature');
    ok(errs.length === 0, 'no errors (' + errs.join('|') + ')'); await ctx.close(); }

  // ===== 13. Fixes from the independent review and the monkey test =====
  { const { ctx, p, dialogs } = await mk(); await p.clock.install({ time: new Date('2026-10-19T20:00:00+01:00') }); // Monday evening
    await p.evaluate(() => showView('training')); const mon = await p.evaluate(() => quickLogRows[0].exercise);
    await p.clock.setSystemTime(new Date('2026-10-20T20:00:00+01:00')); await p.evaluate(() => { showView('command'); showView('training'); });
    const tue = await p.evaluate(() => ({ first: quickLogRows[0].exercise, title: document.querySelector('#quickLog .insight-note').textContent }));
    ok(mon === 'Back Squat' && tue.first === 'DB Flat Bench' && /Upper Push/.test(tue.title), 'quick log rebuilds after midnight (Mon → Tue plan)');
    await p.clock.setSystemTime(new Date('2026-10-21T20:00:00+01:00')); await p.evaluate(() => saveQuickLog());
    ok(dialogs.some(d => /new day/.test(d)) && await p.evaluate(() => workoutLog.length) === 0, 'saving a stale list after midnight refreshes instead of saving wrong entries');
    await ctx.close(); }
  { const { ctx, p } = await mk(); await p.clock.install({ time: new Date(Date.now()) }); await p.evaluate(() => showView('timer'));
    await p.evaluate(() => startStudyFocus(1500)); await p.clock.fastForward(20 * 60000); await p.evaluate(() => startPreset(300));
    await p.evaluate(() => startStudyFocus(1500)); await p.clock.fastForward(12 * 60000); await p.evaluate(() => startStudyFocus(1500));
    ok(JSON.stringify(await p.evaluate(() => studyLog.map(s => s.minutes))) === '[20,12]', 'starting another timer mid-session still logs the minutes done (20, 12)');
    await p.fill('#focusTopic', 'a'.repeat(80)); await p.evaluate(() => { startStudyFocus(600); }); await p.clock.fastForward(601000);
    ok(await p.evaluate(() => document.documentElement.scrollWidth <= innerWidth + 1), 'a long unbroken topic name does not make the page scroll sideways');
    await ctx.close(); }
  { const { ctx, p, errs } = await mk();
    const r = await p.evaluate(async () => { const file = new File([buildBackupJSON().replace('"bp_', '"bp_')], 'bridge-protocol-backup.txt', { type: 'text/plain' }); localStorage.setItem('bp_studyLog_v1', '[]');
      const data = JSON.parse(await file.text()); data.data.bp_studyLog_v1 = [{ date: localISODate(), subject: 'Maths', minutes: 30 }]; const f2 = new File([JSON.stringify(data)], 'b.txt', { type: 'text/plain' });
      const dt = new DataTransfer(); dt.items.add(f2); const inp = document.createElement('input'); inp.type = 'file'; inp.files = dt.files; importBackupFile(inp); await new Promise(r => setTimeout(r, 300)); return { n: studyLog.length, accept: document.getElementById('backupFile').accept }; });
    ok(r.n === 1 && /\.txt/.test(r.accept), 'a shared .txt backup restores, and the picker accepts .txt');
    ok(errs.length === 0, 'no errors (' + errs.join('|') + ')'); await ctx.close(); }
  { const { ctx, p } = await mk();
    await p.evaluate(() => { blurtSubject = 'Biology'; blurtIndex = 0; showView('blurt'); });
    await p.fill('#blurtText', 'cells and microscopes and things that I can remember from class'); await p.click('button:text-is("Mark my recall")');
    await p.locator('#blurtBody button', { hasText: 'to the mistake book' }).click(); const before = await p.evaluate(() => Object.keys(mistakes).length);
    const full = await p.evaluate(() => NOTES.Biology[0].sections.flatMap(s => s.points).join(' '));
    for (let i = 0; i < 2; i++) { await p.click('button:text-is("Try again")'); await p.fill('#blurtText', full); await p.click('button:text-is("Mark my recall")'); }
    ok(before > 0 && await p.evaluate(() => Object.keys(mistakes).length) === 0, 'blurt mistakes clear after two full recalls (' + before + ' → 0)');
    await p.click('button:text-is("Try again")'); await p.fill('#blurtText', 'draft text for topic one'); await p.selectOption('.blurt-select', '2');
    ok(await p.evaluate(() => document.getElementById('blurtText').value) === '', 'changing topic clears the old answer');
    await p.evaluate(() => { for (let i = 0; i < 650; i++) mistakeMiss('c|k' + i, { type: 'card', subject: 'Biology', topic: 't', label: 'l', ref: 'k' + i }); });
    await p.reload(); ok(await p.evaluate(() => Object.keys(mistakes).length === 600 && !!mistakes['c|k649'] && !mistakes['c|k0']), 'mistake book keeps the newest 600');
    await ctx.close(); }
  { const { ctx, p } = await mk(); await p.evaluate(() => showView('weekly')); await p.emulateMedia({ media: 'print' });
    await p.evaluate(() => document.body.classList.add('printing-report'));
    const pr = await p.evaluate(() => ({ nav: getComputedStyle(document.querySelector('nav')).display, header: getComputedStyle(document.querySelector('header')).display, metrics: getComputedStyle(document.getElementById('weeklyMetrics')).display, report: getComputedStyle(document.getElementById('weeklyReport')).display }));
    ok(pr.nav === 'none' && pr.header === 'none' && pr.metrics === 'none' && pr.report !== 'none', 'print layout removes everything but the report (no blank pages)');
    await p.emulateMedia({ media: 'screen' }); await ctx.close(); }
  { const { ctx, p } = await mk(seedJs({ bp_bodyweight_v1: { entries: [{ date: today(-60), kg: 70 }], target: null }, bp_camp_v1: { name: 'Show', fightDate: today(30), weighInDate: today(29), limitKg: 64 } }));
    await p.evaluate(() => showView('camp')); const t = await p.evaluate(() => document.getElementById('campBody').textContent);
    ok(/No weigh-in in the last 7 days/.test(t) && /Last weigh-in 70 kg/.test(t) && !/7-day average/.test(t), 'camp no longer calls a 60-day-old weigh-in a 7-day average');
    await p.evaluate(() => showView('macros')); ok(/Your last weigh-in was/.test(await p.evaluate(() => document.getElementById('bodyweightBox').textContent)), 'bodyweight view flags stale numbers too');
    await ctx.close(); }

  // ===== 14. Full storage: every save path warns once and nothing crashes =====
  { const names = ['task', 'checkin', 'card', 'quiz', 'spec', 'study', 'paper', 'weight', 'camp', 'quicklog', 'schedule', 'appearance']; const bad = [];
    for (const n of names) { const { ctx, p, errs, dialogs } = await mk();
      await p.evaluate(n => { const orig = Storage.prototype.setItem; Storage.prototype.setItem = function (k) { if (String(k).startsWith('bp_')) throw new DOMException('full', 'QuotaExceededError'); return orig.apply(this, arguments); };
        const A = { task: () => { showView('tasks'); document.getElementById('taskTitle').value = 'x'; saveTask(); }, checkin: () => { checkinDraft = { sleep: 7, energy: 3, soreness: 2 }; saveCheckin(); }, card: () => { const c = cardIndex()[0]; cardSession = { queue: [c.key], done: 0, again: 0, flipped: true, total: 1 }; rateCard('good'); }, quiz: () => { showView('test'); document.getElementById('testAnswer').value = 'abc'; markAnswer(); }, spec: () => setRag('Biology', '1.1.1(a)', 'g'), study: () => { studySession = { subject: 'Maths', topic: '', planned: 600 }; recordStudySession(600); }, paper: () => { showView('exams'); document.getElementById('ppName').value = 'P'; document.getElementById('ppScore').value = '5'; document.getElementById('ppMax').value = '10'; addPaper(); }, weight: () => { showView('macros'); document.getElementById('bwKg').value = '70'; addWeight(); }, camp: () => { showView('camp'); document.getElementById('campFight').value = addDaysISO(localISODate(), 30); saveCamp(); }, quicklog: () => { showView('training'); saveQuickLog(); }, schedule: () => { scheduleCustom.Monday = { train: { title: 'x', items: [] } }; persistSchedule(); }, appearance: () => setAppearance('theme', 'light') };
        A[n](); }, n);
      if (errs.length || dialogs.length !== 1 || !/storage is full/.test(dialogs[0])) bad.push(n + ' (' + (errs[0] || dialogs.length + ' dialogs') + ')'); await ctx.close(); }
    ok(!bad.length, 'with storage full, all 12 save paths warn exactly once and nothing crashes' + (bad.length ? ': ' + bad.join(', ') : '')); }

  await b.close(); console.log(fails ? '\n' + fails + ' FAILED' : '\nALL PASS'); process.exit(fails ? 1 : 0);
})();

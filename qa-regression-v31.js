// v31 tests: interval timer, smart practice, exams/revised, Daily Coach, new-key hardening. Usage: node qa-regression-v31.js [folder]
const { chromium } = require(process.env.PLAYWRIGHT_PATH || '/opt/node22/lib/node_modules/playwright');
const path = require('path'); const dir = path.resolve(process.argv[2] || __dirname);
let fails = 0; const ok = (c, m) => { console.log((c ? 'PASS' : 'FAIL') + ': ' + m); if (!c) fails++; };
const today = (off = 0) => { const [y, m, d] = new Date().toLocaleDateString('en-CA', { timeZone: 'Europe/London' }).split('-').map(Number); return new Date(Date.UTC(y, m - 1, d + off)).toISOString().slice(0, 10); };
(async () => {
  const b = await chromium.launch({ executablePath: process.env.CHROMIUM_PATH || '/opt/pw-browsers/chromium', args: ['--no-sandbox'] });
  const mk = async (init, opts = {}) => { const ctx = await b.newContext({ serviceWorkers: 'block', viewport: { width: 390, height: 844 }, timezoneId: 'Europe/London', ...opts }); const p = await ctx.newPage(); const errs = []; p.on('pageerror', e => errs.push(e.message)); p.on('dialog', d => d.accept()); if (init) await p.addInitScript(init); await p.goto('file://' + dir + '/index.html'); return { ctx, p, errs }; };
  const seed = (o) => Object.entries(o).map(([k, v]) => `localStorage.setItem(${JSON.stringify(k)},${JSON.stringify(JSON.stringify(v))});`).join('');

  // ===== 1. Interval timer =====
  { const { ctx, p, errs } = await mk(); await p.clock.install({ time: new Date('2026-03-02T12:00:00Z') });
    await p.evaluate(() => { showView('timer'); ivCfg = normalizeTimerCfg({ rounds: 2, roundSec: 10, restSec: 5, prepSec: 3, warn: true }); ivRenderInputs(); window.__beeps = []; window.ivBeep = f => window.__beeps.push(f); });
    const st = () => p.evaluate(() => ({ ph: document.getElementById('ivPhase').textContent, clk: document.getElementById('ivClock').textContent, cls: document.getElementById('ivCard').className }));
    await p.evaluate(() => ivStart());
    ok((await st()).ph === 'GET READY', 'starts with a get-ready phase');
    await p.clock.fastForward(5000); let s = await st(); ok(s.ph === 'ROUND 1 of 2' && s.clk === '00:08' && s.cls.includes('iv-round'), 'at 5 s: round 1, 8 s left (' + s.ph + ' ' + s.clk + ')');
    await p.clock.fastForward(10000); s = await st(); ok(s.ph === 'REST' && s.cls.includes('iv-rest'), 'at 15 s: rest phase');
    await p.evaluate(() => ivPause()); await p.clock.fastForward(60000); s = await st(); ok(s.ph === 'PAUSED', 'pause holds');
    await p.evaluate(() => ivPause()); s = await st(); ok(s.ph === 'REST', 'resume continues the same phase (' + s.ph + ')');
    await p.clock.fastForward(6000); s = await st(); ok(s.ph === 'ROUND 2 of 2', 'rest ends into round 2 (' + s.ph + ')');
    await p.clock.fastForward(20000); s = await st(); ok(s.ph === 'DONE' && (await p.evaluate(() => ivInterval === null && iv === null)), 'finishes with DONE and stops its interval');
    ok(await p.evaluate(() => window.__beeps.length) >= 6, 'bell/rest/countdown/finish beeps were triggered');
    // suspended tab: one big jump must land in the right phase
    await p.evaluate(() => { ivStop(); ivStart(); }); await p.clock.fastForward(20000); s = await st(); ok(s.ph === 'ROUND 2 of 2' && s.clk === '00:08', 'a 20 s suspension lands in round 2 with 8 s left (' + s.ph + ' ' + s.clk + ')');
    // 10-second warning
    await p.evaluate(() => { ivStop(); ivCfg = normalizeTimerCfg({ rounds: 1, roundSec: 30, restSec: 0, prepSec: 0, warn: true }); ivRenderInputs(); window.__beeps = []; ivStart(); });
    await p.clock.fastForward(21000); ok((await p.evaluate(() => window.__beeps)).includes(1568), '10-second warning beep fires near the end of a round');
    // starting the simple timer stops the interval timer
    await p.evaluate(() => { ivStop(); ivStart(); startPreset(60); }); ok(await p.evaluate(() => ivInterval === null && iv === null && timerInterval !== null), 'starting the simple timer cancels the round timer');
    ok(errs.length === 0, 'no errors in timer flows (' + errs.join('|') + ')'); await ctx.close(); }

  // ===== 2. Smart practice =====
  { const { ctx, p, errs } = await mk();
    const r = await p.evaluate(() => {
      const chem = [...new Set(QUESTIONS.filter(q => q.subject === 'Chemistry').map(q => q.topic))]; const weak = chem[0];
      qStats = normalizeQStats({ mode: 'smart', topics: {} });
      chem.forEach((t, i) => { qStats.topics['Chemistry|' + t] = { h: i === 0 ? [0, 0, 0] : [1, 1, 1], n: 3, last: new Date().toISOString() }; });
      testSubjectFilter = 'Chemistry'; const count = mode => { qStats.mode = mode; let n = 0; for (let i = 0; i < 600; i++) { recentQs = []; if (pickQuestion().topic === weak) n++; } return n / 600; };
      const smart = count('smart'), rand = count('random');
      testTopicFocus = 'Chemistry|' + chem[1]; recentQs = []; let all = true; for (let i = 0; i < 30; i++) if (pickQuestion().topic !== chem[1]) all = false;
      return { smart, rand, all, base: 1 / chem.length, weak: weakTopics(3, 'Chemistry').map(x => x.topic)[0] === weak };
    });
    ok(r.smart > r.rand * 2 && r.smart > r.base * 4, 'smart mode picks the weakest topic far more often (' + (r.smart * 100).toFixed(0) + '% vs random ' + (r.rand * 100).toFixed(0) + '%, baseline ' + (r.base * 100).toFixed(0) + '%)');
    ok(r.all, 'drilling a topic only serves that topic'); ok(r.weak, 'weakTopics ranks the 0% topic first');
    // recording through the real UI path
    await p.evaluate(() => { qStats = normalizeQStats(null); testTopicFocus = null; testSubjectFilter = 'All'; showView('test'); newQuestion(); });
    await p.click('text=Mark My Answer'); ok(await p.evaluate(() => Object.keys(qStats.topics).length) === 0, 'marking an empty answer does not record a result');
    await p.evaluate(() => newQuestion()); await p.fill('#testAnswer', 'some answer text'); await p.click('text=Mark My Answer');
    ok(await p.evaluate(() => Object.keys(qStats.topics).length === 1 && JSON.parse(localStorage.getItem('bp_questionStats_v1')).topics[topicKey(currentQ)].h.length === 1), 'a marked answer is recorded and persisted');
    ok(await p.evaluate(() => /Smart/.test(document.getElementById('testInsights').textContent)), 'insights card renders'); ok(errs.length === 0, 'no errors (' + errs.join('|') + ')'); await ctx.close(); }

  // ===== 3. Exams + revised tracking =====
  { const { ctx, p, errs } = await mk();
    await p.evaluate(() => showView('exams'));
    const d10 = today(10), dPast = today(-3);
    await p.fill('#examName', 'Biology Paper 1'); await p.fill('#examDate', d10); await p.selectOption('#examSubject', 'Biology'); await p.click('button:text-is("Add exam")');
    const txt = () => p.evaluate(() => document.getElementById('examList').textContent);
    let t = await txt(); ok(t.includes('Biology Paper 1') && t.includes('10') && /not yet revised → about \d+ per day/.test(t), 'exam added with days left and a per-day pace (' + t.replace(/\s+/g, ' ').slice(0, 130) + ')');
    const before = (t.match(/about (\d+) per day/) || [])[1];
    await p.evaluate(() => { for (let i = 0; i < 30; i++) toggleRevised('Biology', i); renderExams(); });
    const after = ((await txt()).match(/about (\d+) per day/) || [])[1]; ok(+after < +before, 'marking 30 topics revised lowers the daily pace (' + before + ' → ' + after + ')');
    await p.evaluate(dp => { exams.push({ id: 'past', name: 'Old exam', subject: 'Maths', date: dp }); renderExams(); }, dPast); ok(!(await txt()).includes('Old exam'), 'past exams are not listed');
    // notes UI toggle
    await p.evaluate(() => { showView('notes'); setNotesSubject('Chemistry'); notesExpanded['Chemistry-3'] = true; renderNotes(); });
    await p.click('#note-Chemistry-3 .revised-btn'); ok(await p.evaluate(() => !!document.querySelector('#note-Chemistry-3 .revised-btn.on') && !!document.querySelector('#note-Chemistry-3 .rev-badge')), '"Mark as revised" toggles the button and header badge');
    await p.click('#note-Chemistry-3 .revised-btn'); ok(await p.evaluate(() => !document.querySelector('#note-Chemistry-3 .revised-btn.on')), 'tapping again undoes it');
    // delete
    await p.evaluate(() => showView('exams')); await p.click('#examList .exam-item .small-action'); ok(!(await txt()).includes('Biology Paper 1'), 'exam can be removed'); ok(errs.length === 0, 'no errors (' + errs.join('|') + ')'); await ctx.close(); }

  // ===== 4. Daily Coach =====
  const day = new Date().getDay();
  const coachSeed = seed({ bp_tasks_v1: [
      { id: 'a1', title: 'Hand in lab report', status: 'next', priority: 'high', area: 'study', due: today(-2), duration: 40 },
      { id: 'a2', title: '<img src=x onerror="window.__xss=1">Email tutor', status: 'next', priority: 'medium', area: 'study', due: today(0), duration: 10 },
      { id: 'a3', title: 'Plan next week', status: 'progress', priority: 'low', area: 'personal', due: '', duration: 20 }],
    bp_habits_v1: [{ id: 'h1', title: 'Read 20 pages', created: today(-5), checks: {} }],
    bp_exams_v1: [{ id: 'x1', name: 'Chemistry Paper 1', subject: 'Chemistry', date: today(12) }],
    bp_questionStats_v1: { mode: 'smart', topics: { 'Chemistry|Moles & Titrations': { h: [0, 0.33], n: 2, last: new Date().toISOString() } } } });
  { const { ctx, p, errs } = await mk(coachSeed);
    await p.evaluate(() => showView('coach'));
    const last = () => p.evaluate(() => { const m = [...document.querySelectorAll('#coachLog .coach-msg.bot')].pop(); return { text: m.textContent, titles: [...m.querySelectorAll('.coach-item-top strong')].map(x => x.textContent), mins: [...m.querySelectorAll('.coach-min')].map(x => +x.textContent.replace(/\D/g, '')) }; });
    const ask = async q => { await p.fill('#coachInput', q); await p.press('#coachInput', 'Enter'); return last(); };
    let r = await p.evaluate(() => [...document.querySelectorAll('#coachLog .coach-msg.bot')].length); ok(r === 1, 'coach greets with a plan on first open');
    r = await ask('plan my day'); ok(r.titles[0] === 'Hand in lab report', 'plan puts the overdue high-priority task first (' + r.titles[0] + ')');
    ok(r.titles.some(t => /Training:|Study block/.test(t)), 'plan includes today\'s scheduled blocks'); ok(r.text.includes('Chemistry Paper 1 is in 12 days'), 'plan mentions the exam countdown');
    ok(await p.evaluate(() => !document.querySelector('#coachLog img') && window.__xss === undefined), 'task titles are shown as text (no HTML injection)');
    r = await ask('I have 30 minutes'); ok(r.mins.reduce((a, b) => a + b, 0) <= 30, 'a 30-minute budget is respected (' + r.mins.join('+') + ')'); ok(r.titles[0] === 'Hand in lab report' && /timebox/.test(r.text), 'an urgent 40-minute task is still started, timeboxed, in a 30-minute slot');
    r = await ask('i have 2 hours'); ok(r.mins.reduce((a, b) => a + b, 0) <= 120, '"2 hours" is parsed as 120 minutes (' + r.mins.join('+') + ')');
    r = await ask("I'm so tired today"); ok(/light/i.test(r.text) && !r.titles.some(t => /^Study block/.test(t)) && !r.titles.some(t => /^Training:/.test(t)), 'tired -> light session, no new-material study block');
    ok(/rest|talk to someone/i.test(r.text), 'tired reply includes a gentle wellbeing line');
    r = await ask("what's urgent?"); ok(r.titles.length === 2 && !r.titles.some(t => /Back up|habit/i.test(t)), 'urgent lists only overdue and due-today tasks (' + r.titles.join(' | ') + ')');
    r = await ask('what should I revise'); ok(r.titles[0] === 'Moles & Titrations', 'revise suggests the weakest quiz topic first (' + r.titles[0] + ')');
    r = await ask('plan tomorrow'); ok(/Tomorrow/.test(r.text), 'tomorrow plan is labelled');
    r = await ask('how is my week going'); ok(/Last 7 days/.test(r.text), 'weekly summary works');
    r = await ask('help'); ok(/rules-based/.test(r.text), 'help explains it is rules-based, not an AI');
    r = await ask('asdkjh qwe'); ok(r.text.length > 20, 'unrecognised input still gets a useful reply');
    r = await ask('<script>window.__xss=2</script>'); ok(await p.evaluate(() => window.__xss === undefined), 'user input is not injected as HTML');
    await p.evaluate(() => { document.querySelectorAll('#coachLog .coach-act')[0]; }); 
    r = await ask('what should I revise'); await p.evaluate(() => [...document.querySelectorAll('#coachLog .coach-msg.bot')].pop().querySelector('.coach-act').click());
    ok(await p.evaluate(() => !document.getElementById('view-test').classList.contains('hidden') && testTopicFocus === 'Chemistry|Moles & Titrations'), 'action button jumps to a quiz focused on that topic');
    // Command Centre card
    await p.evaluate(() => showView('command')); const card = await p.evaluate(() => ({ rows: document.querySelectorAll('#commandCoachCard .coach-row').length, text: document.getElementById('commandCoachCard').textContent }));
    ok(card.rows >= 1 && card.rows <= 3 && /Chemistry Paper 1/.test(card.text), 'Command Centre shows top picks and the next exam (' + card.rows + ' rows)');
    ok(errs.length === 0, 'no errors (' + errs.join('|') + ')'); await ctx.close(); }
  { const { ctx, p } = await mk(coachSeed); await p.clock.install({ time: new Date(new Date().setHours(23, 30, 0, 0)) }); await p.evaluate(() => { document.getElementById('coachLog').textContent = ''; showView('coach'); });
    ok(await p.evaluate(() => /late/i.test(document.getElementById('coachLog').textContent) && /Tomorrow/.test(document.getElementById('coachLog').textContent)), 'late at night the coach plans tomorrow instead and says sleep matters'); await ctx.close(); }
  { const { ctx, p, errs } = await mk(); await p.evaluate(() => showView('coach')); const t = await p.evaluate(() => document.getElementById('coachLog').textContent); ok(t.length > 20 && errs.length === 0, 'coach works with zero data (' + t.slice(0, 70) + '…)'); await ctx.close(); }

  { const { ctx, p } = await mk(); await p.clock.install({ time: new Date('2027-03-27T23:30:00Z') }); // night before clocks go forward
    const r = await p.evaluate(() => ({ line: coachReplyPlan({ offset: 1 }).lines[0], iso: coachContext(1).iso, add: addDaysISO('2027-03-27', 1) }));
    ok(r.iso === '2027-03-28' && r.add === '2027-03-28' && /Sunday/.test(r.line), 'plan tomorrow is correct on the night before the clocks go forward (' + r.iso + ', ' + r.line.slice(0, 30) + ')'); await ctx.close(); }

  // ===== 5. Hardening of the new keys =====
  { const bad = { garbage: '{{x', nul: 'null', num: '5', arr: '[1,null,"x"]', obj: '{"mode":5,"topics":{"__proto__":1,"a|b":{"h":[7,"q"]},"nobar":{"h":[1]}},"rounds":999,"x":1}' };
    for (const [n, v] of Object.entries(bad)) { const keys = ['bp_questionStats_v1', 'bp_exams_v1', 'bp_notesRevised_v1', 'bp_timerCfg_v1']; const probs = [];
      for (const k of keys) { const { ctx, p, errs } = await mk(`localStorage.setItem(${JSON.stringify(k)},${JSON.stringify(v)})`); await p.evaluate(() => APP_VIEWS.forEach(showView)); await p.evaluate(() => { coachAnswer('plan my day'); coachAnswer('what should I revise'); startQuizOn('All', null); ivRenderIdle(); }); if (errs.length) probs.push(k + ': ' + errs[0]); await ctx.close(); }
      ok(!probs.length, 'corrupt new-key payload "' + n + '" is survivable' + (probs.length ? ' → ' + probs.join(' ; ') : '')); } }
  { const { ctx, p, errs } = await mk();
    const r = await p.evaluate(async () => {
      const dt = new DataTransfer(); dt.items.add(new File([JSON.stringify({ format: 'bridge-protocol-backup', data: { bp_exams_v1: [{ name: 'ok', date: '2026-12-01', subject: 'Maths' }, { name: 'bad', date: 'nope' }, null], bp_timerCfg_v1: { rounds: 999, roundSec: 1, restSec: -5, prepSec: 'x' }, bp_questionStats_v1: { mode: 'x', topics: { 'A|b': { h: [2, 'z', -1] } } }, bp_notesRevised_v1: { 'Biology|X': true, bad: true, 'Y|Z': 'no' } } })], 'b.json'));
      const inp = document.createElement('input'); inp.type = 'file'; inp.files = dt.files; importBackupFile(inp); await new Promise(r => setTimeout(r, 300));
      return { exams: exams.map(e => e.name), cfg: ivCfg, q: qStats, rev: Object.keys(notesRevised) };
    });
    ok(r.exams.length === 1 && r.exams[0] === 'ok', 'import keeps only valid exams'); ok(r.cfg.rounds === 30 && r.cfg.roundSec === 10 && r.cfg.restSec === 0 && r.cfg.prepSec === 10, 'import clamps timer settings'); ok(r.q.mode === 'smart' && JSON.stringify(r.q.topics['A|b'].h) === '[1,0]', 'import clamps quiz stats'); ok(r.rev.length === 1 && r.rev[0] === 'Biology|X', 'import keeps only valid revised flags');
    const rs = await p.evaluate(() => { resetAllAppData(); return { e: exams.length, r: Object.keys(notesRevised).length, q: Object.keys(qStats.topics).length, c: ivCfg.rounds }; }); ok(rs.e === 0 && rs.r === 0 && rs.q === 0 && rs.c === 8, 'reset clears all the new state'); ok(errs.length === 0, 'no errors (' + errs.join('|') + ')'); await ctx.close(); }

  // ===== 6. every view, phone width =====
  { const { ctx, p, errs } = await mk(coachSeed); await p.evaluate(() => APP_VIEWS.forEach(showView)); const ov = await p.evaluate(() => { const out = []; for (const v of ['coach', 'timer', 'test', 'command']) { showView(v); if (document.documentElement.scrollWidth > innerWidth + 1) out.push(v); } return out; });
    ok(errs.length === 0, 'all views load without errors'); ok(ov.length === 0, 'no horizontal overflow at 390 px (' + ov.join(',') + ')'); await ctx.close(); }

  await b.close(); console.log(fails ? '\n' + fails + ' FAILED' : '\nALL PASS'); process.exit(fails ? 1 : 0);
})();

// v32 tests: week-plan editing, check-in, flashcards, progress, past papers, calendar export, bodyweight, appearance, new-key hardening.
// Usage: node qa-regression-v32.js [folder]   (needs Node + Playwright + Chromium)
const { chromium } = require(process.env.PLAYWRIGHT_PATH || '/opt/node22/lib/node_modules/playwright');
const path = require('path'); const dir = path.resolve(process.argv[2] || __dirname);
let fails = 0; const ok = (c, m) => { console.log((c ? 'PASS' : 'FAIL') + ': ' + m); if (!c) fails++; };
const today = (off = 0) => { const [y, m, d] = new Date().toLocaleDateString('en-CA', { timeZone: 'Europe/London' }).split('-').map(Number); return new Date(Date.UTC(y, m - 1, d + off)).toISOString().slice(0, 10); };
const seedJs = o => Object.entries(o).map(([k, v]) => `localStorage.setItem(${JSON.stringify(k)},${JSON.stringify(JSON.stringify(v))});`).join('');
(async () => {
  const b = await chromium.launch({ executablePath: process.env.CHROMIUM_PATH || '/opt/pw-browsers/chromium', args: ['--no-sandbox'] });
  const url = 'file://' + dir + '/index.html';
  const mk = async (init, opts = {}) => { const ctx = await b.newContext({ serviceWorkers: 'block', viewport: { width: 390, height: 844 }, timezoneId: 'Europe/London', acceptDownloads: true, ...opts }); const p = await ctx.newPage(); const errs = [], dialogs = []; p.on('pageerror', e => errs.push(e.message)); p.on('dialog', d => { dialogs.push(d.message()); d.accept(); }); if (init) await p.addInitScript(init); await p.goto(url); return { ctx, p, errs, dialogs }; };

  // ===== 1. Week plan editing =====
  { const { ctx, p, errs, dialogs } = await mk();
    await p.evaluate(() => { showView('schedule'); dayModes.Monday = 'train'; renderSchedule(); });
    const monday = () => p.locator('#scheduleList .card').first();
    await monday().locator('.sched-edit').click();
    await p.fill('#schedTitle', '<b>Pads</b> & bag work'); await p.fill('#schedItems', '6x3 min pads\n\n  4x3 min bag  \n<img src=x onerror="window.__x=1">');
    await monday().locator('button:text-is("Save")').click();
    const r = await p.evaluate(() => ({ html: document.querySelector('#scheduleList .card').innerHTML, text: document.querySelector('#scheduleList .card .block-title').textContent, items: [...document.querySelectorAll('#scheduleList .card')[0].querySelectorAll('.block-list li')].map(li => li.textContent), stored: JSON.parse(localStorage.getItem('bp_schedule_v1')), model: SCHEDULE.find(d => d.day === 'Monday').train.title }));
    ok(r.text.startsWith('<b>Pads</b> & bag work') && r.text.includes('edited') && !r.html.includes('<b>Pads'), 'edited title shows as plain text with an "edited" marker');
    ok(JSON.stringify(r.items) === JSON.stringify(['6x3 min pads', '4x3 min bag', '<img src=x onerror="window.__x=1">']) && await p.evaluate(() => window.__x === undefined), 'items trimmed, blank lines dropped, markup not executed');
    ok(r.stored.Monday.train.title === '<b>Pads</b> & bag work' && r.model === '<b>Pads</b> & bag work', 'edit is saved and the shared schedule (used by the Coach) updates');
    await p.reload(); ok(await p.evaluate(() => SCHEDULE.find(d => d.day === 'Monday').train.items.length === 3), 'edit survives a reload');
    await p.evaluate(() => { showView('schedule'); dayModes.Monday = 'train'; renderSchedule(); });
    await monday().locator('.sched-edit').click(); await p.fill('#schedTitle', '   '); await monday().locator('button:text-is("Save")').click();
    ok(dialogs.some(d => /title/i.test(d)), 'empty title is rejected');
    await monday().locator('button:text-is("Reset to original")').click();
    ok(await p.evaluate(() => SCHEDULE.find(d => d.day === 'Monday').train.title === 'Lower Body Strength + Power' && !localStorage.getItem('bp_schedule_v1').includes('Monday')), 'reset restores the original block');
    ok(errs.length === 0, 'no errors (' + errs.join('|') + ')'); await ctx.close(); }

  // ===== 2. Morning check-in =====
  { const { ctx, p, errs } = await mk(seedJs({ bp_checkins_v1: { [today(-1)]: { sleep: 8, energy: 4, soreness: 2 } } }));
    ok(await p.evaluate(() => /Morning check-in/.test(document.getElementById('commandCheckin').textContent) && document.querySelector('#commandCheckin .btn-primary').disabled), 'check-in form shows, Save disabled until rated');
    ok(await p.evaluate(() => document.querySelector('#commandCheckin .checkin-val').textContent) === '8 h', 'sleep pre-fills from the last check-in');
    for (let i = 0; i < 6; i++) await p.click('#commandCheckin .step-btn[aria-label="Less sleep"]');
    await p.locator('#commandCheckin .checkin-row').nth(1).locator('.seg-btn').nth(1).click();
    await p.locator('#commandCheckin .checkin-row').nth(2).locator('.seg-btn').nth(3).click();
    await p.click('#commandCheckin .btn-primary');
    const c = await p.evaluate(d => ({ stored: JSON.parse(localStorage.getItem('bp_checkins_v1'))[d], text: document.getElementById('commandCheckin').textContent }), today());
    ok(c.stored && c.stored.sleep === 5 && c.stored.energy === 2 && c.stored.soreness === 4, 'check-in saved (' + JSON.stringify(c.stored) + ')');
    ok(/Take it easier/.test(c.text) && /Slept 5 h/.test(c.text), 'summary shows low readiness');
    const plan = await p.evaluate(() => { const r = coachReplyPlan({}); return { lines: r.lines.join(' '), titles: r.items.map(i => i.title) }; });
    ok(/recovery is low/.test(plan.lines) && plan.titles.includes('Keep training light') && !plan.titles.some(t => /^Training:/.test(t)), 'Coach lightens training automatically after a low check-in');
    ok(await p.evaluate(() => readiness({ sleep: 8, energy: 4, soreness: 2 }) === 'good' && readiness({ sleep: 6.5, energy: 4, soreness: 2 }) === 'ok' && readiness({ sleep: 8, energy: 4, soreness: 4 }) === 'low'), 'readiness thresholds');
    ok(errs.length === 0, 'no errors (' + errs.join('|') + ')'); await ctx.close(); }
  { const { ctx, p } = await mk(); ok(await p.evaluate(() => coachReplyPlan({}).items.some(i => i.id === 'checkin')), 'Coach suggests the check-in when it has not been done'); await ctx.close(); }

  // ===== 3. Flashcards =====
  { const { ctx, p, errs, dialogs } = await mk();
    const idx = await p.evaluate(() => { const c = cardIndex(); return { n: c.length, unique: new Set(c.map(x => x.key)).size, subjects: [...new Set(c.map(x => x.subject))] }; });
    ok(idx.n > 300 && idx.unique === idx.n && idx.subjects.length === 3, 'cards built from notes: ' + idx.n + ' unique cards across ' + idx.subjects.join('/'));
    await p.evaluate(() => showView('cards')); await p.click('#cardsBody .btn-primary');
    ok(await p.evaluate(() => cardSession.queue.length) === 15, 'a fresh day starts with 15 new cards');
    const rate = async r => { await p.click('.fc-flip'); await p.click('.fc-btn.r-' + r); };
    const k1 = await p.evaluate(() => cardSession.queue[0]); await rate('good');
    const k2 = await p.evaluate(() => cardSession.queue[0]); await rate('easy');
    const k3 = await p.evaluate(() => cardSession.queue[0]); await rate('hard');
    const k4 = await p.evaluate(() => cardSession.queue[0]); await rate('again');
    const st = await p.evaluate(ks => ks.map(k => cardState.cards[k]), [k1, k2, k3, k4]);
    ok(st[0].b === 1 && st[0].due === today(1), 'Good on a new card → due tomorrow');
    ok(st[1].b === 2 && st[1].due === today(3), 'Easy on a new card → due in 3 days');
    ok(st[2].b === 1 && st[2].due === today(1), 'Hard on a new card → due tomorrow');
    ok(st[3].b === 0 && st[3].due === today(0) && st[3].l === 1 && await p.evaluate(k => cardSession.queue[cardSession.queue.length - 1] === k, k4), 'Again → stays due today, counted as a miss, re-queued at the end');
    ok(await p.evaluate(() => cardState.meta.newCount) === 4, 'new-card counter tracks today\'s new cards');
    await p.reload(); ok(await p.evaluate(k => cardState.cards[k] && cardState.cards[k].b === 2, k2), 'card progress survives a reload');
    ok(await p.evaluate(() => newCardsLeftToday()) === 11 && await p.evaluate(() => cardsDue('All').length) === 1, 'daily limit and due count are right after reload (11 new left, 1 due)');
    ok(await p.evaluate(() => coachReplyPlan({}).items.some(i => i.id === 'cards')), 'Coach suggests the due flashcards');
    await p.evaluate(() => { cardState.meta.newDate = localISODate(); cardState.meta.newCount = 15; Object.values(cardState.cards).forEach(c => c.due = addDaysISO(localISODate(), 2)); saveCardState(); showView('cards'); });
    ok(await p.evaluate(() => document.querySelector('#cardsBody .btn-primary').disabled), 'nothing due and no new cards left → Start is disabled');
    // a card's own nextIntervalLabel matches what rating does
    ok(await p.evaluate(() => { const c = cardIndex()[0]; cardState.cards[c.key] = { b: 3, due: localISODate(), n: 3, l: 0 }; return nextIntervalLabel(c, 'good') === '14 days' && nextIntervalLabel(c, 'hard') === '4 days' && nextIntervalLabel(c, 'again') === 'again today'; }), 'interval labels on the rating buttons are correct');
    ok(errs.length === 0, 'no errors (' + errs.join('|') + ')'); await ctx.close(); }

  // ===== 4. Progress =====
  { const log = []; const add = (d, load, reps, rpe) => log.push({ id: 'w' + log.length, date: today(d), type: 'Strength', exercise: 'Bench Press', sets: 3, reps: String(reps), load, rpe });
    add(-40, 80, 5, 7); add(-30, 85, 5, 8); add(-20, 82.5, 5, 8); add(-12, 82.5, 5, 9); add(-5, 80, 6, 9);
    log.push({ id: 'z1', date: today(-3), type: 'S', exercise: 'Squat', sets: 1, reps: '3', load: 140, rpe: 9 });
    const { ctx, p, errs } = await mk(seedJs({ bp_workoutLog_v1: log }));
    const m = await p.evaluate(() => ({ a: e1rm(100, 5), b: e1rm(100, 1), c: e1rm(100, 15), d: e1rm(0, 5) }));
    ok(Math.abs(m.a - 116.667) < 0.01 && m.b === 100 && m.c === null && m.d === null, 'Epley estimate: 100×5 → 116.7, singles = load, >12 reps or no load ignored');
    const stalls = await p.evaluate(() => stalledLifts().map(s => s.name));
    ok(JSON.stringify(stalls) === '["Bench Press"]', 'Bench Press flagged as stalled (3 recent sessions, no new best); Squat with one session is not');
    await p.evaluate(() => showView('progress'));
    ok(await p.evaluate(() => /Stalled lifts/.test(document.getElementById('progressBody').textContent)), 'stall card is shown');
    const svg = p.locator('#progressBody .chart-svg').first(); const box = await svg.boundingBox();
    await p.mouse.move(box.x + box.width * 0.97, box.y + box.height / 2);
    ok(await p.evaluate(() => { const t = document.querySelector('#progressBody .chart-tip'); return t && !t.hidden && /kg/.test(t.textContent); }), 'hovering the chart shows a tooltip with the value');
    ok(await p.evaluate(() => !document.getElementById('progressBody').innerHTML.includes('NaN')), 'no NaN in chart output');
    await p.click('#progressBody .chip-row .hub-tab:text-is("Squat")');
    ok(await p.evaluate(() => /Squat · estimated/.test(document.getElementById('progressBody').textContent) && !document.getElementById('progressBody').innerHTML.includes('NaN')), 'single-session exercise charts without NaN');
    ok(errs.length === 0, 'no errors (' + errs.join('|') + ')'); await ctx.close(); }
  { const { ctx, p, errs } = await mk(); await p.evaluate(() => showView('progress'));
    ok(await p.evaluate(() => /Log lifts/.test(document.getElementById('progressBody').textContent)) && errs.length === 0, 'Progress shows helpful empty states with no data'); await ctx.close(); }

  // ===== 5. Past papers =====
  { const { ctx, p, errs, dialogs } = await mk();
    await p.evaluate(() => showView('exams'));
    const add = async (name, subj, score, max, weak) => { await p.fill('#ppName', name); await p.selectOption('#ppSubject', subj); await p.fill('#ppScore', String(score)); await p.fill('#ppMax', String(max)); await p.fill('#ppWeak', weak || ''); await p.click('button:text-is("Save paper")'); };
    await add('Bad one', 'Chemistry', 90, 80); ok(dialogs.some(d => /marks/i.test(d)) && await p.evaluate(() => papers.length) === 0, 'score above the total is rejected');
    await add('June 2022 P1', 'Chemistry', 48, 80, 'buffers'); await p.fill('#ppDate', today(-1)); await add('June 2023 P1', 'Chemistry', 60, 80);
    const r = await p.evaluate(() => ({ n: papers.length, text: document.getElementById('paperSummary').textContent + document.getElementById('paperList').textContent, chart: !!document.querySelector('#paperSummary .chart-svg') }));
    ok(r.n === 2 && /75%/.test(r.text) && /60%/.test(r.text) && /Weak spots: buffers/.test(r.text) && r.chart, 'papers listed with % and weak spots, trend chart drawn');
    await p.click('#paperList .exam-item .small-action'); ok(await p.evaluate(() => papers.length) === 1, 'paper can be deleted');
    ok(errs.length === 0, 'no errors (' + errs.join('|') + ')'); await ctx.close(); }

  // ===== 6. Calendar export =====
  { const { ctx, p, errs } = await mk(seedJs({ bp_exams_v1: [{ id: 'x1', name: 'Chemistry Paper 1 — Physical, Organic; résumé, “quotes”', subject: 'Chemistry', date: today(10) }, { id: 'x2', name: 'Old', subject: 'Maths', date: today(-5) }],
      bp_tasks_v1: [{ id: 't1', title: 'Lab report, final; draft\\done', status: 'next', priority: 'high', area: 'study', due: today(2), notes: 'line1\nline2' }, { id: 't2', title: 'Done', status: 'done', priority: 'low', due: today(3) }, { id: 't3', title: 'Overdue', status: 'next', priority: 'low', due: today(-1) }] }));
    await p.evaluate(() => showView('exams'));
    const [dl] = await Promise.all([p.waitForEvent('download'), p.click('#examActions button')]);
    const txt = require('fs').readFileSync(await dl.path(), 'utf8');
    const lines = txt.split('\r\n'); const enc = new TextEncoder();
    ok(dl.suggestedFilename() === 'bridge-protocol-calendar.ics' && txt.startsWith('BEGIN:VCALENDAR\r\n') && txt.endsWith('END:VCALENDAR\r\n'), 'downloads a CRLF .ics file');
    ok((txt.match(/BEGIN:VEVENT/g) || []).length === 2, 'exports the upcoming exam and the open future task only (2 events)');
    ok(lines.every(l => enc.encode(l).length <= 75), 'every line is at most 75 bytes (RFC 5545 folding, multi-byte safe)');
    const unfolded = txt.replace(/\r\n /g, '');
    ok(unfolded.includes('SUMMARY:Exam: Chemistry Paper 1 — Physical\\, Organic\\; résumé\\, “quotes”') && unfolded.includes('SUMMARY:Due: Lab report\\, final\\; draft\\\\done') && unfolded.includes('DESCRIPTION:line1\\nline2'), 'commas, semicolons, backslashes and newlines are escaped; unicode intact');
    ok(unfolded.includes('UID:exam-x1@bridge-protocol') && unfolded.includes('DTSTART;VALUE=DATE:' + today(10).replace(/-/g, '')) && unfolded.includes('DTEND;VALUE=DATE:' + today(11).replace(/-/g, '')), 'stable UIDs and all-day DTSTART/DTEND');
    ok((txt.match(/BEGIN:VALARM/g) || []).length === 2, 'each event has a reminder');
    ok(errs.length === 0, 'no errors (' + errs.join('|') + ')'); await ctx.close(); }

  // ===== 7. Bodyweight =====
  { const entries = []; for (let i = 13; i >= 0; i--) entries.push({ date: today(-i), kg: +(75 - (13 - i) * 0.15).toFixed(2) });
    const { ctx, p, errs, dialogs } = await mk(seedJs({ bp_bodyweight_v1: { entries, target: { kg: 68, date: today(21) } } }));
    await p.evaluate(() => showView('macros'));
    const t = await p.evaluate(() => document.getElementById('bodyweightBox').textContent);
    ok(t.includes('LATEST' + (await p.evaluate(() => fmtNum(body.entries[body.entries.length - 1].kg))) + ' kg'), 'latest weight shown');
    ok(/Losing about 1\.\d% of bodyweight a week/.test(t), 'warns when losing faster than ~1% a week');
    ok(/faster than the ~0\.5–1% a week usually recommended/.test(t), 'warns when the weight-class target needs an aggressive rate');
    await p.fill('#bwKg', '72.6'); await p.click('#bodyweightBox button:text-is("Log")');
    ok(await p.evaluate(d => body.entries.filter(e => e.date === d).length === 1 && body.entries.find(e => e.date === d).kg === 72.6, today()), 'logging the same day replaces that day\'s weight');
    await p.fill('#bwKg', '999'); await p.click('#bodyweightBox button:text-is("Log")'); ok(await p.evaluate(() => body.entries.every(e => e.kg < 300)) && dialogs.some(d => /25–300/.test(d)), 'out-of-range weight rejected with a message');
    ok(await p.evaluate(() => !!document.querySelector('#bodyweightBox .chart-legend') && !document.getElementById('bodyweightBox').innerHTML.includes('NaN')), 'two-series chart has a legend and no NaN');
    ok(errs.length === 0, 'no errors (' + errs.join('|') + ')'); await ctx.close(); }

  // ===== 8. Appearance =====
  { const { ctx, p, errs } = await mk();
    await p.evaluate(() => showView('system')); await p.click('#appearanceBox .seg-btn:text-is("Light")');
    ok(await p.evaluate(() => document.documentElement.dataset.theme === 'light' && getComputedStyle(document.body).backgroundColor === 'rgb(244, 246, 249)'), 'Light theme applies immediately');
    await p.click('#appearanceBox .seg-btn:text-is("Extra large")'); ok(await p.evaluate(() => document.documentElement.style.zoom === '1.25'), 'Extra large text sets 125% zoom');
    await p.reload(); ok(await p.evaluate(() => document.documentElement.dataset.theme === 'light' && document.documentElement.style.zoom === '1.25'), 'settings persist across reload');
    const over = await p.evaluate(() => APP_VIEWS.filter(v => { showView(v); return document.documentElement.scrollWidth > innerWidth + 1; })); ok(over.length === 0, 'no horizontal overflow at Extra large (' + over.join(',') + ')');
    ok(errs.length === 0, 'no errors (' + errs.join('|') + ')'); await ctx.close(); }
  { const { ctx, p } = await mk(seedJs({ bp_appearance_v1: { theme: 'system', text: 'normal' } }), { colorScheme: 'light' }); ok(await p.evaluate(() => document.documentElement.dataset.theme) === 'light', '"Match phone" follows the phone\'s light setting'); await ctx.close(); }
  { const { ctx, p } = await mk(seedJs({ bp_appearance_v1: { theme: 'system', text: 'normal' } }), { colorScheme: 'dark' }); ok(await p.evaluate(() => document.documentElement.dataset.theme) === 'dark', '"Match phone" follows the phone\'s dark setting'); await ctx.close(); }

  // ===== 9. Hardening: corrupt payloads, import, reset =====
  { const keys = ['bp_schedule_v1', 'bp_checkins_v1', 'bp_flashcards_v1', 'bp_papers_v1', 'bp_bodyweight_v1', 'bp_appearance_v1'];
    const bad = { garbage: '{{x', nul: 'null', num: '5', arr: '[1,null,"x",{"date":"bad"}]', obj: '{"Monday":{"train":{"title":5}},"cards":{"a|b|c":{"b":99,"due":"x"}},"entries":[{"date":"2026-01-01","kg":"heavy"}],"theme":"neon","2026-01-01":{"sleep":99,"energy":0,"soreness":"x"}}' };
    for (const [n, v] of Object.entries(bad)) { const probs = [];
      for (const k of keys) { const { ctx, p, errs } = await mk(`localStorage.setItem(${JSON.stringify(k)},${JSON.stringify(v)})`); await p.evaluate(() => { APP_VIEWS.forEach(x => showView(x)); coachReplyPlan({}); coachAnswer('how is my week going'); buildIcs(); }); if (errs.length) probs.push(k + ': ' + errs[0]); await ctx.close(); }
      ok(!probs.length, 'corrupt payload "' + n + '" in every new key is survivable' + (probs.length ? ' → ' + probs.join(' ; ') : '')); } }
  { const { ctx, p, errs } = await mk();
    const r = await p.evaluate(async d => {
      const data = { bp_schedule_v1: { Monday: { train: { title: 'Pads', items: ['a', 5, ''] } }, Funday: { train: { title: 'x' } } }, bp_checkins_v1: { [d]: { sleep: 7.3, energy: 9, soreness: 1 }, bad: { sleep: 1 } }, bp_flashcards_v1: { cards: { 'Biology|T|H': { b: 9, due: d }, nopipes: { b: 1, due: d } }, meta: { subject: 'Physics' } },
        bp_papers_v1: [{ date: d, subject: 'Maths', paper: 'P1', score: 50, max: 60 }, { date: d, paper: 'neg', score: -1, max: 10 }], bp_bodyweight_v1: { entries: [{ date: d, kg: 70.04 }, { date: 'x', kg: 70 }], target: { kg: 'a', date: d } }, bp_appearance_v1: { theme: 'light', text: 'huge' } };
      const dt = new DataTransfer(); dt.items.add(new File([JSON.stringify({ format: 'bridge-protocol-backup', data })], 'b.json')); const inp = document.createElement('input'); inp.type = 'file'; inp.files = dt.files; importBackupFile(inp); await new Promise(r => setTimeout(r, 300));
      return { sched: SCHEDULE.find(x => x.day === 'Monday').train, ci: checkins[d], cards: Object.keys(cardState.cards), cb: cardState.cards['Biology|T|H'], subj: cardState.meta.subject, papers: papers.map(x => x.paper), body: body, theme: document.documentElement.dataset.theme, text: appearance.text };
    }, today());
    ok(r.sched.title === 'Pads' && JSON.stringify(r.sched.items) === '["a"]', 'import cleans the week plan');
    ok(r.ci && r.ci.sleep === 7.5 && r.ci.energy === 5, 'import clamps check-ins (7.3 h → 7.5, energy 9 → 5)');
    ok(r.cards.length === 1 && r.cb.b === 6 && r.subj === 'All', 'import clamps flashcard state and drops bad keys');
    ok(JSON.stringify(r.papers) === '["P1"]', 'import keeps only valid papers');
    ok(r.body.entries.length === 1 && r.body.entries[0].kg === 70 && r.body.target === null, 'import cleans bodyweight entries and target');
    ok(r.theme === 'light' && r.text === 'normal', 'import applies a valid theme and ignores an invalid text size');
    const z = await p.evaluate(() => { resetAllAppData(); return { s: SCHEDULE.find(x => x.day === 'Monday').train.title, c: Object.keys(checkins).length, f: Object.keys(cardState.cards).length, pp: papers.length, bw: body.entries.length, th: document.documentElement.dataset.theme }; });
    ok(z.s === 'Lower Body Strength + Power' && !z.c && !z.f && !z.pp && !z.bw && z.th === 'dark', 'reset clears every new feature and restores defaults');
    ok(errs.length === 0, 'no errors (' + errs.join('|') + ')'); await ctx.close(); }

  // ===== 10. Fixes from the independent code review =====
  { const entries = []; for (let i = 9; i >= 0; i--) entries.push({ date: today(-i), kg: 80 + (i % 3) * 0.3 });
    const { ctx, p, errs, dialogs } = await mk(seedJs({ bp_bodyweight_v1: { entries, target: { kg: 78, date: today(30) } }, bp_appearance_v1: { theme: 'dark', text: 'xl' } }), { hasTouch: true, isMobile: true });
    await p.evaluate(() => showView('macros'));
    const svg = p.locator('#bodyweightBox .chart-svg'); const bx = await svg.boundingBox();
    await p.touchscreen.tap(bx.x + bx.width * 0.98, bx.y + bx.height * 0.5); await p.waitForTimeout(100);
    const tipState = await p.evaluate(() => { const t = document.querySelector('#bodyweightBox .chart-tip'), h = t.parentElement.getBoundingClientRect(), r = t.getBoundingClientRect(); return { shown: !t.hidden, inside: r.left >= h.left - 1 && r.right <= h.right + 1, overflow: document.documentElement.scrollWidth > innerWidth + 1 }; });
    ok(tipState.shown, 'a tap on a chart keeps the tooltip visible after the finger lifts');
    ok(tipState.inside && !tipState.overflow, 'at Extra-large text the tooltip stays inside the chart and the page does not scroll sideways');
    await p.touchscreen.tap(bx.x + 10, bx.y - 40); await p.waitForTimeout(80);
    ok(await p.evaluate(() => document.querySelector('#bodyweightBox .chart-tip').hidden), 'tapping elsewhere hides the tooltip');
    const ticks = await p.evaluate(() => { const ch = lineChart({ series: [{ name: 'w', color: 'red', points: [{ x: '2026-01-01', y: 80 }, { x: '2026-01-05', y: 80.7 }] }] }); return [...ch.querySelectorAll('.c-axis')].map(t => t.textContent).filter(x => /^\d+(\.\d+)?$/.test(x)); });
    ok(ticks.length >= 2 && ticks.every(x => ['79.75', '80', '80.25', '80.5', '80.75', '81'].includes(x)), 'axis labels for an 80–80.7 range show exact steps (' + ticks.join(' | ') + ')');
    await p.fill('#bwTargetKg', ''); await p.click('#bodyweightBox button:text-is("Save")');
    ok(await p.evaluate(() => body.target === null), 'clearing the target weight removes it (no phantom 25 kg target)');
    ok(errs.length === 0, 'no errors (' + errs.join('|') + ')'); await ctx.close(); }
  { const { ctx, p, dialogs } = await mk(); await p.evaluate(() => showView('exams'));
    await p.fill('#ppName', 'Blank marks'); await p.fill('#ppMax', '100'); await p.click('button:text-is("Save paper")');
    ok(await p.evaluate(() => papers.length) === 0 && dialogs.some(d => /marks/i.test(d)), 'a paper with blank marks is rejected, not saved as 0%');
    const reps = await p.evaluate(() => ['5', '5 reps', '3x5', '3 × 8', '8-10', '1 min', '3 min', '30s', 'AMRAP', ''].map(r => { const n = repsNumber(r); return Number.isNaN(n) ? 'NaN' : n; }));
    ok(JSON.stringify(reps) === JSON.stringify([5, 5, 5, 8, 8, 'NaN', 'NaN', 'NaN', 'NaN', 'NaN']), 'reps parsing handles 3x5, ranges, durations and AMRAP (' + reps.join(',') + ')');
    ok(await p.evaluate(() => { const c = cardIndex(); c.slice(0, 70).forEach(x => cardState.cards[x.key] = { b: 1, due: localISODate(), n: 1, l: 0 }); cardState.meta.newDate = localISODate(); cardState.meta.newCount = 15; showView('cards'); return document.querySelector('#cardsBody .btn-primary').textContent === 'Start 60 cards'; }), 'flashcard Start label matches the 60-card session cap');
    await ctx.close(); }
  { const { ctx, p, errs } = await mk(); await p.evaluate(() => showView('notes'));
    await p.click('#nav-more'); await p.evaluate(() => { navigateFromMenu('timer'); navigateFromMenu('timer'); }); await p.waitForTimeout(300);
    ok(await p.evaluate(() => currentView === 'timer' && !overlayIsOpen()), 'a fast double tap in the menu still lands on the chosen section');
    await p.goBack(); await p.waitForTimeout(150); ok(await p.evaluate(() => currentView) === 'notes', 'and back still returns to the previous section');
    ok(errs.length === 0, 'no errors (' + errs.join('|') + ')'); await ctx.close(); }

  await b.close(); console.log(fails ? '\n' + fails + ' FAILED' : '\nALL PASS'); process.exit(fails ? 1 : 0);
})();

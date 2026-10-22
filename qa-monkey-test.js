// Monkey/fuzz test: random taps, typing and selections across every section, looking for uncaught errors,
// promise rejections, console errors and horizontal overflow.  Usage: node qa-monkey-test.js [folder] [actions] [seeds]
const { chromium } = require(process.env.PLAYWRIGHT_PATH || '/opt/node22/lib/node_modules/playwright');
const path = require('path'); const dir = path.resolve(process.argv[2] || __dirname);
const ACTIONS = Number(process.argv[3] || 1500), SEEDS = Number(process.argv[4] || 3);
const NASTY = ['', ' ', '0', '-1', '1e309', '99999999', '3.5', 'NaN', '<img src=x onerror=window.__xss=1>', '"; alert(1); //', '🥊📚🔥', 'é—“quotes”', 'a'.repeat(500), '12:30', '2026-13-45', '\\', '%s%n', '../../etc', 'null', 'undefined'];
function rng(seed) { let s = seed >>> 0; return () => { s = (s * 1664525 + 1013904223) >>> 0; return s / 4294967296; }; }
(async () => {
  const b = await chromium.launch({ executablePath: process.env.CHROMIUM_PATH || '/opt/pw-browsers/chromium', args: ['--no-sandbox'] });
  let total = 0; const problems = [];
  for (let seed = 1; seed <= SEEDS; seed++) {
    const R = rng(seed * 7919), pick = a => a[Math.floor(R() * a.length)];
    const ctx = await b.newContext({ serviceWorkers: 'block', viewport: { width: 390, height: 844 }, hasTouch: true, isMobile: true, timezoneId: 'Europe/London', acceptDownloads: true });
    const p = await ctx.newPage(); const errs = [];
    p.on('pageerror', e => errs.push('pageerror: ' + e.message));
    p.on('console', m => { if (m.type() === 'error' && !/Service Worker|favicon|net::ERR/.test(m.text())) errs.push('console: ' + m.text().slice(0, 160)); });
    p.on('dialog', d => (R() < 0.5 ? d.accept() : d.dismiss()).catch(() => {}));
    p.on('download', d => d.cancel().catch(() => {}));
    await p.addInitScript(() => { window.addEventListener('unhandledrejection', e => console.error('unhandledrejection: ' + (e.reason && e.reason.message || e.reason))); window.print = () => {}; try { speechSynthesis.speak = () => {}; } catch (e) {} });
    await p.goto('file://' + dir + '/index.html');
    const views = await p.evaluate(() => APP_VIEWS);
    for (let i = 0; i < ACTIONS; i++) {
      total++;
      try {
        if (R() < 0.08) { await p.evaluate(v => showView(v), pick(views)); continue; }
        if (R() < 0.03) { await p.goBack({ timeout: 1000 }).catch(() => {}); continue; }
        const targets = await p.evaluate(() => {
          document.querySelectorAll('[data-monkey]').forEach(el => el.removeAttribute('data-monkey'));
          const vis = el => { const r = el.getBoundingClientRect(); const cs = getComputedStyle(el); return r.width > 0 && r.height > 0 && cs.visibility !== 'hidden' && !el.disabled && !el.closest('.hidden,[hidden]'); };
          const scope = document.querySelector('.section-menu-backdrop:not(.hidden), .global-search-backdrop:not(.hidden)') || document;
          return [...scope.querySelectorAll('button, input, select, textarea, summary, .note-card-header, [onclick]')].filter(vis).filter(el => !/resetAllAppData|importBackupFile/.test(el.getAttribute('onclick') || '') && el.type !== 'file').map((el, i) => { el.dataset.monkey = String(i); return { i, tag: el.tagName, type: el.type || '' }; });
        });
        if (!targets.length) continue;
        const t = pick(targets), sel = `[data-monkey="${t.i}"]`;
        if (t.tag === 'SELECT') { const n = await p.$eval(sel, el => el.options.length); if (n) await p.$eval(sel, (el, k) => { el.selectedIndex = k; el.dispatchEvent(new Event('change', { bubbles: true })); }, Math.floor(R() * n)); }
        else if (t.tag === 'TEXTAREA' || (t.tag === 'INPUT' && !['checkbox', 'radio', 'button', 'submit'].includes(t.type))) {
          const v = t.type === 'date' ? pick(['2026-10-18', '2027-06-01', '2020-01-01', '']) : t.type === 'number' ? pick(['0', '-5', '7.5', '99999', '', '1e9', '3']) : pick(NASTY);
          await p.$eval(sel, (el, val) => { el.value = val; el.dispatchEvent(new Event('input', { bubbles: true })); el.dispatchEvent(new Event('change', { bubbles: true })); }, v);
          if (R() < 0.3) await p.press(sel, 'Enter', { timeout: 500 }).catch(() => {});
        } else { await p.click(sel, { timeout: 800, force: true }).catch(() => {}); }
        if (R() < 0.05) await p.waitForTimeout(300);
        if (i % 150 === 0) { const ov = await p.evaluate(() => document.documentElement.scrollWidth > innerWidth + 1 ? currentView : null); if (ov) errs.push('overflow in ' + ov); }
      } catch (e) { if (!/Target closed|detached|Execution context/.test(e.message)) errs.push('driver: ' + e.message.split('\n')[0]); }
      if (errs.length > 20) break;
    }
    const xss = await p.evaluate(() => window.__xss);
    if (xss) errs.push('XSS payload executed');
    const health = await p.evaluate(() => { try { APP_VIEWS.forEach(v => showView(v)); coachReplyPlan({}); weeklyReportData(); buildBackupJSON(); return 'ok'; } catch (e) { return e.message; } });
    if (health !== 'ok') errs.push('post-run health check failed: ' + health);
    const reload = await (async () => { const e2 = []; p.removeAllListeners('pageerror'); p.on('pageerror', e => e2.push(e.message)); await p.reload(); await p.evaluate(() => APP_VIEWS.forEach(v => showView(v))); return e2; })();
    reload.forEach(e => errs.push('after reload: ' + e));
    console.log(`seed ${seed}: ${errs.length ? errs.length + ' problem(s)' : 'clean'}`);
    [...new Set(errs)].slice(0, 10).forEach(e => { console.log('   ' + e); problems.push(e); });
    await ctx.close();
  }
  await b.close();
  console.log(`\n${total} random actions across ${SEEDS} sessions: ${problems.length ? problems.length + ' PROBLEM(S)' : 'NO ERRORS'}`);
  process.exit(problems.length ? 1 : 0);
})();

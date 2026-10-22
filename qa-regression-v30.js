// v30 tests: backup reminder, last-backup tracking, persistent storage, zoom. Usage: node qa-regression-v30.js [folder]
const { chromium } = require(process.env.PLAYWRIGHT_PATH || '/opt/node22/lib/node_modules/playwright');
const path = require('path'); const dir = path.resolve(process.argv[2] || __dirname);
let fails = 0; const ok = (c, m) => { console.log((c ? 'PASS' : 'FAIL') + ': ' + m); if (!c) fails++; };
(async () => {
  const b = await chromium.launch({ executablePath: process.env.CHROMIUM_PATH || '/opt/pw-browsers/chromium', args: ['--no-sandbox'] });
  const mk = async (init, opts={}) => { const ctx = await b.newContext({ serviceWorkers: 'block', acceptDownloads: true, viewport: { width: 390, height: 844 }, ...opts }); const p = await ctx.newPage(); const errs = []; p.on('pageerror', e => errs.push(e.message)); p.on('dialog', d => d.accept()); if (init) await p.addInitScript(init); await p.goto('file://' + dir + '/index.html'); return { ctx, p, errs }; };
  const nudge = p => p.evaluate(() => document.getElementById('commandBackupNudge').textContent.trim());
  const task = `if(!localStorage.getItem('bp_tasks_v1'))localStorage.setItem('bp_tasks_v1',JSON.stringify([{id:'t1',title:'x',status:'next'}]))`;

  { const { ctx, p } = await mk(); ok((await nudge(p)) === '', 'fresh install with no data shows no reminder'); await ctx.close(); }
  { const { ctx, p } = await mk(task); ok((await nudge(p)).includes('not exported a backup yet'), 'data but no backup -> reminder'); await ctx.close(); }
  { const { ctx, p } = await mk(task + `;localStorage.setItem('bp_lastBackup_v1',new Date(Date.now()-3*86400000).toISOString())`); ok((await nudge(p)) === '', 'backup 3 days ago -> no reminder'); await ctx.close(); }
  { const { ctx, p } = await mk(task + `;localStorage.setItem('bp_lastBackup_v1',new Date(Date.now()-9*86400000).toISOString())`); ok((await nudge(p)).includes('9 days ago'), 'backup 9 days ago -> reminder says 9 days'); 
    await p.click('text=Remind me in 3 days'); ok((await nudge(p)) === '', 'snooze hides the reminder');
    ok(await p.evaluate(() => { showView('tasks'); showView('command'); return document.getElementById('commandBackupNudge').textContent.trim() === ''; }), 'snooze survives re-render'); await ctx.close(); }
  { const { ctx, p } = await mk(`localStorage.setItem('bp_lifeInbox_v1',JSON.stringify([{id:'i1',text:'idea',type:'idea',area:'personal'}]))`); ok((await nudge(p)).length > 0, 'Life OS-only data also triggers the reminder'); await ctx.close(); }
  { const { ctx, p } = await mk(task);
    const [dl] = await Promise.all([p.waitForEvent('download'), p.click('text=Back up now')]);
    ok(/^bridge-protocol-backup-\d{4}-\d{2}-\d{2}\.json$/.test(dl.suggestedFilename()), 'Back up now downloads a backup file (' + dl.suggestedFilename() + ')');
    ok((await nudge(p)) === '', 'reminder disappears after exporting');
    ok(await p.evaluate(() => { showView('system'); return document.getElementById('dataStatus').textContent.includes('Last backup: today'); }), 'System view shows "Last backup: today"');
    const fileData = JSON.parse(require('fs').readFileSync(await dl.path(), 'utf8')); ok(/^v\d+$/.test(fileData.appVersion), 'backup file carries an app version (' + fileData.appVersion + ')'); await ctx.close(); }
  // persistence status text + request
  { const { ctx, p } = await mk(`window.__persistCalls=0;if(navigator.storage){const o=navigator.storage.persist&&navigator.storage.persist.bind(navigator.storage);navigator.storage.persist=async()=>{window.__persistCalls++;return true};}`);
    await p.evaluate(() => showView('system')); await p.waitForTimeout(300);
    const t = await p.evaluate(() => document.getElementById('persistStatus').textContent);
    ok(/Storage protection: (ON|OFF)/.test(t), 'System view reports storage protection state (' + t.slice(0, 40) + '…)');
    ok(await p.evaluate(() => window.__persistCalls) >= 1, 'app asks the browser for persistent storage on load'); await ctx.close(); }
  // viewport allows zoom
  { const { ctx, p } = await mk(); ok(await p.evaluate(() => !/maximum-scale|user-scalable/i.test(document.querySelector('meta[name=viewport]').content)), 'viewport no longer blocks pinch-zoom'); await ctx.close(); }
  // all views clean
  { const { ctx, p, errs } = await mk(task); await p.evaluate(() => APP_VIEWS.forEach(showView)); ok(errs.length === 0, 'all views load without errors'); await ctx.close(); }
  await b.close(); console.log(fails ? '\n' + fails + ' FAILED' : '\nALL PASS'); process.exit(fails ? 1 : 0);
})();

// Navigation tests (real browser). Covers the original checks (menu open/close, search filter, route selection,
// active state, invalid-route guard, Escape) plus v32 hubs, section tabs, remembered tabs, Android back, deep links.
const { chromium } = require(process.env.PLAYWRIGHT_PATH || '/opt/node22/lib/node_modules/playwright');
const path = require('path'); const dir = path.resolve(process.argv[2] || __dirname);
const fail = m => { console.error('FAIL: ' + m); process.exitCode = 1; throw new Error(m); };
const assert = (c, m) => { if (!c) fail(m); };
(async () => {
  const b = await chromium.launch({ executablePath: process.env.CHROMIUM_PATH || '/opt/pw-browsers/chromium', args: ['--no-sandbox'] });
  try {
    const ctx = await b.newContext({ serviceWorkers: 'block', viewport: { width: 390, height: 844 } }); const p = await ctx.newPage();
    const errs = []; p.on('pageerror', e => errs.push(e.message)); p.on('dialog', d => d.accept());
    const url = 'file://' + dir + '/index.html';
    await p.goto(url);
    const vis = id => p.evaluate(i => !document.getElementById(i).classList.contains('hidden'), id);
    const cur = () => p.evaluate(() => currentView);
    const settle = () => p.waitForTimeout(120);
    assert(await cur() === 'command' && (await p.evaluate(() => location.hash)) === '#/command', 'starts on Today with #/command');
    // menu open / filter / select
    await p.click('#nav-more'); assert(await vis('sectionMenuBackdrop'), 'menu did not open');
    assert(await p.getAttribute('#nav-more', 'aria-expanded') === 'true', 'expanded state not set');
    await p.fill('#sectionMenuSearch', 'life os'); const shown = await p.evaluate(() => [...document.querySelectorAll('.section-menu-item')].filter(x => !x.hidden).map(x => x.getAttribute('onclick')));
    assert(shown.length === 1 && shown[0].includes('lifeos'), 'search did not filter to Life OS: ' + shown);
    await p.click('.section-menu-item:not([hidden])'); await settle();
    assert(await vis('view-lifeos') && !(await vis('sectionMenuBackdrop')), 'menu selection did not open Life OS and close the menu');
    assert(await p.evaluate(() => document.getElementById('nav-more').classList.contains('tab-active')), 'More hub not marked active for Life OS');
    // primary hub + active state + section tabs
    await p.click('#nav-plan'); await settle(); assert(await cur() === 'tasks' && await p.evaluate(() => document.getElementById('nav-plan').getAttribute('aria-current') === 'page'), 'Plan hub did not open Tasks with aria-current');
    const tabs = await p.evaluate(() => [...document.querySelectorAll('#hubTabs .hub-tab')].map(b => b.textContent + (b.classList.contains('active') ? '*' : '')));
    assert(JSON.stringify(tabs) === JSON.stringify(['Tasks*', 'Calendar', 'Projects', 'Habits', 'Week plan']), 'Plan section tabs wrong: ' + tabs);
    await p.click('#hubtab-planner'); await settle(); assert(await cur() === 'planner', 'section tab did not switch view');
    // invalid route guard
    await p.evaluate(() => showView('not-a-view')); assert(await cur() === 'planner', 'invalid view changed state');
    // Escape closes menu
    await p.click('#nav-more'); await p.keyboard.press('Escape'); await settle(); assert(!(await vis('sectionMenuBackdrop')) && await cur() === 'planner', 'Escape did not close menu cleanly');
    // Ctrl+K opens menu
    await p.keyboard.press('Control+k'); assert(await vis('sectionMenuBackdrop'), 'Ctrl+K did not open the menu'); await p.keyboard.press('Escape'); await settle();
    // remembered tab per hub, and tapping the active hub returns to its first section
    await p.click('#nav-study'); await p.click('#hubtab-cards'); await settle(); await p.click('#nav-plan'); await settle();
    assert(await cur() === 'planner', 'Plan hub did not remember Calendar'); await p.click('#nav-study'); await settle();
    assert(await cur() === 'cards', 'Study hub did not remember Flashcards'); await p.click('#nav-study'); await settle(); assert(await cur() === 'notes', 'tapping the active hub did not go to its first section');
    // Android back: walks back through sections
    await p.click('#nav-train'); await settle(); await p.click('#hubtab-progress'); await settle();
    await p.goBack(); await settle(); assert(await cur() === 'training', 'back did not return to Training (got ' + await cur() + ')');
    await p.goBack(); await settle(); assert(await cur() === 'notes', 'second back did not return to Notes (got ' + await cur() + ')');
    // back closes the search overlay without changing section
    await p.click('.hdr-btn[aria-label="Search everything"]'); assert(await vis('globalSearchBackdrop'), 'search did not open');
    await p.goBack(); await settle(); assert(!(await vis('globalSearchBackdrop')) && await cur() === 'notes', 'back did not just close search');
    // menu navigation then back -> previous section, no ghost entry
    await p.click('#nav-more'); await p.click(".section-menu-item[onclick=\"navigateFromMenu('timer')\"]"); await settle();
    assert(await cur() === 'timer', 'menu did not open Timer'); await p.goBack(); await settle(); assert(await cur() === 'notes' && !(await vis('sectionMenuBackdrop')), 'back after menu navigation did not return to Notes (got ' + await cur() + ')');
    // closing the menu with its Close button leaves no extra history entry
    await p.click('#nav-more'); await p.click('#sectionMenu .section-menu-close[aria-label="Close section menu"]'); await settle();
    const st = await p.evaluate(() => ({ state: history.state, view: currentView, open: overlayIsOpen() }));
    assert(st.view === 'notes' && !st.open && st.state && st.state.view === 'notes' && !st.state.overlay, 'Close button left a ghost history entry: ' + JSON.stringify(st));
    // deep link
    const p2 = await ctx.newPage(); await p2.goto(url + '#/progress'); assert(await p2.evaluate(() => currentView === 'progress' && !document.getElementById('view-progress').classList.contains('hidden')), 'deep link #/progress did not open Progress');
    assert(errs.length === 0, 'page errors: ' + errs.join(' | '));
    console.log('PASS: navigation tests (menu open/close, search filter, route selection, active state, invalid route guard, Escape, Ctrl+K, hubs, section tabs, remembered tabs, Android back, overlay back, deep links)');
  } catch (e) { if (!process.exitCode) { console.error('FAIL: ' + e.message); process.exitCode = 1; } }
  finally { await b.close(); }
})();

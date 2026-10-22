#!/usr/bin/env node
// Focused unit tests for backup/local-storage normalization in Life OS.
const fs = require('fs');
const vm = require('vm');
const assert = require('assert');
const source = fs.readFileSync(__dirname + '/app.js', 'utf8');
const start = source.indexOf('function lifeSafeId(');
const end = source.indexOf('function lifeRenderAll()', start);
assert(start >= 0 && end > start, 'Life OS normalization functions not found');
let id = 0;
const context = {
  lifeId: prefix => `${prefix}safe${++id}`,
  localISODate: () => '2026-10-17',
  lifeInbox: [{id:"x');alert(1)//", text:'Captured', type:'task', area:'study'}],
  lifeMoney: [{id:'m1',type:'expense',amount:'12.349',date:'2026-10-16',category:'Food'}, {amount:-2,type:'expense'}],
  lifeMeals: [{id:'f1',name:'Lunch',calories:'650',protein:'30.25',date:'2026-10-17'}],
  lifeRoutines: [{id:'r1',name:'Read',cadence:'Daily',checks:{'2026-10-17':true,'bad-date':'yes'}}],
  lifeReading: [{id:'b1',title:'Unsafe link',url:'javascript:alert(1)',notes:'x',status:'done'}],
  lifeDecisions: [{id:'d1',title:'Decision',reason:'Because',review:'bad-date'}],
  lifeHistory: [{id:'h1',action:'Approved task reschedule',detail:'Due date changed',undo:{type:'taskDue',taskId:'task_1',before:'',after:'2026-10-18'}}],
  lifeSavings: {name:'Goal',target:'500',current:'120.5'}
};
vm.createContext(context);
vm.runInContext(source.slice(start, end), context);
assert.strictEqual(context.lifeInbox.length, 1);
assert.match(context.lifeInbox[0].id, /^[A-Za-z0-9_-]{1,80}$/);
assert.strictEqual(context.lifeMoney.length, 1, 'invalid finance entry should be dropped');
assert.strictEqual(context.lifeMoney[0].amount, 12.35);
assert.strictEqual(context.lifeMeals[0].calories, 650);
assert.strictEqual(context.lifeMeals[0].protein, 30.3);
assert.strictEqual(context.lifeRoutines[0].checks['2026-10-17'], true);
assert.strictEqual(context.lifeRoutines[0].checks['bad-date'], undefined);
assert.strictEqual(context.lifeReading[0].url, '', 'unsafe URL protocol should be removed');
assert.strictEqual(context.lifeDecisions[0].review, '');
assert.strictEqual(context.lifeHistory[0].undo.taskId, 'task_1', 'reversible history metadata should survive normalization');
assert.strictEqual(context.lifeSavings.current, 120.5);
console.log('PASS: Life OS normalization unit tests');

// Exercises the actual deployed normalizer without requiring a browser.
const fs = require('fs');
const vm = require('vm');
const source = fs.readFileSync(__dirname + '/app.js', 'utf8');
const match = source.match(/function normalizeWorkoutLog\(value\)\{[\s\S]*?\n\}/);
if (!match) throw new Error('normalizeWorkoutLog not found in app.js');
const context = { localISODate: () => '2026-10-17', Date, Number, Math };
vm.createContext(context);
vm.runInContext(match[0] + '; this.normalizeWorkoutLog = normalizeWorkoutLog;', context);
const input = [
  { id: "x' onmouseover='alert(1)", date: 'not-a-date', type: 123, exercise: { bad: true }, sets: 999, reps: 5, load: 1001, rpe: 99, notes: '<script>x</script>' },
  null,
  { id: 'safe_1', date: '2026-10-17', type: 'Boxing', exercise: 'Willie Bag', sets: 3, reps: '3 min', load: null, rpe: 8, notes: 'good' }
];
const out = context.normalizeWorkoutLog(input);
if (out.length !== 2) throw new Error('Malformed record filtering/count mismatch');
if (out[0].id !== 'w-import-0') throw new Error('Unsafe ID was not replaced');
if (out[0].exercise !== 'Imported exercise' || out[0].sets !== 30 || out[0].load !== null || out[0].rpe !== null) throw new Error('Malformed fields were not normalized');
if (out[1].id !== 'safe_1' || out[1].exercise !== 'Willie Bag' || out[1].sets !== 3 || out[1].rpe !== 8) throw new Error('Valid entry was not preserved');
if (context.normalizeWorkoutLog('bad').length !== 0) throw new Error('Non-array input must normalize to an empty list');
if (context.normalizeWorkoutLog(Array.from({ length: 1005 }, (_, i) => ({ id: 'id_' + i, exercise: 'x', sets: 1, reps: '1' }))).length !== 1000) throw new Error('Log size limit not enforced');
console.log('PASS: workout normalizer rejects malformed records, replaces unsafe IDs, bounds fields, preserves valid records and caps log size');

#!/usr/bin/env python3
"""Static smoke checks for Bridge Protocol PWA v38 (standard library only)."""
from pathlib import Path
from collections import Counter
import re, subprocess, sys, tempfile, zipfile

root = Path(__file__).resolve().parent
markup = (root / 'index.html').read_text(encoding='utf-8')
js = (root / 'data.js').read_text(encoding='utf-8') + '\n' + (root / 'specs.js').read_text(encoding='utf-8') + '\n' + (root / 'app.js').read_text(encoding='utf-8')
html = markup + '\n' + js
errors = []
def check(condition, message):
    if not condition: errors.append(message)

check('<script src="data.js"></script>' in markup and '<script src="app.js"></script>' in markup and markup.index('data.js') < markup.index('src="app.js"'), 'index.html must load data.js before app.js')
check(markup.count('<script') == 4 and '<script src="specs.js"></script>' in markup, 'Expected the early theme script plus data.js, specs.js and app.js')
ids = re.findall(r'\bid=["\']([^"\']+)', markup)
check(not [k for k,v in Counter(ids).items() if v > 1], 'Duplicate HTML IDs detected')
check('3.99×10⁴' in html, 'Expected typography-safe exponent matcher missing')
sw = (root / 'service-worker.js').read_text()
check('bridge-protocol-v38' in sw, 'Service worker cache version not v38')
check("'./data.js'" in sw and "'./app.js'" in sw and "'./specs.js'" in sw, 'Service worker does not cache data.js and app.js')
check('globalSearchBackdrop' in html and 'globalSearchInput' in html, 'Global search modal missing')
check('function globalSearchRecords' in js and 'QUESTIONS||[]' in js, 'Global search data sources missing')
check('globalSearchInput.addEventListener' in js, 'Global search input handler missing')
for hub in ['home','plan','study','train','more']:
    check(f'id="nav-{hub}"' in markup, f'Missing bottom navigation hub: {hub}')
for view in ['command','coach','weekly','tasks','planner','projects','habits','schedule','notes','cards','test','blurt','mistakes','spec','exams','training','timer','progress','macros','camp','checklist','lifeos','system']:
    check(f'id="view-{view}"' in markup, f'Missing view: {view}')
    check(f'navigateFromMenu(\'{view}\')' in markup, f'Missing section-menu navigation item: {view}')
for fn in ['renderCommandCentre','renderPlanner','renderHabits','renderWeeklyReview','saveWeeklyReview','renderCommandLifeAreas','addHabit','saveTask','editTask','toggleTaskDone','saveProject','exportBackup','importBackupFile','resetAllAppData','searchAllNotes','openNotesSearchResult','renderTaskSuggestions','approveTaskReschedule','dismissTaskSuggestion','renderFocusTaskOptions','startTaskFocus','saveWorkoutEntry','renderWorkoutLog','willieNextCall','willieStartDrill','willieStopDrill','willieSelectTarget','updateWillieMapping']:
    check(f'function {fn}' in html, f'Missing function: {fn}')
check('const NOTES' in html, 'Revision notes missing')
base = html.index('const NOTES')
counts = {}
def find_array_end(text, opening):
    depth = 0; quote = None; escaped = False
    for pos in range(opening, len(text)):
        ch = text[pos]
        if quote:
            if escaped: escaped = False
            elif ch == '\\': escaped = True
            elif ch == quote: quote = None
        else:
            if ch in ('\"', "'", '`'): quote = ch
            elif ch == '[': depth += 1
            elif ch == ']':
                depth -= 1
                if depth == 0: return pos
    raise ValueError('subject notes array not closed')
for subject, minimum in [('Chemistry',30), ('Biology',30), ('Maths',20)]:
    match = re.search(r'(?m)^\s*' + re.escape(subject) + r':\s*\[', html[base:])
    check(match is not None, f'{subject} notes array missing')
    if match:
        start = base + match.start(); opening = html.index('[', start)
        end = find_array_end(html, opening)
        counts[subject] = len(re.findall(r'\{title:', html[start:end]))
        check(counts[subject] >= minimum, f'{subject} topic count unexpectedly low')
check('const QUESTIONS = [' in html, 'Question bank missing')
check(html.count('sourcePattern:\"PMT-informed') == 30, 'Expected 30 PMT-informed original questions')
check('const subjPool=pool.filter(q=>q.subject===subject)' in html, 'All-subject practice is not balanced by subject')
check('PMT_QUESTION_MARK_SCHEME_AUDIT.md' in (root / 'README.md').read_text(), 'PMT source audit missing from README')
check('SAVEMYEXAMS_NOTES_AUDIT.md' in (root / 'README.md').read_text(), 'Save My Exams notes audit missing from README')
check('Save My Exams Supplement' in html, 'Save My Exams supplementary notes missing')
check('Search every notes section' in html and 'function searchAllNotes' in html, 'Global notes search missing')
check('function buildNotesSearchIndex' in html and 'function scheduleNotesSearch' in html, 'Search index/debounce performance improvements missing')
check('backdrop-filter:blur(12px)' not in html, 'Costly fixed-surface backdrop blur remains')
check('bp_tasks_v1' in html and 'bp_projects_v1' in html and 'bp_habits_v1' in html, 'Task/project persistence keys missing')
check('bp_dismissedSuggestions_v1' in html, 'Approval-first suggestion persistence missing')
check('id="taskDuration"' in html and 'duration,area:' in html, 'Task effort estimates/life-area tagging missing')
check('id="taskArea"' in html and 'id="quickTaskArea"' in html, 'Life-area selectors missing')
check("area:document.getElementById('quickTaskArea').value||'personal'" in html, 'Quick-captured tasks do not save life area')
check("includes(t.area)?t.area:'personal'" in html, 'Imported tasks do not normalize life area')
check('bp_weeklyReview_v1' in html and 'function saveWeeklyReview' in html, 'Local weekly review persistence missing')
check('No plan changes were applied' in html and 'No changes without approval' in html, 'Approval-first weekly review language missing')
check('id="focusTaskSelect"' in html and 'function startTaskFocus' in html, 'Task-linked focus mode missing')
check('Nothing changes unless you approve' in html and 'Approve change' in html, 'Approval-first rescheduling UI missing')
check("format:'bridge-protocol-backup'" in html, 'Backup format marker missing')
# Extract deployed inline JS and syntax-check all JS sources.
for filename in [str(root / 'data.js'), str(root / 'specs.js'), str(root / 'app.js'), str(root / 'service-worker.js')]:
    proc = subprocess.run(['node','--check',filename], capture_output=True, text=True)
    check(proc.returncode == 0, f'JavaScript syntax failed for {Path(filename).name}: {proc.stderr.strip()}')
check('bp_workoutLog_v1' in html and 'function normalizeWorkoutLog' in html, 'Workout log persistence/sanitizer missing')
check('view-training' in markup and 'nav-train' in markup, 'Training view/navigation missing')
# Verify inline handler calls resolve to defined app functions or known browser APIs.
function_names=set(re.findall(r'function\s+([A-Za-z_$][\w$]*)\s*\(', html))
handlers=re.findall(r'on(?:click|change|input|submit|keydown|keyup)=[\"\']([^\"\']*)[\"\']', html, re.I)
handler_allow={'if','confirm','alert','setTimeout','setInterval','clearInterval','window','document','navigator','Math','Number','String','Date','JSON','parseInt','parseFloat','requestAnimationFrame','open','history','location','event','preventDefault','stopPropagation'}
missing_calls=[]
for handler in handlers:
    for call in re.finditer(r'(?:^|[;{}])\s*([A-Za-z_$][\w$]*)\s*\(', handler):
        name=call.group(1)
        if name not in function_names and name not in handler_allow:
            missing_calls.append(name)
check('"shortcuts"' in (root / 'manifest.json').read_text(), 'Home-screen shortcuts missing from manifest')
check(not missing_calls, 'Potential undefined inline-handler functions: ' + ', '.join(sorted(set(missing_calls))))
check('id="nav-more"' in html and 'id="sectionMenuBackdrop"' in html, 'Searchable More navigation menu missing')
check('id="sectionMenuSearch"' in html and 'function filterSectionMenu' in html, 'Section navigation search missing')
check('function openSectionMenu' in html and 'function closeSectionMenu' in html and 'function navigateFromMenu' in html, 'Section menu controls missing')
check('PRIMARY_NAV_VIEWS' in html and "event.key.toLowerCase()==='k'" in html, 'Primary navigation or keyboard shortcut missing')
check('history.pushState' in js and "addEventListener('popstate'" in js, 'History-aware navigation (Android back) missing')
check('id="hubTabs"' in markup, 'Section tab strip missing')
check('Willie Bag' in html and 'willie-zone-8' in html, 'Willie Bag visual/target 8 missing')
check('SpeechSynthesisUtterance' in html and 'Math.floor(Math.random()*8)+1' in html, 'Willie Bag spoken random-number caller missing')
check('Session A — Strength' in html and 'Medicine-ball rotational throw' in html, 'Strength/power programming missing')
check(all(f'id="willie-pick-{i}"' in html for i in range(1,9)), 'Willie Bag manual number selector buttons 1–8 missing')
check("{''.join(f'<button" not in html, 'Unexpanded Python template expression remains in deployed HTML')
check("appVersion:'v38'" in html, 'Backup metadata is not marked v38')
check('workout history' in html.lower(), 'Backup/reset descriptions do not mention workout history')

for token in ['lifeAddCapture','lifePromoteTask','lifeRenderCapacity','lifeApproveReschedule','lifeAddMoney','lifeAddMeal','lifeAddRoutine','lifeAddReading','lifeAddDecision','lifeRenderAnalytics','lifeRenderDiagnostics','lifeNormalizeData','lifeUndoChange']:
    check(f'function {token}' in html, f'Missing Life OS function: {token}')
for key in ['bp_lifeInbox_v1','bp_lifeMoney_v1','bp_lifeMeals_v1','bp_lifeRoutines_v1','bp_lifeReading_v1','bp_lifeDecisions_v1','bp_lifeHistory_v1','bp_lifeSavings_v1']:
    check(key in html, f'Missing Life OS persistence key: {key}')
check("lifeReloadFromStorage();if(typeof mcLoadSavedInputs" in html and "lifeRenderAll();renderExams();" in html, 'Life OS data does not refresh after restore')
check('lifeSafeId' in html and "['http:','https:'].includes(u.protocol)" in html, 'Imported Life OS records are not normalized/sanitized')
unit = subprocess.run(['node', str(root / 'qa-workout-unit-test.js')], capture_output=True, text=True)
check(unit.returncode == 0, f'Workout normalization unit tests failed: {unit.stdout.strip()} {unit.stderr.strip()}')
life_unit = subprocess.run(['node', str(root / 'qa-lifeos-unit-test.js')], capture_output=True, text=True)
check(life_unit.returncode == 0, f'Life OS normalization unit tests failed: {life_unit.stdout.strip()} {life_unit.stderr.strip()}')
nav_unit = subprocess.run(['node', str(root / 'qa-navigation-unit-test.js')], capture_output=True, text=True)
check(nav_unit.returncode == 0, f'Navigation unit tests failed: {nav_unit.stdout.strip()} {nav_unit.stderr.strip()}')
print('Topic counts:', counts)
if errors:
    print('FAIL')
    for error in errors: print('-', error)
    sys.exit(1)
print('PASS: static smoke checks completed')


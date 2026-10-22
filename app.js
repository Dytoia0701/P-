const SCHEDULE = [
 {day:"Monday", train:{title:"Lower Body Strength + Power", items:["Back Squat 4x5 @RPE7-8","Romanian Deadlift 3x8","Box Jumps 4x3 (submax)","Bulgarian Split Squat 3x8/side","Weighted Plank 3x40s"]},
   study:{title:"Chemistry (OCR A): Physical & Organic foundations", items:["Moles, empirical formula & titration calcs","Enthalpy, Hess's law & rates","Alkenes, alcohols & mechanisms"]}},
 {day:"Tuesday", train:{title:"Upper Push (tendon-safe) + Neck", items:["DB Flat Bench 4x6-8","Landmine Press 3x8","Rope Pressdown 3x12 (controlled)","Neck harness: flex/ext/lateral 3x15","Face Pulls 3x15"]},
   study:{title:"Biology (OCR A): Foundations & Exchange", items:["Biological molecules: carbs, lipids, proteins","Cell structure & the cell cycle","Exchange surfaces & gas exchange"]}},
 {day:"Wednesday", train:{title:"Boxing Technical + Core (no bag)", items:["6x3min shadowboxing (footwork focus)","Slip-rope or shadow slip/roll reps","Anti-rotation press 3x10","Hanging knee raise 3x12"]},
   study:{title:"Maths (Edexcel): Pure algebra & trig", items:["Algebra & functions, coordinate geometry","Trig identities & equations","Sequences, series & binomial expansion"]}},
 {day:"Thursday", train:{title:"Lower Power / Posterior Chain", items:["Trap Bar Deadlift 4x5","Hip Thrust 4x8","Lateral Bounds 4x5/side","Sled Push 6x20m"]},
   study:{title:"Chemistry (OCR A): Equilibrium & Arenes", items:["Kc/Kp, pH, buffers & entropy","Arenes, carbonyls & carboxylic acids","Esterification & acid anhydrides"]}},
 {day:"Friday", train:{title:"Upper Pull + Neck/Traps", items:["Weighted Pull-ups 4x6-8","Barbell Row 4x8","Heavy Shrugs 4x10 (controlled)","Neck training 3x15/direction"]},
   study:{title:"Biology (OCR A): Response & Genetics", items:["Neuronal & hormonal communication","Photosynthesis & respiration","Patterns of inheritance & gene expression"]}},
 {day:"Saturday", train:{title:"Shadowboxing + Punch Matrix (no bag)", items:["8x3min shadowboxing — numbered combos, full extension","Footwork ladder drills","Med-ball rotational throws 4x6/side","Jump rope finisher 5x1min high-tempo"]},
   study:{title:"Maths (Edexcel): Calculus & Mechanics", items:["Differentiation & integration","Kinematics (SUVAT) & forces","Vectors & numerical methods"]}},
 {day:"Sunday", train:{title:"Rest / Active Recovery", items:["Light walk 20-30min","Foam rolling","Isometric tricep holds 3x20s","Band pull-aparts 3x15"]},
   study:{title:"Mixed recap / weak-topic buffer", items:["Redo one weak Chemistry topic","Redo one weak Biology topic","Redo one weak Maths topic"]}}
];

const CHECKLIST_ITEMS = [
 "Resisted band pressdown x10 — no sharp/pinching pain",
 "Palpate triceps tendon (back of elbow) — not hot/tender",
 "Full elbow bend/straighten — no catching or sharp pain",
 "Bodyweight push-up x5 — pain-free",
 "Today's pressing capped at controlled tempo (2-3s eccentric)",
 "No heavy skull-crushers / weighted dips / behind-neck press today"
];


let dayModes = safeReadJSON('bp_dayModes', {}); if(!dayModes||typeof dayModes!=='object'||Array.isArray(dayModes)) dayModes={};
let checklistState = safeReadJSON('bp_checklist', {}); if(!checklistState||typeof checklistState!=='object'||Array.isArray(checklistState)) checklistState={};
function lsGet(k){ try{ return localStorage.getItem(k); }catch(e){ return null; } }
let storageWarnedAt=0;
// One clear, throttled warning whenever a save fails (usually a full browser storage), so nothing fails silently.
function storageFullWarn(){const now=Date.now();if(now-storageWarnedAt<20000)return;storageWarnedAt=now;try{alert("Couldn't save that change: this app's browser storage is full. Export or share a backup in Settings, then free some space (for example, delete old entries).");}catch(e){}}
function lsSet(k,v,quiet){ try{ localStorage.setItem(k,v); return true; }catch(e){ if(!quiet)storageFullWarn(); return false; } }
let notesSubject = lsGet('bp_notesSubject') || 'Chemistry';
function validNotesSubject(x){ return x==='Custom' || (typeof NOTES==='object' && NOTES && Object.prototype.hasOwnProperty.call(NOTES,x)); }
let notesExpanded = safeReadJSON('bp_notesExpanded', {}); if(!notesExpanded||typeof notesExpanded!=='object'||Array.isArray(notesExpanded)) notesExpanded={};
let customNotes = safeReadJSON('bp_customNotes', []); if(!Array.isArray(customNotes)) customNotes=[];
let customNoteFormState = null;
function saveDayModes(){ lsSet('bp_dayModes', JSON.stringify(dayModes)); }
function saveChecklist(){ lsSet('bp_checklist', JSON.stringify(checklistState)); }
function saveNotesExpanded(){ lsSet('bp_notesExpanded', JSON.stringify(notesExpanded)); }
function saveCustomNotes(){ if(!lsSet('bp_customNotes', JSON.stringify(customNotes))) storageFullWarn(); }
function escapeHtml(str){
  return (str||'').replace(/&/g,'&amp;').replace(/</g,'&lt;').replace(/>/g,'&gt;').replace(/"/g,'&quot;').replace(/'/g,'&#39;');
}


function safeReadJSON(key, fallback){
  try{ const raw=localStorage.getItem(key); return raw===null?fallback:JSON.parse(raw); }
  catch(err){ console.warn('Bridge Protocol: ignored invalid saved data for',key); return fallback; }
}
const TASKS_KEY='bp_tasks_v1', PROJECTS_KEY='bp_projects_v1';
const SAFE_ID_RE=/^[A-Za-z0-9_-]{1,80}$/;
const TASK_AREAS=['personal','study','work','health','home','relationships','finance','admin','other'];
const isoDateOrEmpty=v=>typeof v==='string'&&/^\d{4}-\d{2}-\d{2}$/.test(v)?v:'';
const isoStampOr=(v)=>typeof v==='string'&&!Number.isNaN(Date.parse(v))?v:new Date().toISOString();
function normalizeTaskRecord(t,i){ if(!t||typeof t!=='object'||typeof t.title!=='string'||!t.title.trim())return null; const dur=Number(t.duration);
  return {id:typeof t.id==='string'&&SAFE_ID_RE.test(t.id)?t.id:'t-fix-'+i+'-'+Math.random().toString(36).slice(2,6),title:t.title.slice(0,160),due:isoDateOrEmpty(t.due),duration:Number.isFinite(dur)&&dur>0?Math.max(5,Math.min(480,Math.round(dur/5)*5)):25,area:TASK_AREAS.includes(t.area)?t.area:'personal',priority:['high','medium','low'].includes(t.priority)?t.priority:'medium',status:['next','progress','done'].includes(t.status)?t.status:'next',projectId:typeof t.projectId==='string'?t.projectId:'',notes:typeof t.notes==='string'?t.notes.slice(0,1200):'',created:isoStampOr(t.created),updated:isoStampOr(t.updated)}; }
function normalizeProjectRecord(p,i){ if(!p||typeof p!=='object'||typeof p.title!=='string'||!p.title.trim())return null;
  return {id:typeof p.id==='string'&&SAFE_ID_RE.test(p.id)?p.id:'p-fix-'+i+'-'+Math.random().toString(36).slice(2,6),title:p.title.slice(0,120),target:isoDateOrEmpty(p.target),status:['active','paused','done'].includes(p.status)?p.status:'active',description:typeof p.description==='string'?p.description.slice(0,1200):'',created:isoStampOr(p.created),updated:isoStampOr(p.updated)}; }
function normalizeHabitRecord(h,i){ if(!h||typeof h!=='object'||typeof h.title!=='string'||!h.title.trim())return null; const checks={};
  if(h.checks&&typeof h.checks==='object'&&!Array.isArray(h.checks)) for(const k of Object.keys(h.checks)) if(/^\d{4}-\d{2}-\d{2}$/.test(k)&&h.checks[k]===true) checks[k]=true;
  return {id:typeof h.id==='string'&&SAFE_ID_RE.test(h.id)?h.id:'h-fix-'+i+'-'+Math.random().toString(36).slice(2,6),title:h.title.slice(0,100),created:isoDateOrEmpty(h.created)||localISODate(),checks}; }
function normalizeCustomNoteRecord(n,i){ if(!n||typeof n!=='object')return null; return {id:typeof n.id==='string'&&n.id.length<=80&&/^[A-Za-z0-9_-]+$/.test(n.id)?n.id:'n-fix-'+i+'-'+Math.random().toString(36).slice(2,6),title:typeof n.title==='string'?n.title.slice(0,200):'',body:typeof n.body==='string'?n.body.slice(0,20000):''}; }
const normList=(arr,fn)=>(Array.isArray(arr)?arr:[]).map(fn).filter(Boolean);
let tasks=normList(safeReadJSON(TASKS_KEY,[]),normalizeTaskRecord);
let projects=normList(safeReadJSON(PROJECTS_KEY,[]),normalizeProjectRecord);
customNotes=normList(customNotes,normalizeCustomNoteRecord);
let taskFilter='open';
let taskProjectPrefill='';
function persistTasks(){ try{localStorage.setItem(TASKS_KEY,JSON.stringify(tasks));}catch(e){storageFullWarn();} }
function persistProjects(){ try{localStorage.setItem(PROJECTS_KEY,JSON.stringify(projects));}catch(e){storageFullWarn();} }
/* v37: Intl formatters are expensive to create, and toLocaleDateString(…, options) builds a new one on every call
   (0.5 ms+ each on a phone: 150 task cards took ~100 ms). Keep one formatter per option set. */
const DATE_FMT_CACHE=new Map();
function fmtDate(d,opts){const k=JSON.stringify(opts||{});let f=DATE_FMT_CACHE.get(k);if(!f){try{f=new Intl.DateTimeFormat(undefined,opts);}catch(e){f={format:x=>x.toLocaleDateString()};}DATE_FMT_CACHE.set(k,f);}return f.format(d);}
let todayISOCache={at:0,v:''};
function localISODate(d){if(d===undefined){const now=Date.now();const dt=now-todayISOCache.at;if(dt>=0&&dt<1000)return todayISOCache.v;const v=localISODate(new Date(now));todayISOCache={at:now,v};return v;}const x=new Date(d.getTime()-d.getTimezoneOffset()*60000);return x.toISOString().slice(0,10);}
function niceDate(iso){if(!iso)return 'No due date';const d=new Date(iso+'T12:00:00');return fmtDate(d,{day:'numeric',month:'short',year:d.getFullYear()!==new Date().getFullYear()?'numeric':undefined});}
function taskIsOpen(t){return t.status!=='done';}
function taskIsOverdue(t){return taskIsOpen(t)&&t.due&&t.due<localISODate();}
function taskDueToday(t){return taskIsOpen(t)&&t.due===localISODate();}
function priorityRank(p){return ({high:0,medium:1,low:2})[p]??1;}
function sortedTasks(list){return [...list].sort((a,b)=>{const ao=taskIsOverdue(a)?-1:0,bo=taskIsOverdue(b)?-1:0;return ao-bo||priorityRank(a.priority)-priorityRank(b.priority)||(a.due||'9999').localeCompare(b.due||'9999')||(b.updated||'').localeCompare(a.updated||'');});}
function taskProjectName(id){return projects.find(p=>p.id===id)?.title||'';}
const LAST_BACKUP_KEY='bp_lastBackup_v1', BACKUP_SNOOZE_KEY='bp_backupSnooze_v1', BACKUP_STALE_DAYS=7, BACKUP_SNOOZE_DAYS=3;
function hasBackupWorthyData(){
  if(tasks.length+projects.length+habits.length+customNotes.length+workoutLog.length>0)return true;
  try{for(let i=0;i<localStorage.length;i++){const k=localStorage.key(i);if(k&&k.startsWith('bp_life')&&(localStorage.getItem(k)||'').length>4)return true;}}catch(e){}
  return false;
}
function daysSince(iso){const t=Date.parse(iso);return Number.isNaN(t)?Infinity:(Date.now()-t)/86400000;}
function renderBackupNudge(){
  const el=document.getElementById('commandBackupNudge');if(!el)return;
  const last=lsGet(LAST_BACKUP_KEY),age=last?daysSince(last):Infinity,snooze=lsGet(BACKUP_SNOOZE_KEY);
  if(!hasBackupWorthyData()||age<BACKUP_STALE_DAYS||(snooze&&Date.parse(snooze)>Date.now())){el.innerHTML='';return;}
  const msg=Number.isFinite(age)?'Your last backup was '+Math.floor(age)+' days ago.':'You have not exported a backup yet.';
  el.innerHTML='<div class="suggestion-card"><div class="suggestion-title">Back up your data</div><div class="suggestion-copy">'+msg+' Everything is stored only in this browser and can be lost if site data is cleared.</div><div class="item-actions"><button onclick="exportBackup()">Back up now</button><button onclick="snoozeBackupNudge()">Remind me in '+BACKUP_SNOOZE_DAYS+' days</button></div></div>';
}
function snoozeBackupNudge(){lsSet(BACKUP_SNOOZE_KEY,new Date(Date.now()+BACKUP_SNOOZE_DAYS*86400000).toISOString());renderBackupNudge();}
function lastBackupText(){const l=lsGet(LAST_BACKUP_KEY);if(!l||Number.isNaN(Date.parse(l)))return 'never';const d=Math.floor(daysSince(l));return (d<=0?'today':d===1?'yesterday':d+' days ago')+' ('+fmtDate(new Date(l),{day:'numeric',month:'short'})+')';}
async function refreshPersistStatus(){const el=document.getElementById('persistStatus');if(!el)return;let t='Storage protection is not supported by this browser.';
  try{if(navigator.storage&&navigator.storage.persisted){t=(await navigator.storage.persisted())?'Storage protection: ON — the browser will not clear this data automatically when the phone is low on space.':'Storage protection: OFF — the browser may clear this data if the phone runs low on space. Installing the app to your home screen usually enables it. Keep backups.';}}catch(e){}
  el.textContent=t;}
async function requestPersistentStorage(){try{if(navigator.storage&&navigator.storage.persist&&navigator.storage.persisted&&!(await navigator.storage.persisted()))await navigator.storage.persist();}catch(e){}refreshPersistStatus();}
function renderCommandCentre(){
  renderBackupNudge();
  renderCheckinCard();
  renderCommandCoachCard();
  const today=localISODate();
  document.getElementById('commandDate').textContent='SYSTEM / DAILY BRIEF · '+fmtDate(new Date(),{weekday:'long',day:'numeric',month:'long'}).toUpperCase();
  const open=tasks.filter(taskIsOpen), overdue=open.filter(taskIsOverdue), due=open.filter(t=>t.due===today), done=tasks.filter(t=>t.status==='done');
  const activeProjects=projects.filter(p=>p.status==='active');
  const metrics=[['OPEN TASKS',open.length,overdue.length?overdue.length+' overdue':'Keep the queue moving'],['DUE TODAY',due.length,due.length?'Protect time for these':'No tasks due today'],['ACTIVE PROJECTS',activeProjects.length,'Outcomes in progress'],['COMPLETED',done.length,'Tasks marked done']];
  document.getElementById('commandMetrics').innerHTML=metrics.map((m,i)=>`<div class="metric-card"><div class="metric-label">${m[0]}</div><div class="metric-value" ${i===0&&overdue.length?'style="color:var(--red)"':''}>${m[1]}</div><div class="metric-detail">${m[2]}</div></div>`).join('');
  const queue=sortedTasks(open).slice(0,5), taskWrap=document.getElementById('commandTasks');
  taskWrap.innerHTML=queue.length?queue.map(t=>taskCardHTML(t,true)).join(''):'<div class="empty-state">Queue clear. Capture a task above or use the Tasks section to plan your next action.</div>';
  const projectWrap=document.getElementById('commandProjects');
  projectWrap.innerHTML=activeProjects.length?activeProjects.slice(0,4).map(p=>projectCardHTML(p,true)).join(''):'<div class="empty-state">No active projects yet. Add an outcome in Projects & goals to give your work direction.</div>';
  renderTaskSuggestions();
  renderFocusTaskOptions();
  renderCommandLifeAreas();
  renderWeeklyReview();
}
const LIFE_AREAS=[['personal','Personal'],['study','Study / learning'],['work','Work / career'],['health','Health / fitness'],['home','Home / errands'],['relationships','Relationships'],['finance','Finance'],['admin','Life admin'],['other','Other']];
const WEEKLY_REVIEW_KEY='bp_weeklyReview_v1';
let weeklyReview=safeReadJSON(WEEKLY_REVIEW_KEY,{});if(!weeklyReview||typeof weeklyReview!=='object'||Array.isArray(weeklyReview))weeklyReview={};
function areaName(area){return (LIFE_AREAS.find(a=>a[0]===area)||LIFE_AREAS[0])[1];}
function weekStartDate(){const d=new Date();d.setHours(12,0,0,0);d.setDate(d.getDate()-((d.getDay()+6)%7));return localISODate(d);}
function isoToLocalDate(v){const d=new Date(v);return Number.isNaN(d.getTime())?'':localISODate(d);}
function isThisWeek(iso){return !!iso&&iso>=weekStartDate()&&iso<=localISODate();}
function renderCommandLifeAreas(){const wrap=document.getElementById('commandLifeAreas');if(!wrap)return;const open=tasks.filter(taskIsOpen);const used=LIFE_AREAS.filter(([key])=>open.some(t=>(t.area||'personal')===key));wrap.innerHTML=used.length?'<div class="area-grid">'+used.map(([key,label])=>{const list=open.filter(t=>(t.area||'personal')===key),overdue=list.filter(taskIsOverdue).length;return `<div class="area-card"><strong>${escapeHtml(label)}</strong><div class="area-count">${list.length}</div><div class="area-detail">open task${list.length===1?'':'s'}${overdue?' · '+overdue+' overdue':''}</div></div>`;}).join('')+'</div>':'<div class="empty-state">Tag tasks by life area to see how responsibilities are distributed. A blank area is not automatically a problem.</div>';}
function renderWeeklyReview(){const metrics=document.getElementById('weeklyMetrics');if(!metrics)return;const open=tasks.filter(taskIsOpen),doneThisWeek=tasks.filter(t=>t.status==='done'&&isThisWeek(isoToLocalDate(t.updated))).length,overdue=open.filter(taskIsOverdue).length,dueSoon=open.filter(t=>t.due&&t.due>=localISODate()&&t.due<=localISODate(new Date(Date.now()+7*86400000))).length;metrics.innerHTML=[['COMPLETED THIS WEEK',doneThisWeek,'Tasks last updated as completed this week'],['OPEN TASKS',open.length,'Across all life areas'],['OVERDUE',overdue,'Items to review, not automatically rescheduled'],['DUE IN 7 DAYS',dueSoon,'Upcoming dated tasks']].map(m=>`<div class="metric-card"><div class="metric-label">${m[0]}</div><div class="metric-value">${m[1]}</div><div class="metric-detail">${m[2]}</div></div>`).join('');const areas=document.getElementById('weeklyAreas');areas.innerHTML='<div class="area-grid">'+LIFE_AREAS.map(([key,label])=>{const all=tasks.filter(t=>(t.area||'personal')===key),active=all.filter(taskIsOpen).length,done=all.filter(t=>t.status==='done'&&isThisWeek(isoToLocalDate(t.updated))).length;return `<div class="area-card"><strong>${escapeHtml(label)}</strong><div class="area-count">${active}</div><div class="area-detail">open · ${done} completed this week</div></div>`;}).join('')+'</div>';const current=weeklyReview[weekStartDate()]||{};for(const [id,key] of [['weeklyWins','wins'],['weeklyFriction','friction'],['weeklyFocus','focus'],['weeklyChange','change']]){const el=document.getElementById(id);if(el&&document.activeElement!==el&&el.value!==String(current[key]||''))el.value=current[key]||'';}const suggestions=[];if(overdue)suggestions.push(`${overdue} overdue task${overdue===1?'':'s'}: review whether to complete, renegotiate or remove each deadline.`);if(dueSoon>5)suggestions.push(`${dueSoon} tasks are due in the next seven days: consider checking whether the workload fits your available time.`);const noArea=LIFE_AREAS.filter(([key])=>!tasks.some(t=>taskIsOpen(t)&&(t.area||'personal')===key));if(noArea.length)suggestions.push('No open tasks are currently tagged to: '+noArea.map(a=>a[1]).join(', ')+'. If those areas matter this week, consider capturing a task; no balance target is imposed.');if(!suggestions.length)suggestions.push('No obvious workload flag from current task data. Use your reflections to decide whether anything needs changing.');document.getElementById('weeklySuggestions').innerHTML=suggestions.map(t=>`<div class="review-suggestion">${escapeHtml(t)}</div>`).join('');const status=document.getElementById('weeklySavedStatus');if(status)status.textContent=current.savedAt?'Last saved locally '+new Date(current.savedAt).toLocaleString(): 'Not saved for this week yet.';}
function saveWeeklyReview(){const key=weekStartDate();weeklyReview[key]={wins:document.getElementById('weeklyWins').value.trim(),friction:document.getElementById('weeklyFriction').value.trim(),focus:document.getElementById('weeklyFocus').value.trim(),change:document.getElementById('weeklyChange').value.trim(),savedAt:new Date().toISOString()};try{localStorage.setItem(WEEKLY_REVIEW_KEY,JSON.stringify(weeklyReview));renderWeeklyReview();const status=document.getElementById('weeklySavedStatus');if(status)status.textContent='Saved locally just now. No plan changes were applied.';}catch(e){storageFullWarn();}}

const DISMISSED_SUGGESTIONS_KEY='bp_dismissedSuggestions_v1';
let dismissedSuggestions=safeReadJSON(DISMISSED_SUGGESTIONS_KEY,{});weeklyReview=safeReadJSON(WEEKLY_REVIEW_KEY,{});if(!weeklyReview||typeof weeklyReview!=='object'||Array.isArray(weeklyReview))weeklyReview={};if(!dismissedSuggestions||typeof dismissedSuggestions!=='object'||Array.isArray(dismissedSuggestions))dismissedSuggestions={};
function persistDismissedSuggestions(){try{localStorage.setItem(DISMISSED_SUGGESTIONS_KEY,JSON.stringify(dismissedSuggestions));}catch(e){console.warn('Could not save dismissed suggestions.');}}
function suggestionKey(t){return t.id+'|'+(t.due||'');}
function renderTaskSuggestions(){
 const wrap=document.getElementById('commandSuggestions');if(!wrap)return;
 const candidates=sortedTasks(tasks.filter(t=>taskIsOverdue(t)&&dismissedSuggestions[suggestionKey(t)]!==true)).slice(0,5);
 wrap.innerHTML=candidates.length?candidates.map(t=>`<div class="suggestion-card"><div class="suggestion-title">Review: ${escapeHtml(t.title)}</div><div class="suggestion-copy">This task is overdue (due ${escapeHtml(niceDate(t.due))}). Suggested change: move its due date to today, ${escapeHtml(niceDate(localISODate()))}. Nothing changes unless you approve.</div><div class="suggestion-actions"><button class="approve" onclick="approveTaskReschedule('${t.id}')">Approve change</button><button onclick="dismissTaskSuggestion('${t.id}')">Dismiss suggestion</button></div></div>`).join(''):'<div class="empty-state">No overdue changes need review. Suggestions never alter your plan without approval.</div>';
}
function approveTaskReschedule(id){const t=tasks.find(x=>x.id===id);if(!t||!taskIsOverdue(t))return;const oldDue=t.due,newDue=localISODate();if(!confirm('Approve this change?\n\n'+t.title+'\nDue date: '+niceDate(oldDue)+' → '+niceDate(newDue)))return;t.due=newDue;t.updated=new Date().toISOString();delete dismissedSuggestions[suggestionKey({...t,due:oldDue})];persistTasks();persistDismissedSuggestions();renderTasks();renderPlanner();renderCommandCentre();}
function dismissTaskSuggestion(id){const t=tasks.find(x=>x.id===id);if(!t)return;dismissedSuggestions[suggestionKey(t)]=true;persistDismissedSuggestions();renderTaskSuggestions();}

function taskCardHTML(t,compact=false){
 const dueText=t.due?(taskIsOverdue(t)?'OVERDUE · ':'DUE · ')+niceDate(t.due):'No due date';
 const areaLabel=({personal:'Personal',study:'Study',work:'Work',health:'Health',home:'Home',relationships:'Relationships',finance:'Finance',admin:'Life admin',other:'Other'})[t.area||'personal']||'Personal';const meta=[areaLabel,dueText,t.priority.toUpperCase()+' PRIORITY',(Number(t.duration)||25)+' MIN',taskProjectName(t.projectId)].filter(Boolean).join(' · ');
 return `<div class="task-item"><input class="task-check" type="checkbox" aria-label="Complete ${escapeHtml(t.title)}" ${t.status==='done'?'checked':''} onchange="toggleTaskDone('${t.id}',this.checked)"><div class="item-main"><div class="item-title">${escapeHtml(t.title)}${t.status==='progress'?'<span class="status-pill">In progress</span>':''}</div><div class="item-meta" ${taskIsOverdue(t)?'style="color:var(--red)"':''}><span class="priority-dot priority-${t.priority}"></span>${escapeHtml(meta)}</div>${!compact&&t.notes?`<div class="item-meta">${escapeHtml(t.notes)}</div>`:''}<div class="item-actions"><button onclick="editTask('${t.id}')">Edit</button>${t.status!=='done'?`<button onclick="setTaskStatus('${t.id}','progress')">Start</button>`:''}<button onclick="deleteTask('${t.id}')">Delete</button></div></div></div>`;
}
function renderTasks(){
 const select=document.getElementById('taskProject'), current=select.value;
 select.innerHTML='<option value="">No project</option>'+projects.filter(p=>p.status!=='done').map(p=>`<option value="${p.id}">${escapeHtml(p.title)}</option>`).join('');
 if(current)select.value=current;
 const filtered=tasks.filter(t=>taskFilter==='all'?true:taskFilter==='done'?t.status==='done':taskFilter==='today'?taskDueToday(t):taskIsOpen(t));
 document.querySelectorAll('#taskFilters button').forEach((b,i)=>b.classList.toggle('active-subject',['open','today','all','done'][i]===taskFilter));
 const list=document.getElementById('taskList');
 list.innerHTML=filtered.length?sortedTasks(filtered).map(t=>taskCardHTML(t,false)).join(''):'<div class="empty-state">No tasks in this view. Add one above or choose another filter.</div>';
}
function setTaskFilter(f){taskFilter=f;renderTasks();}
function clearTaskForm(){['taskEditId','taskTitle','taskDue','taskNotes'].forEach(id=>document.getElementById(id).value='');document.getElementById('taskDuration').value='25';document.getElementById('taskPriority').value='medium';document.getElementById('taskStatus').value='next';document.getElementById('taskArea').value='personal';document.getElementById('taskProject').value=taskProjectPrefill||'';taskProjectPrefill='';}
function saveTask(){
 const title=document.getElementById('taskTitle').value.trim(); if(!title){alert('Enter a task title.');document.getElementById('taskTitle').focus();return;}
 const id=document.getElementById('taskEditId').value, now=new Date().toISOString();
 const durationRaw=Number(document.getElementById('taskDuration').value);const duration=Number.isFinite(durationRaw)?Math.max(5,Math.min(480,Math.round(durationRaw/5)*5)):25;const data={title,due:document.getElementById('taskDue').value,duration,area:document.getElementById('taskArea').value||'personal',priority:document.getElementById('taskPriority').value,status:document.getElementById('taskStatus').value,projectId:document.getElementById('taskProject').value,notes:document.getElementById('taskNotes').value.trim(),updated:now};
 if(id){const idx=tasks.findIndex(t=>t.id===id);if(idx>=0)tasks[idx]={...tasks[idx],...data};}else tasks.push({id:'t'+Date.now().toString(36)+Math.random().toString(36).slice(2,7),created:now,...data});
 persistTasks();clearTaskForm();renderTasks();renderCommandCentre();
}
function quickAddTask(){const title=document.getElementById('quickTaskTitle').value.trim();if(!title){document.getElementById('quickTaskTitle').focus();return;}const now=new Date().toISOString();tasks.push({id:'t'+Date.now().toString(36)+Math.random().toString(36).slice(2,7),title,due:document.getElementById('quickTaskDue').value,duration:25,priority:document.getElementById('quickTaskPriority').value,status:'next',area:document.getElementById('quickTaskArea').value||'personal',projectId:'',notes:'',created:now,updated:now});persistTasks();document.getElementById('quickTaskTitle').value='';document.getElementById('quickTaskDue').value='';document.getElementById('quickTaskPriority').value='medium';document.getElementById('quickTaskArea').value='personal';renderCommandCentre();}
function editTask(id){const t=tasks.find(x=>x.id===id);if(!t)return;document.getElementById('taskEditId').value=t.id;document.getElementById('taskTitle').value=t.title;document.getElementById('taskDue').value=t.due||'';document.getElementById('taskDuration').value=Math.max(5,Math.min(480,Number(t.duration)||25));document.getElementById('taskPriority').value=t.priority||'medium';document.getElementById('taskArea').value=t.area||'personal';document.getElementById('taskStatus').value=t.status||'next';document.getElementById('taskProject').value=t.projectId||'';document.getElementById('taskNotes').value=t.notes||'';showView('tasks');document.getElementById('taskFormPanel').scrollIntoView({behavior:'smooth',block:'start'});}
function toggleTaskDone(id,done){const t=tasks.find(x=>x.id===id);if(!t)return;t.status=done?'done':'next';t.updated=new Date().toISOString();persistTasks();renderTasks();renderCommandCentre();renderProjects();}
function setTaskStatus(id,status){const t=tasks.find(x=>x.id===id);if(!t)return;t.status=status;t.updated=new Date().toISOString();persistTasks();renderTasks();renderCommandCentre();}
function deleteTask(id){const t=tasks.find(x=>x.id===id);if(!t||!confirm('Delete “'+t.title+'”?'))return;tasks=tasks.filter(x=>x.id!==id);persistTasks();renderTasks();renderCommandCentre();renderProjects();}
function clearProjectForm(){['projectEditId','projectTitle','projectTarget','projectDescription'].forEach(id=>document.getElementById(id).value='');document.getElementById('projectStatus').value='active';}
function saveProject(){const title=document.getElementById('projectTitle').value.trim();if(!title){alert('Enter a project or goal name.');document.getElementById('projectTitle').focus();return;}const id=document.getElementById('projectEditId').value,now=new Date().toISOString(),data={title,target:document.getElementById('projectTarget').value,status:document.getElementById('projectStatus').value,description:document.getElementById('projectDescription').value.trim(),updated:now};if(id){const idx=projects.findIndex(p=>p.id===id);if(idx>=0)projects[idx]={...projects[idx],...data};}else projects.push({id:'p'+Date.now().toString(36)+Math.random().toString(36).slice(2,7),created:now,...data});persistProjects();clearProjectForm();renderProjects();renderCommandCentre();renderTasks();}
function projectCardHTML(p,compact=false){const linked=tasks.filter(t=>t.projectId===p.id),done=linked.filter(t=>t.status==='done').length,percent=linked.length?Math.round(done/linked.length*100):0;return `<div class="project-item"><div class="item-main"><div class="item-title">${escapeHtml(p.title)}<span class="status-pill">${escapeHtml(p.status)}</span></div><div class="item-meta">${p.target?'TARGET · '+niceDate(p.target)+' · ':''}${linked.length} linked task${linked.length===1?'':'s'} · ${percent}% complete</div><div class="progress-track"><div class="progress-fill" style="width:${percent}%"></div></div>${!compact&&p.description?`<div class="item-meta" style="margin-top:8px">${escapeHtml(p.description)}</div>`:''}<div class="item-actions"><button onclick="editProject('${p.id}')">Edit</button><button onclick="showProjectTasks('${p.id}')">＋ Linked task</button><button onclick="deleteProject('${p.id}')">Delete</button></div></div></div>`;}
function renderProjects(){const list=document.getElementById('projectList');if(!list)return;list.innerHTML=projects.length?[...projects].sort((a,b)=>({active:0,paused:1,done:2}[a.status]??1)-({active:0,paused:1,done:2}[b.status]??1)).map(p=>projectCardHTML(p,false)).join(''):'<div class="empty-state">No projects yet. Add a project or goal above, then link tasks to it.</div>';}
function editProject(id){const p=projects.find(x=>x.id===id);if(!p)return;document.getElementById('projectEditId').value=p.id;document.getElementById('projectTitle').value=p.title;document.getElementById('projectTarget').value=p.target||'';document.getElementById('projectStatus').value=p.status||'active';document.getElementById('projectDescription').value=p.description||'';document.getElementById('projectTitle').scrollIntoView({behavior:'smooth',block:'center'});}
function showProjectTasks(id){taskProjectPrefill=id;showView('tasks');clearTaskForm();document.getElementById('taskProject').value=id;document.getElementById('taskTitle').focus({preventScroll:true});document.getElementById('taskFormPanel').scrollIntoView({behavior:'smooth',block:'start'});}
function deleteProject(id){const p=projects.find(x=>x.id===id);if(!p||!confirm('Delete project “'+p.title+'”? Linked tasks will be kept but unlinked.'))return;projects=projects.filter(x=>x.id!==id);tasks=tasks.map(t=>t.projectId===id?{...t,projectId:''}:t);persistProjects();persistTasks();renderProjects();renderCommandCentre();renderTasks();}
function exportBackup(){
 const blob=new Blob([buildBackupJSON()],{type:'application/json'}),url=URL.createObjectURL(blob),a=document.createElement('a');a.href=url;a.download='bridge-protocol-backup-'+localISODate()+'.json';document.body.appendChild(a);a.click();a.remove();setTimeout(()=>URL.revokeObjectURL(url),1000);lsSet(LAST_BACKUP_KEY,new Date().toISOString());try{renderBackupNudge();refreshDataStatus();}catch(e){}
}
function importBackupFile(input){const file=input.files&&input.files[0];if(!file)return;if(file.size>10*1024*1024){alert('Backup is larger than 10 MB. Please check that you selected a Bridge Protocol JSON backup.');input.value='';return;}const reader=new FileReader();reader.onload=()=>{try{const parsed=JSON.parse(reader.result);if(parsed.format!=='bridge-protocol-backup'||!parsed.data||typeof parsed.data!=='object'||Array.isArray(parsed.data))throw new Error('This is not a recognised Bridge Protocol backup.');const backupKeys=Object.keys(parsed.data).filter(k=>k.startsWith('bp_'));const backupTaskCount=Array.isArray(parsed.data[TASKS_KEY])?parsed.data[TASKS_KEY].length:0;const backupProjectCount=Array.isArray(parsed.data[PROJECTS_KEY])?parsed.data[PROJECTS_KEY].length:0;if(!confirm('RESTORE PREVIEW\nExported: '+(parsed.exportedAt||'unknown date')+'\nApp version: '+(parsed.appVersion||'unknown')+'\nData sections: '+backupKeys.length+'\nTasks: '+backupTaskCount+'\nProjects: '+backupProjectCount+'\n\nExisting local values for matching keys will be replaced. Export a current backup first. Continue?')){input.value='';return;}const incomingTasks=parsed.data[TASKS_KEY]===undefined?[]:parsed.data[TASKS_KEY],incomingProjects=parsed.data[PROJECTS_KEY]===undefined?[]:parsed.data[PROJECTS_KEY];if(!Array.isArray(incomingTasks)||!Array.isArray(incomingProjects))throw new Error('Task/project data is invalid.');const idPattern=/^[A-Za-z0-9_-]{1,80}$/;const safeProjects=incomingProjects.filter(p=>p&&typeof p==='object'&&typeof p.title==='string').map((p,i)=>({id:typeof p.id==='string'&&idPattern.test(p.id)?p.id:'p-import-'+i,title:p.title.slice(0,120),target:typeof p.target==='string'?p.target:'',status:['active','paused','done'].includes(p.status)?p.status:'active',description:typeof p.description==='string'?p.description.slice(0,1200):'',created:p.created||new Date().toISOString(),updated:p.updated||new Date().toISOString()}));const projectIds=new Set(safeProjects.map(p=>p.id));const safeTasks=incomingTasks.filter(t=>t&&typeof t==='object'&&typeof t.title==='string').map((t,i)=>({id:typeof t.id==='string'&&idPattern.test(t.id)?t.id:'t-import-'+i,title:t.title.slice(0,160),due:typeof t.due==='string'?t.due:'',duration:Number.isFinite(Number(t.duration))?Math.max(5,Math.min(480,Math.round(Number(t.duration)/5)*5)):25,area:['personal','study','work','health','home','relationships','finance','admin','other'].includes(t.area)?t.area:'personal',priority:['high','medium','low'].includes(t.priority)?t.priority:'medium',status:['next','progress','done'].includes(t.status)?t.status:'next',projectId:projectIds.has(t.projectId)?t.projectId:'',notes:typeof t.notes==='string'?t.notes.slice(0,1200):'',created:t.created||new Date().toISOString(),updated:t.updated||new Date().toISOString()}));parsed.data[TASKS_KEY]=safeTasks;parsed.data[PROJECTS_KEY]=safeProjects;const KNOWN_ARRAY_KEYS=[HABITS_KEY,'bp_customNotes',...Object.values(LIFEOS_KEYS).filter(k=>k!=='bp_lifeSavings_v1')];const KNOWN_OBJECT_KEYS=['bp_dayModes','bp_checklist','bp_notesExpanded',WEEKLY_REVIEW_KEY,DISMISSED_SUGGESTIONS_KEY,'bp_macroState','bp_lifeSavings_v1'];
const staged=[];for(const [key,rawValue] of Object.entries(parsed.data)){if(!key.startsWith('bp_'))continue;let value=rawValue;
 if(key===TASKS_KEY||key===PROJECTS_KEY){/* already normalised above */}
 else if(key===WORKOUT_LOG_KEY)value=normalizeWorkoutLog(rawValue);
 else if(key===QSTATS_KEY)value=normalizeQStats(rawValue);
 else if(key===TIMERCFG_KEY)value=normalizeTimerCfg(rawValue);
 else if(key===REVISED_KEY)value=normalizeRevised(rawValue);
 else if(key===EXAMS_KEY)value=normList(rawValue,normalizeExam);
 else if(key===SCHEDULE_KEY)value=normalizeScheduleCustom(rawValue);
 else if(key===CHECKIN_KEY)value=normalizeCheckins(rawValue);
 else if(key===CARDS_KEY)value=normalizeCardState(rawValue);
 else if(key===PAPERS_KEY)value=normList(rawValue,normalizePaper);
 else if(key===BODY_KEY)value=normalizeBody(rawValue);
 else if(key===APPEAR_KEY)value=normalizeAppearance(rawValue);
 else if(key==='bp_music_v1')value=normalizeMusic(rawValue);
 else if(key===STUDY_KEY)value=normalizeStudy(rawValue);
 else if(key===MISTAKES_KEY)value=normalizeMistakes(rawValue);
 else if(key===BLURT_KEY)value=normalizeBlurt(rawValue);
 else if(key===SPECRAG_KEY)value=normalizeSpecRag(rawValue);
 else if(key===CAMP_KEY){value=normalizeCamp(rawValue);if(!value)continue;}
 else if(key===HABITS_KEY)value=normList(rawValue,normalizeHabitRecord);
 else if(key==='bp_customNotes')value=normList(rawValue,normalizeCustomNoteRecord);
 else if(key==='bp_notesSubject'){if(typeof rawValue!=='string'||!validNotesSubject(rawValue))continue;value=rawValue;}
 else if(KNOWN_ARRAY_KEYS.includes(key)){if(!Array.isArray(rawValue))continue;}
 else if(KNOWN_OBJECT_KEYS.includes(key)){if(!rawValue||typeof rawValue!=='object'||Array.isArray(rawValue))continue;}
 else continue;/* unknown keys are ignored rather than written blindly */
 staged.push([key,key==='bp_notesSubject'?value:JSON.stringify(value)]);}
const rollback=staged.map(([k])=>[k,lsGet(k)]);let writeFailed=false;
for(const [k,v] of staged){if(!lsSet(k,v,true)){writeFailed=true;break;}}
if(writeFailed){for(const [k,old] of rollback){try{if(old===null)localStorage.removeItem(k);else localStorage.setItem(k,old);}catch(e){}}throw new Error('Not enough browser storage to restore this backup. Nothing was changed.');}
const restoredSubject=lsGet('bp_notesSubject');if(restoredSubject&&validNotesSubject(restoredSubject))notesSubject=restoredSubject;
notesExpanded=safeReadJSON('bp_notesExpanded',{});if(!notesExpanded||typeof notesExpanded!=='object'||Array.isArray(notesExpanded))notesExpanded={};
dayModes=safeReadJSON('bp_dayModes',{});if(!dayModes||typeof dayModes!=='object'||Array.isArray(dayModes))dayModes={};
checklistState=safeReadJSON('bp_checklist',{});if(!checklistState||typeof checklistState!=='object'||Array.isArray(checklistState))checklistState={};
customNotes=normList(safeReadJSON('bp_customNotes',[]),normalizeCustomNoteRecord);
habits=normList(safeReadJSON(HABITS_KEY,[]),normalizeHabitRecord);
qStats=normalizeQStats(safeReadJSON(QSTATS_KEY,null));ivCfg=normalizeTimerCfg(safeReadJSON(TIMERCFG_KEY,null));notesRevised=normalizeRevised(safeReadJSON(REVISED_KEY,{}));exams=normList(safeReadJSON(EXAMS_KEY,[]),normalizeExam);scheduleCustom=normalizeScheduleCustom(safeReadJSON(SCHEDULE_KEY,{}));applySchedule();checkins=normalizeCheckins(safeReadJSON(CHECKIN_KEY,{}));cardState=normalizeCardState(safeReadJSON(CARDS_KEY,null));cardSession=null;papers=normList(safeReadJSON(PAPERS_KEY,[]),normalizePaper);body=normalizeBody(safeReadJSON(BODY_KEY,null));appearance=normalizeAppearance(safeReadJSON(APPEAR_KEY,null));applyAppearance();studyLog=normalizeStudy(safeReadJSON(STUDY_KEY,[]));mistakes=normalizeMistakes(safeReadJSON(MISTAKES_KEY,{}));blurtHistory=normalizeBlurt(safeReadJSON(BLURT_KEY,{}));specRag=normalizeSpecRag(safeReadJSON(SPECRAG_KEY,{}));camp=normalizeCamp(safeReadJSON(CAMP_KEY,null));
if(typeof lifeReloadFromStorage==='function')lifeReloadFromStorage();if(typeof musicReload==='function')musicReload();if(typeof mcLoadSavedInputs==='function')mcLoadSavedInputs();tasks=safeReadJSON(TASKS_KEY,[]);projects=safeReadJSON(PROJECTS_KEY,[]);dismissedSuggestions=safeReadJSON(DISMISSED_SUGGESTIONS_KEY,{});weeklyReview=safeReadJSON(WEEKLY_REVIEW_KEY,{});if(!weeklyReview||typeof weeklyReview!=='object'||Array.isArray(weeklyReview))weeklyReview={};if(!dismissedSuggestions||typeof dismissedSuggestions!=='object'||Array.isArray(dismissedSuggestions))dismissedSuggestions={};if(!Array.isArray(tasks))tasks=[];if(!Array.isArray(projects))projects=[];renderSchedule();renderChecklist();renderNotes();renderTasks();renderProjects();renderPlanner();renderHabits();workoutLog=normalizeWorkoutLog(safeReadJSON(WORKOUT_LOG_KEY,[]));renderWorkoutLog();renderCommandCentre();refreshDataStatus();lifeRenderAll();renderExams();if(!iv){ivRenderInputs();ivRenderIdle();}renderTestInsights();if(currentView)showView(currentView,{fromHistory:true});alert('Backup restored.');}catch(err){alert('Could not restore backup: '+err.message);}finally{input.value='';}};reader.onerror=()=>{alert('Could not read that file.');input.value='';};reader.readAsText(file);}
function refreshDataStatus(){const el=document.getElementById('dataStatus');if(!el)return;let bytes=0,keys=0;for(let i=0;i<localStorage.length;i++){const k=localStorage.key(i);if(k&&k.startsWith('bp_')){keys++;bytes+=(localStorage.getItem(k)||'').length*2;}}el.textContent=`${keys} saved data records · approximately ${(bytes/1024).toFixed(1)} KB in local storage · ${tasks.length} tasks · ${projects.length} projects. Last backup: ${lastBackupText()}. Last checked ${new Date().toLocaleTimeString()}.`;refreshPersistStatus();}
function resetAllAppData(){if(!confirm('This deletes all Bridge Protocol data saved in this browser, including notes, settings, tasks, projects, habit history, workout history, Life OS finance/nutrition/routines/resources/decisions, and calculator inputs. Export a backup first. Continue?'))return;if(!confirm('Final confirmation: permanently delete all local Bridge Protocol data on this device?'))return;const keys=[];for(let i=0;i<localStorage.length;i++){const k=localStorage.key(i);if(k&&k.startsWith('bp_'))keys.push(k);}keys.forEach(k=>localStorage.removeItem(k));tasks=[];projects=[];habits=[];workoutLog=[];dismissedSuggestions={};weeklyReview={};habitSelectedDate=localISODate();dayModes={};checklistState={};notesExpanded={};customNotes=[];notesSubject='Chemistry';qStats=normalizeQStats(null);exams=[];notesRevised={};ivCfg=normalizeTimerCfg(null);testTopicFocus=null;ivStop();scheduleCustom={};applySchedule();checkins={};cardState=normalizeCardState(null);cardSession=null;papers=[];body=normalizeBody(null);appearance=normalizeAppearance(null);applyAppearance();studyLog=[];studySession=null;mistakes={};blurtHistory={};blurtResult=null;specRag={};camp=null;quickLogRows=null;persistTasks();persistProjects();persistHabits();saveDayModes();saveChecklist();saveNotesExpanded();saveCustomNotes();lifeReloadFromStorage();if(typeof mcLoadSavedInputs==='function')mcLoadSavedInputs();renderSchedule();renderChecklist();renderNotes();renderTasks();renderProjects();renderPlanner();renderHabits();renderWorkoutLog();renderCommandCentre();refreshDataStatus();lifeRenderAll();renderExams();ivRenderInputs();ivRenderIdle();renderTestInsights();if(currentView)showView(currentView,{fromHistory:true});alert('Local Bridge Protocol data has been reset.');}

// Planner: task deadlines and project target dates share one local calendar.
let plannerMonth=new Date(new Date().getFullYear(),new Date().getMonth(),1);
let plannerSelectedDate=localISODate();
function changePlannerMonth(delta){plannerMonth=new Date(plannerMonth.getFullYear(),plannerMonth.getMonth()+delta,1);renderPlanner();}
function plannerGoToday(){plannerMonth=new Date();plannerMonth.setDate(1);plannerSelectedDate=localISODate();renderPlanner();}
function plannerSelectDate(date){plannerSelectedDate=date;renderPlanner();}
function plannerAddTask(){document.getElementById('taskDue').value=plannerSelectedDate;clearTaskForm();document.getElementById('taskDue').value=plannerSelectedDate;showView('tasks');document.getElementById('taskTitle').focus();}
function renderPlanner(){
 const label=document.getElementById('plannerMonthLabel'),grid=document.getElementById('plannerCalendar');if(!label||!grid)return;
 const year=plannerMonth.getFullYear(),month=plannerMonth.getMonth();label.textContent=fmtDate(plannerMonth,{month:'long',year:'numeric'});
 const start=new Date(year,month,1),offset=(start.getDay()+6)%7,daysInMonth=new Date(year,month+1,0).getDate();
 const eventDates=new Set([...tasks.filter(t=>t.due).map(t=>t.due),...projects.filter(p=>p.target).map(p=>p.target)]);
 let html=['M','T','W','T','F','S','S'].map(d=>`<div class="calendar-weekday">${d}</div>`).join('');
 for(let i=0;i<42;i++){const dayNum=i-offset+1;if(dayNum<1||dayNum>daysInMonth){html+='<button class="calendar-day" disabled aria-hidden="true"></button>';continue;}const d=new Date(year,month,dayNum),iso=localISODate(d),isToday=iso===localISODate(),hasEvent=eventDates.has(iso);html+=`<button class="calendar-day ${iso===plannerSelectedDate?'selected ':''}${isToday?'today':''}" aria-label="${iso}${hasEvent?', has scheduled items':''}" aria-pressed="${iso===plannerSelectedDate}" onclick="plannerSelectDate('${iso}')"><span>${dayNum}</span>${hasEvent?'<span class="calendar-dot"></span>':''}</button>`;}
 grid.innerHTML=html;
 const dayLabel=document.getElementById('plannerDayLabel');dayLabel.textContent=fmtDate(new Date(plannerSelectedDate+'T12:00:00'),{weekday:'long',day:'numeric',month:'long',year:'numeric'}).toUpperCase();
 const dayTasks=sortedTasks(tasks.filter(t=>t.due===plannerSelectedDate)),dayProjects=projects.filter(p=>p.target===plannerSelectedDate);const wrap=document.getElementById('plannerDayItems');
 let blocks=[];if(dayTasks.length)blocks.push('<div class="item-meta" style="margin:8px 0">TASKS</div>'+dayTasks.map(t=>taskCardHTML(t,false)).join(''));
 if(dayProjects.length)blocks.push('<div class="item-meta" style="margin:12px 0 8px">PROJECT TARGETS</div>'+dayProjects.map(p=>projectCardHTML(p,false)).join(''));
 wrap.innerHTML=blocks.length?blocks.join(''):'<div class="empty-state">Nothing scheduled for this day. Add a task or set a project target date.</div>';
}

// Habits are date-stamped check-ins; existing task/project data is untouched.
const HABITS_KEY='bp_habits_v1';let habits=normList(safeReadJSON(HABITS_KEY,[]),normalizeHabitRecord);let habitSelectedDate=localISODate();
function persistHabits(){try{localStorage.setItem(HABITS_KEY,JSON.stringify(habits));}catch(e){storageFullWarn();}}
function addHabit(){const input=document.getElementById('habitTitle'),title=input.value.trim();if(!title){input.focus();return;}if(habits.some(h=>h.title.toLowerCase()===title.toLowerCase())){alert('That habit already exists.');return;}habits.push({id:'h'+Date.now().toString(36)+Math.random().toString(36).slice(2,6),title:title.slice(0,100),created:localISODate(),checks:{}});persistHabits();input.value='';renderHabits();}
function habitStreak(h,date){let count=0,d=new Date(date+'T12:00:00');while(count<366){const iso=localISODate(d);if(!h.checks||h.checks[iso]!==true)break;count++;d.setDate(d.getDate()-1);}return count;}
function toggleHabit(id,checked){const h=habits.find(x=>x.id===id);if(!h)return;if(!h.checks||typeof h.checks!=='object')h.checks={};if(checked)h.checks[habitSelectedDate]=true;else delete h.checks[habitSelectedDate];persistHabits();renderHabits();}
function deleteHabit(id){const h=habits.find(x=>x.id===id);if(!h||!confirm('Delete habit “'+h.title+'” and its check-in history?'))return;habits=habits.filter(x=>x.id!==id);persistHabits();renderHabits();}
function changeHabitDate(delta){const d=new Date(habitSelectedDate+'T12:00:00');d.setDate(d.getDate()+delta);habitSelectedDate=localISODate(d);renderHabits();}
function renderHabits(){const list=document.getElementById('habitList');if(!list)return;const label=document.getElementById('habitDateLabel');label.textContent=fmtDate(new Date(habitSelectedDate+'T12:00:00'),{weekday:'short',day:'numeric',month:'short',year:'numeric'}).toUpperCase();const done=habits.filter(h=>h.checks&&h.checks[habitSelectedDate]===true).length;const today=localISODate();document.getElementById('habitStats').innerHTML=`<div class="metric-card"><div class="metric-label">CHECKED IN</div><div class="metric-value">${done}/${habits.length}</div><div class="metric-detail">For selected day</div></div><div class="metric-card"><div class="metric-label">TODAY</div><div class="metric-value">${habits.filter(h=>h.checks&&h.checks[today]===true).length}/${habits.length}</div><div class="metric-detail">Current-day completion</div></div>`;list.innerHTML=habits.length?habits.map(h=>`<div class="habit-row"><input type="checkbox" aria-label="Mark ${escapeHtml(h.title)} complete" ${h.checks&&h.checks[habitSelectedDate]===true?'checked':''} onchange="toggleHabit('${h.id}',this.checked)"><div class="habit-main"><div class="habit-title">${escapeHtml(h.title)}</div><div class="habit-meta">${habitStreak(h,habitSelectedDate)}-day streak · added ${niceDate(h.created)}</div></div><button class="small-action" onclick="deleteHabit('${h.id}')">Delete</button></div>`).join(''):'<div class="empty-state">No habits yet. Add one small, repeatable action above.</div>';}


// Training log and Willie Bag trainer. All state remains local and backup-compatible.
const WORKOUT_LOG_KEY='bp_workoutLog_v1';
function normalizeWorkoutLog(value){
 if(!Array.isArray(value))return [];
 return value.filter(x=>x&&typeof x==='object'&&!Array.isArray(x)).slice(0,1000).map((x,i)=>{
  const id=typeof x.id==='string'&&/^[A-Za-z0-9_-]{1,80}$/.test(x.id)?x.id:'w-import-'+i;
  const date=typeof x.date==='string'&&/^\d{4}-\d{2}-\d{2}$/.test(x.date)&&!Number.isNaN(Date.parse(x.date+'T12:00:00'))?x.date:localISODate();
  const sets=Number(x.sets),load=Number(x.load),rpe=Number(x.rpe);
  return {id,date,type:typeof x.type==='string'?x.type.slice(0,80):'Custom session',exercise:typeof x.exercise==='string'?x.exercise.slice(0,120):'Imported exercise',sets:Number.isInteger(sets)?Math.max(1,Math.min(30,sets)):1,reps:(typeof x.reps==='string'||typeof x.reps==='number')?String(x.reps).slice(0,30):'',load:x.load===null||x.load===''||x.load===undefined?null:(Number.isFinite(load)&&load>=0&&load<=1000?load:null),rpe:x.rpe===null||x.rpe===''||x.rpe===undefined?null:(Number.isFinite(rpe)&&rpe>=1&&rpe<=10?rpe:null),notes:typeof x.notes==='string'?x.notes.slice(0,600):'',created:typeof x.created==='string'?x.created:new Date().toISOString()};
 });
}
let workoutLog=normalizeWorkoutLog(safeReadJSON(WORKOUT_LOG_KEY,[]));
const WILLIE_TARGETS={1:{short:'Left hook to jaw',left:'Left hook to jaw',right:'Rear-hand hook to jaw'},2:{short:'Right hook to jaw',left:'Rear-hand hook to jaw',right:'Lead-hand hook to jaw'},3:{short:'Left uppercut',left:'Left uppercut',right:'Rear-hand uppercut'},4:{short:'Right uppercut',left:'Rear-hand uppercut',right:'Lead-hand uppercut'},5:{short:'Left hook to body',left:'Left hook to body',right:'Rear-hand hook to body'},6:{short:'Right hook to body',left:'Rear-hand hook to body',right:'Lead-hand hook to body'},7:{short:'Jab to head',left:'Lead-hand jab to head',right:'Lead-hand jab to head'},8:{short:'Jab to body',left:'Lead-hand jab to body',right:'Lead-hand jab to body'}};
let willieLastNumber=null,willieTimer=null,willieCallsDone=0,willieCallsGoal=20,willieDrillRunning=false;
function showTrainingPanel(panel){['plan','log','willie'].forEach(k=>{const el=document.getElementById('training-panel-'+k),tab=document.getElementById('training-tab-'+k);if(el)el.classList.toggle('hidden',k!==panel);if(tab)tab.classList.toggle('active',k===panel);});if(panel==='log')renderWorkoutLog();if(panel==='willie'){updateWillieMapping();if(willieLastNumber!==null)willieSelectTarget(willieLastNumber,false);}}
function saveWorkoutEntry(){const exercise=document.getElementById('workoutExercise').value.trim();if(!exercise){alert('Enter an exercise or drill first.');document.getElementById('workoutExercise').focus();return;}const sets=Number(document.getElementById('workoutSets').value),reps=document.getElementById('workoutReps').value.trim(),loadRaw=document.getElementById('workoutLoad').value,rpeRaw=document.getElementById('workoutRpe').value;if(!Number.isInteger(sets)||sets<1||sets>30){alert('Sets or rounds must be between 1 and 30.');return;}if(!reps){alert('Enter reps, round duration or another useful measure.');return;}const entry={id:'w'+Date.now().toString(36)+Math.random().toString(36).slice(2,7),date:document.getElementById('workoutDate').value||localISODate(),type:document.getElementById('workoutType').value,exercise:exercise.slice(0,120),sets,reps:reps.slice(0,30),load:loadRaw===''?null:Number(loadRaw),rpe:rpeRaw===''?null:Number(rpeRaw),notes:document.getElementById('workoutNotes').value.trim().slice(0,600),created:new Date().toISOString()};if(entry.load!==null&&(!Number.isFinite(entry.load)||entry.load<0||entry.load>1000)){alert('Load must be between 0 and 1000 kg, or blank.');return;}workoutLog.unshift(entry);if(workoutLog.length>1000)workoutLog=workoutLog.slice(0,1000);persistWorkoutLog();document.getElementById('workoutExercise').value='';document.getElementById('workoutNotes').value='';renderWorkoutLog();}
function persistWorkoutLog(){try{localStorage.setItem(WORKOUT_LOG_KEY,JSON.stringify(workoutLog));}catch(e){storageFullWarn();}}
function deleteWorkoutEntry(id){const e=workoutLog.find(x=>x.id===id);if(!e||!confirm('Delete this workout entry?'))return;workoutLog=workoutLog.filter(x=>x.id!==id);persistWorkoutLog();renderWorkoutLog();}
function renderWorkoutLog(){const list=document.getElementById('workoutLogList');if(!list)return;const today=localISODate(),weekStart=new Date();weekStart.setHours(12,0,0,0);weekStart.setDate(weekStart.getDate()-6);const since=localISODate(weekStart),week=workoutLog.filter(x=>x.date>=since&&x.date<=today),sessions=new Set(week.map(x=>x.date+'|'+x.type));const stats=document.getElementById('trainingLogStats');if(stats)stats.innerHTML=`<div class="training-stat"><strong>${workoutLog.length}</strong><span>Total entries</span></div><div class="training-stat"><strong>${sessions.size}</strong><span>Sessions · 7 days</span></div><div class="training-stat"><strong>${week.length}</strong><span>Entries · 7 days</span></div>`;list.innerHTML=workoutLog.length?workoutLog.slice(0,40).map(e=>`<div class="training-log-item"><strong>${escapeHtml(e.exercise)}</strong><div class="item-meta">${escapeHtml(e.date)} · ${escapeHtml(e.type)}</div><p>${e.sets} set/round(s) × ${escapeHtml(e.reps)}${e.load!==null&&Number.isFinite(Number(e.load))?' · '+Number(e.load)+' kg':''}${e.rpe?' · RPE '+e.rpe:''}${e.notes?' · '+escapeHtml(e.notes):''}</p><button class="small-action" style="margin-top:7px" onclick="deleteWorkoutEntry('${e.id}')">Delete entry</button></div>`).join(''):'<div class="empty-state">No workouts logged yet. Add your first exercise or boxing drill above.</div>';}
function willieMappingFor(n){const stance=document.getElementById('willieStance')?.value||'orthodox';return stance==='southpaw'?WILLIE_TARGETS[n].right:WILLIE_TARGETS[n].left;}
function updateWillieMapping(){const legend=document.getElementById('willieLegend');if(!legend)return;legend.innerHTML='<ol style="margin:0;padding-left:20px">'+Array.from({length:8},(_,i)=>i+1).map(n=>`<li style="margin:5px 0;font-size:12px;color:var(--text2)"><b>${n}.</b> ${escapeHtml(willieMappingFor(n))}</li>`).join('')+'</ol>';if(willieLastNumber!==null){const label=document.getElementById('willieCurrentTarget');if(label)label.textContent=willieMappingFor(willieLastNumber);}}
function willieSelectTarget(n,announce=false){if(!Number.isInteger(n)||n<1||n>8)return;willieLastNumber=n;for(let i=1;i<=8;i++){const zone=document.getElementById('willie-zone-'+i),btn=document.getElementById('willie-pick-'+i);if(zone)zone.classList.toggle('active',i===n);if(btn)btn.classList.toggle('active',i===n);}const num=document.getElementById('willieCurrentNumber'),label=document.getElementById('willieCurrentTarget');if(num)num.textContent=String(n);if(label)label.textContent=willieMappingFor(n);if(announce)willieSpeak(n);}
function willieSpeak(n){const status=document.getElementById('willieVoiceStatus');if(!('speechSynthesis' in window)||typeof SpeechSynthesisUtterance==='undefined'){if(status)status.textContent='Speech output is unavailable in this browser. Use the highlighted target and number.';return;}try{window.speechSynthesis.cancel();const mode=document.getElementById('willieCallMode')?.value||'number',utterance=new SpeechSynthesisUtterance(mode==='number-target'?`${n}. ${willieMappingFor(n)}`:String(n));utterance.rate=1.05;utterance.pitch=1;utterance.volume=1;utterance.onerror=()=>{if(status)status.textContent='Voice output failed; continue with the visible target.';};window.speechSynthesis.speak(utterance);if(status)status.textContent='Calling number '+n+(mode==='number-target'?' — '+willieMappingFor(n):'')+'.';}catch(e){if(status)status.textContent='Voice output unavailable; use the visible target.';}}
function willieNextCall(){let n=Math.floor(Math.random()*8)+1;if(n===willieLastNumber)n=(n%8)+1;willieCallsDone++;willieSelectTarget(n);willieSpeak(n);const progress=document.getElementById('willieProgress');if(progress)progress.textContent=willieDrillRunning?`Call ${willieCallsDone} of ${willieCallsGoal}.`:'Manual call.';return n;}
function willieStartDrill(){willieStopDrill(false);willieCallsDone=0;willieCallsGoal=Number(document.getElementById('willieCallCount')?.value)||20;willieDrillRunning=true;const progress=document.getElementById('willieProgress');if(progress)progress.textContent=`Call 0 of ${willieCallsGoal}.`;willieNextCall();const interval=(Number(document.getElementById('willieInterval')?.value)||3)*1000;willieTimer=window.setInterval(()=>{if(!willieDrillRunning)return;if(willieCallsDone>=willieCallsGoal){willieStopDrill();return;}willieNextCall();},interval);}
function willieStopDrill(update=true){if(willieTimer!==null){window.clearInterval(willieTimer);willieTimer=null;}willieDrillRunning=false;if('speechSynthesis' in window)window.speechSynthesis.cancel();const progress=document.getElementById('willieProgress');if(progress&&update)progress.textContent=`Drill stopped after ${willieCallsDone} call(s).`;}
window.addEventListener('beforeunload',()=>{if(willieTimer!==null)window.clearInterval(willieTimer);});

/* ===================== v31: interval timer · smart practice · exams · Daily Coach ===================== */
const QSTATS_KEY='bp_questionStats_v1', EXAMS_KEY='bp_exams_v1', REVISED_KEY='bp_notesRevised_v1', TIMERCFG_KEY='bp_timerCfg_v1';
const EXAM_SUBJECTS=['Chemistry','Biology','Maths','Other'];
function mkEl(tag,cls,text){const n=document.createElement(tag);if(cls)n.className=cls;if(text!==undefined)n.textContent=text;return n;}
function fmtClock(sec){sec=Math.max(0,Math.round(sec));return String(Math.floor(sec/60)).padStart(2,'0')+':'+String(sec%60).padStart(2,'0');}

/* ---------- Smart question practice ---------- */
function normalizeQStats(v){
  const out={mode:'smart',topics:{}};
  if(!v||typeof v!=='object'||Array.isArray(v))return out;
  if(v.mode==='random')out.mode='random';
  if(v.topics&&typeof v.topics==='object'&&!Array.isArray(v.topics)){
    let n=0;
    for(const k of Object.keys(v.topics)){
      if(n>=400)break;
      const t=v.topics[k];
      if(typeof k!=='string'||k.length>200||!k.includes('|')||!t||typeof t!=='object')continue;
      const h=Array.isArray(t.h)?t.h.map(Number).filter(Number.isFinite).slice(-8).map(x=>Math.max(0,Math.min(1,x))):[];
      if(!h.length)continue;
      out.topics[k]={h,n:Math.max(h.length,Math.min(100000,Math.floor(Number(t.n))||h.length)),last:isoStampOr(t.last)};
      n++;
    }
  }
  return out;
}
let qStats=normalizeQStats(safeReadJSON(QSTATS_KEY,null));
function saveQStats(){lsSet(QSTATS_KEY,JSON.stringify(qStats));}
function topicKey(q){return q.subject+'|'+q.topic;}
/* v36: a focus key is either a topic key (Subject|Topic) or a spec point (spec:Subject|code) */
function focusMatch(q,k){if(String(k).startsWith('spec:')){const [sub,code]=k.slice(5).split(/\|(.*)/s);return q.subject===sub&&Array.isArray(q.spec)&&q.spec.includes(code);}return topicKey(q)===k;}
function focusLabel(k){return String(k).startsWith('spec:')?'spec point '+k.slice(5).replace('|',' '):k.split('|').slice(1).join('|');}
let specQIndex=null;function specQuestionCount(subject,code){if(!specQIndex){specQIndex={};(QUESTIONS||[]).forEach(q=>(Array.isArray(q.spec)?q.spec:[]).forEach(c=>{const k=q.subject+'|'+c;specQIndex[k]=(specQIndex[k]||0)+1;}));}return specQIndex[subject+'|'+code]||0;}
function recordQuestionResult(q,scored,total){
  if(!q||!total)return;
  const k=topicKey(q),t=qStats.topics[k]||(qStats.topics[k]={h:[],n:0,last:''});
  t.h.push(scored/total);if(t.h.length>8)t.h.shift();
  t.n++;t.last=new Date().toISOString();saveQStats();
}
// Recent attempts count more than old ones (weights 1..n, newest heaviest).
function topicStrength(t){let w=0,s=0;t.h.forEach((x,i)=>{w+=i+1;s+=x*(i+1);});return w?s/w:0;}
function weakTopics(limit=3,subject){
  return Object.entries(qStats.topics).map(([k,t])=>{const parts=k.split('|');return {key:k,subject:parts[0],topic:parts.slice(1).join('|'),pct:Math.round(topicStrength(t)*100),n:t.n,last:t.last};})
    .filter(x=>(!subject||subject==='All'||x.subject===subject)&&x.pct<70&&QUESTIONS.some(q=>topicKey(q)===x.key))
    .sort((a,b)=>a.pct-b.pct||b.n-a.n).slice(0,limit);
}
let recentQs=[],testTopicFocus=null;
function weightedPick(items,weightOf){
  const ws=items.map(weightOf),total=ws.reduce((a,b)=>a+b,0);let r=Math.random()*total;
  for(let i=0;i<items.length;i++){r-=ws[i];if(r<=0)return items[i];}
  return items[items.length-1];
}
function pickQuestion(){
  let pool=testSubjectFilter==='All'?QUESTIONS:QUESTIONS.filter(q=>q.subject===testSubjectFilter);
  if(testTopicFocus){const f=pool.filter(q=>focusMatch(q,testTopicFocus));if(f.length)pool=f;else testTopicFocus=null;}
  const fresh=arr=>{const f=arr.filter(q=>!recentQs.includes(q.q));return f.length?f:arr;};
  // Pick a subject first so the larger Chemistry/Biology banks do not drown out Maths.
  const subjects=[...new Set(pool.map(q=>q.subject))];
  const subject=subjects[Math.floor(Math.random()*subjects.length)];
  const subjPool=pool.filter(q=>q.subject===subject);
  let q;
  if(qStats.mode==='smart'&&!testTopicFocus){
    const byTopic={};subjPool.forEach(x=>{(byTopic[topicKey(x)]=byTopic[topicKey(x)]||[]).push(x);});
    const now=Date.now();
    const key=weightedPick(Object.keys(byTopic),k=>{
      const t=qStats.topics[k];if(!t)return 1.2;                        // unseen topics get a fair chance
      const days=(now-Date.parse(t.last))/86400000;
      return 0.4+(1-topicStrength(t))*2.4+(days>3?0.4:0);                // weak and stale topics come up more
    });
    q=fresh(byTopic[key])[Math.floor(Math.random()*fresh(byTopic[key]).length)];
  }else{
    const c=fresh(subjPool);q=c[Math.floor(Math.random()*c.length)];
  }
  recentQs.push(q.q);if(recentQs.length>6)recentQs.shift();
  return q;
}
function setPracticeMode(m){qStats.mode=m==='random'?'random':'smart';saveQStats();renderTestInsights();}
function focusTopic(key){testTopicFocus=key;newQuestion();}
function clearTopicFocus(){testTopicFocus=null;newQuestion();}
function renderTestInsights(){
  const box=document.getElementById('testInsights');if(!box)return;
  box.textContent='';
  const card=mkEl('div','insight-card');
  const row=mkEl('div','insight-row');row.appendChild(mkEl('span','metric-label','PRACTICE MODE'));
  const seg=mkEl('div','mode-toggle');
  [['smart','Smart'],['random','Random']].forEach(([m,label])=>{const b=mkEl('button',qStats.mode===m?'active-study':'',label);b.type='button';b.addEventListener('click',()=>setPracticeMode(m));seg.appendChild(b);});
  row.appendChild(seg);card.appendChild(row);
  card.appendChild(mkEl('p','insight-note',qStats.mode==='smart'?'Smart mode shows your weaker and less-recent topics more often.':'Random mode picks any question with equal chance.'));
  if(testTopicFocus){
    const chip=mkEl('div','insight-focus');chip.appendChild(mkEl('span','', 'Focused: '+focusLabel(testTopicFocus)));
    const x=mkEl('button','insight-x','✕ Clear');x.type='button';x.addEventListener('click',clearTopicFocus);chip.appendChild(x);card.appendChild(chip);
  }
  const weak=weakTopics(3,testSubjectFilter);
  if(weak.length){
    card.appendChild(mkEl('p','metric-label','WEAKEST TOPICS · tap to drill'));
    weak.forEach(w=>{const b=mkEl('button','insight-topic');b.type='button';b.appendChild(mkEl('span','',w.topic));b.appendChild(mkEl('span','insight-pct',w.pct+'%'));b.addEventListener('click',()=>focusTopic(w.key));card.appendChild(b);});
  }else{
    card.appendChild(mkEl('p','insight-note','Answer a few questions and your weakest topics will appear here.'));
  }
  box.appendChild(card);
}

/* ---------- Notes: revised tracking ---------- */
function normalizeRevised(v){const out={};if(!v||typeof v!=='object'||Array.isArray(v))return out;let n=0;for(const k of Object.keys(v)){if(n>=800)break;if(typeof k==='string'&&k.length<=200&&k.includes('|')&&v[k]===true){out[k]=true;n++;}}return out;}
let notesRevised=normalizeRevised(safeReadJSON(REVISED_KEY,{}));
function revisedKey(subject,title){return subject+'|'+title;}
function toggleRevised(subject,index){
  const t=NOTES[subject]&&NOTES[subject][index];if(!t)return;
  const k=revisedKey(subject,t.title);
  if(notesRevised[k])delete notesRevised[k];else notesRevised[k]=true;
  lsSet(REVISED_KEY,JSON.stringify(notesRevised));renderNotes();
}
function revisionProgress(subject){
  const list=NOTES[subject]||[];const done=list.filter(t=>notesRevised[revisedKey(subject,t.title)]).length;
  return {done,total:list.length,remaining:list.length-done};
}
function nextUnrevisedTopic(subject){const list=NOTES[subject]||[];const i=list.findIndex(t=>!notesRevised[revisedKey(subject,t.title)]);return i<0?null:{index:i,topic:list[i]};}

/* ---------- Exams ---------- */
function normalizeExam(e,i){
  if(!e||typeof e!=='object'||typeof e.name!=='string'||!e.name.trim())return null;
  const date=isoDateOrEmpty(e.date);if(!date)return null;
  return {id:typeof e.id==='string'&&SAFE_ID_RE.test(e.id)?e.id:'x-fix-'+i+'-'+Math.random().toString(36).slice(2,6),name:e.name.slice(0,80),subject:EXAM_SUBJECTS.includes(e.subject)?e.subject:'Other',date};
}
let exams=normList(safeReadJSON(EXAMS_KEY,[]),normalizeExam);
function persistExams(){if(!lsSet(EXAMS_KEY,JSON.stringify(exams)))storageFullWarn();}
function daysUntil(iso,from){const a=new Date((from||localISODate())+'T12:00:00'),b=new Date(iso+'T12:00:00');return Math.round((b-a)/86400000);}
function upcomingExams(from){return exams.filter(e=>daysUntil(e.date,from)>=0).sort((a,b)=>a.date.localeCompare(b.date));}
function daysLabel(d){return d===0?'Today':d===1?'Tomorrow':d+' days';}
function examPace(e,from){
  if(!NOTES[e.subject])return '';
  const d=daysUntil(e.date,from),p=revisionProgress(e.subject);
  if(!p.remaining)return 'All '+p.total+' '+e.subject+' topics marked revised — keep testing yourself.';
  return p.remaining+' of '+p.total+' '+e.subject+' topics not yet revised'+(d>0?' → about '+Math.ceil(p.remaining/d)+' per day to finish in time.':'.');
}
function addExam(){
  const name=document.getElementById('examName').value.trim(),date=document.getElementById('examDate').value,subject=document.getElementById('examSubject').value;
  if(!name){alert('Enter an exam name, e.g. "Biology Paper 1".');return;}
  if(!isoDateOrEmpty(date)){alert('Choose the exam date.');return;}
  exams.push({id:'x'+Date.now().toString(36)+Math.random().toString(36).slice(2,5),name:name.slice(0,80),subject:EXAM_SUBJECTS.includes(subject)?subject:'Other',date});
  persistExams();document.getElementById('examName').value='';document.getElementById('examDate').value='';renderExams();renderCommandCoachCard();
}
function deleteExam(id){const e=exams.find(x=>x.id===id);if(!e||!confirm('Remove "'+e.name+'"?'))return;exams=exams.filter(x=>x.id!==id);persistExams();renderExams();renderCommandCoachCard();}
function renderExams(){
  const box=document.getElementById('examList');if(!box)return;box.textContent='';
  const list=upcomingExams();
  if(!list.length){box.appendChild(mkEl('div','empty-state','No upcoming exams. Add your dates below and the coach will plan around them.'));return;}
  list.forEach(e=>{
    const d=daysUntil(e.date);const card=mkEl('div','exam-item'+(d<=7?' soon':''));
    const left=mkEl('div','exam-main');left.appendChild(mkEl('div','item-title',e.name));
    left.appendChild(mkEl('div','item-meta',e.subject+' · '+fmtDate(new Date(e.date+'T12:00:00'),{weekday:'short',day:'numeric',month:'short'})));
    const pace=examPace(e);if(pace)left.appendChild(mkEl('div','item-meta',pace));
    const right=mkEl('div','exam-days');right.appendChild(mkEl('div','exam-days-n',d===0?'Today':d===1?'1':String(d)));if(d>1)right.appendChild(mkEl('div','exam-days-l','days'));
    if(d===1)right.appendChild(mkEl('div','exam-days-l','day'));
    const del=mkEl('button','small-action','Remove');del.type='button';del.addEventListener('click',()=>deleteExam(e.id));
    card.append(left,right,del);box.appendChild(card);
  });
}

/* ---------- Interval (boxing round) timer ---------- */
const IV_DEFAULT={rounds:8,roundSec:180,restSec:60,prepSec:10,warn:true,combos:false,comboPace:3.5};
function normalizeTimerCfg(v){
  const d={...IV_DEFAULT};if(!v||typeof v!=='object'||Array.isArray(v))return d;
  const c=(x,lo,hi,def)=>{const n=Math.round(Number(x));return Number.isFinite(n)?Math.max(lo,Math.min(hi,n)):def;};
  return {rounds:c(v.rounds,1,30,d.rounds),roundSec:c(v.roundSec,10,1200,d.roundSec),restSec:c(v.restSec,0,600,d.restSec),prepSec:c(v.prepSec,0,60,d.prepSec),warn:v.warn!==false,combos:v.combos===true,comboPace:[2.5,3.5,5].includes(Number(v.comboPace))?Number(v.comboPace):3.5};
}
let ivCfg=normalizeTimerCfg(safeReadJSON(TIMERCFG_KEY,null)),iv=null,ivInterval=null;
function ivBuildPhases(c){
  const ph=[];if(c.prepSec>0)ph.push({type:'prep',label:'GET READY',sec:c.prepSec});
  for(let r=1;r<=c.rounds;r++){ph.push({type:'round',label:'ROUND '+r+' of '+c.rounds,sec:c.roundSec,round:r});if(r<c.rounds&&c.restSec>0)ph.push({type:'rest',label:'REST',sec:c.restSec,round:r});}
  return ph;
}
function ivTotalSeconds(c){return ivBuildPhases(c).reduce((a,p)=>a+p.sec,0);}
function ivBeep(freq,ms,delay,vol){
  try{timerPrimeAudio();const ctx=timerAudioCtx;if(!ctx)return;const t0=ctx.currentTime+(delay||0)/1000,v=vol||0.28;
    const o=ctx.createOscillator(),g=ctx.createGain();o.type='sine';o.frequency.value=freq;
    g.gain.setValueAtTime(0.0001,t0);g.gain.exponentialRampToValueAtTime(v,t0+0.02);g.gain.exponentialRampToValueAtTime(0.0001,t0+ms/1000);
    o.connect(g);g.connect(ctx.destination);o.start(t0);o.stop(t0+ms/1000+0.05);}catch(e){}
}
function ivVibrate(p){try{if(navigator.vibrate)navigator.vibrate(p);}catch(e){}}
function ivFillSelect(id,values,fmt,current){
  const s=document.getElementById(id);if(!s)return;const vals=[...new Set([...values,current])].sort((a,b)=>a-b);
  s.textContent='';vals.forEach(v=>{const o=document.createElement('option');o.value=String(v);o.textContent=fmt(v);s.appendChild(o);});s.value=String(current);
}
const ivFmt=v=>v===0?'None':v<60?v+' s':Math.floor(v/60)+':'+String(v%60).padStart(2,'0');
function ivRenderInputs(){
  document.getElementById('ivRounds').value=String(ivCfg.rounds);
  ivFillSelect('ivRoundSec',[30,60,90,120,180,240,300],ivFmt,ivCfg.roundSec);
  ivFillSelect('ivRestSec',[0,15,30,45,60,90],ivFmt,ivCfg.restSec);
  ivFillSelect('ivPrepSec',[0,5,10,15,30],ivFmt,ivCfg.prepSec);
  document.getElementById('ivWarn').checked=!!ivCfg.warn;
  const ic=document.getElementById('ivCombos');if(ic)ic.checked=!!ivCfg.combos;const ip=document.getElementById('ivComboPace');if(ip)ip.value=String(ivCfg.comboPace);
}
function ivReadInputs(){
  ivCfg=normalizeTimerCfg({rounds:document.getElementById('ivRounds').value,roundSec:document.getElementById('ivRoundSec').value,restSec:document.getElementById('ivRestSec').value,prepSec:document.getElementById('ivPrepSec').value,warn:document.getElementById('ivWarn').checked,combos:!!(document.getElementById('ivCombos')||{}).checked,comboPace:(document.getElementById('ivComboPace')||{}).value});
  lsSet(TIMERCFG_KEY,JSON.stringify(ivCfg));
}
function ivPreset(r,w,rest){ivCfg=normalizeTimerCfg({...ivCfg,rounds:r,roundSec:w,restSec:rest});lsSet(TIMERCFG_KEY,JSON.stringify(ivCfg));ivRenderInputs();ivRenderIdle();}
function ivInputsChanged(){if(iv)return;ivReadInputs();ivRenderIdle();}
function ivSetUi(running,paused){
  const start=document.getElementById('ivStartBtn'),pause=document.getElementById('ivPauseBtn');
  if(start)start.disabled=!!running;if(pause){pause.disabled=!running;pause.textContent=paused?'Resume':'Pause';}
  ['ivRounds','ivRoundSec','ivRestSec','ivPrepSec','ivWarn','ivCombos','ivComboPace'].forEach(id=>{const n=document.getElementById(id);if(n)n.disabled=!!running;});
}
function ivPaint(kind,phase,clock,meta,pct){
  const card=document.getElementById('ivCard');if(!card)return;
  card.className='card iv-card'+(kind?' iv-'+kind:'');
  document.getElementById('ivPhase').textContent=phase;document.getElementById('ivClock').textContent=clock;
  document.getElementById('ivMeta').textContent=meta;document.getElementById('ivBar').style.width=Math.max(0,Math.min(100,pct))+'%';
}
function ivRenderIdle(){
  const c=ivCfg,total=ivTotalSeconds(c);
  ivPaint('', 'READY',fmtClock(c.roundSec),c.rounds+' × '+ivFmt(c.roundSec)+(c.restSec?' · '+ivFmt(c.restSec)+' rest':'')+' · total '+fmtClock(total),0);
  ivSetUi(false,false);
}
function ivStart(){
  ivReadInputs();resetTimer();if(ivInterval){clearInterval(ivInterval);ivInterval=null;}
  timerPrimeAudio();
  if(typeof musicSuggest==='function') musicSuggest('training');
  const phases=ivBuildPhases(ivCfg);let acc=0;const starts=phases.map(p=>{const s=acc;acc+=p.sec;return s;});
  iv={phases,starts,total:acc,startAt:Date.now(),pausedAt:null,lastIdx:-1,warned:{},lastLeft:-1,done:false};
  ivInterval=setInterval(ivTick,250);ivSetUi(true,false);timerRequestWakeLock();ivTick();
}
function ivTick(){
  if(!iv||iv.pausedAt)return;
  const elapsed=(Date.now()-iv.startAt)/1000;
  if(elapsed>=iv.total){ivFinish();return;}
  let idx=iv.phases.length-1;for(let i=0;i<iv.phases.length;i++){if(elapsed<iv.starts[i]+iv.phases[i].sec){idx=i;break;}}
  const ph=iv.phases[idx],left=Math.ceil(iv.starts[idx]+ph.sec-elapsed);
  if(idx!==iv.lastIdx){
    iv.lastIdx=idx;iv.lastLeft=-1;comboClear();
    if(ph.type==='round'){ivBeep(1046,900,0,0.38);ivVibrate([300]);}
    else if(ph.type==='rest'){ivBeep(523,220,0);ivBeep(523,220,330);ivVibrate([150,100,150]);}
    else{ivBeep(660,160,0);}
  }
  if(left!==iv.lastLeft){
    if(ph.type!=='round'&&left<=3&&left>=1)ivBeep(740,110,0);
    if(ph.type==='round'&&ivCfg.warn&&ph.sec>20&&left<=10&&left>=1&&!iv.warned[idx]){iv.warned[idx]=true;ivBeep(1568,140,0,0.32);ivVibrate([120]);}
    iv.lastLeft=left;
  }
  const kind=ph.type;const remainTotal=iv.total-elapsed;
  ivPaint(kind,ph.label,fmtClock(left),(ph.type==='round'?'Round '+ph.round+' of '+ivCfg.rounds:ph.type==='rest'?'Next: round '+(ph.round+1):'Starting soon')+' · total left '+fmtClock(remainTotal),elapsed/iv.total*100);
  comboTick(ph,idx,left);
}
function ivFinish(){
  comboClear();
  if(ivInterval){clearInterval(ivInterval);ivInterval=null;}if(iv)iv.done=true;timerReleaseWakeLock();
  ivBeep(1046,700,0,0.38);ivBeep(1046,700,600,0.38);ivBeep(1046,900,1200,0.38);ivVibrate([300,150,300,150,600]);
  ivPaint('done','DONE','00:00',ivCfg.rounds+' rounds complete · '+fmtClock(iv?iv.total:0),100);ivSetUi(false,false);iv=null;
}
function ivPause(){
  if(!iv||iv.done)return;
  if(!iv.pausedAt){comboClear();iv.pausedAt=Date.now();if(ivInterval){clearInterval(ivInterval);ivInterval=null;}timerReleaseWakeLock();ivSetUi(true,true);document.getElementById('ivPhase').textContent='PAUSED';}
  else{const pd=Date.now()-iv.pausedAt;iv.startAt+=pd;if(iv.nextCombo)iv.nextCombo+=pd;iv.pausedAt=null;ivInterval=setInterval(ivTick,250);timerRequestWakeLock();ivSetUi(true,false);ivTick();}
}
function ivStop(){
  comboClear();
  if(ivInterval){clearInterval(ivInterval);ivInterval=null;}iv=null;timerReleaseWakeLock();ivRenderIdle();
}

/* ---------- Daily Coach (rules-based, offline) ---------- */
const DAY_NAMES=['Sunday','Monday','Tuesday','Wednesday','Thursday','Friday','Saturday'];
const PRIORITY_RANK={high:0,medium:1,low:2};
function prioritySort(a,b){return (PRIORITY_RANK[a.priority]??1)-(PRIORITY_RANK[b.priority]??1)||String(a.due||'9').localeCompare(String(b.due||'9'));}
function backupIsDue(){
  const last=lsGet(LAST_BACKUP_KEY),snooze=lsGet(BACKUP_SNOOZE_KEY);
  return hasBackupWorthyData()&&(last?daysSince(last):Infinity)>=BACKUP_STALE_DAYS&&!(snooze&&Date.parse(snooze)>Date.now());
}
function addDaysISO(iso,n){const d=new Date(iso+'T12:00:00');d.setDate(d.getDate()+n);return localISODate(d);}
function coachContext(offset){
  offset=offset||0;const date=new Date();date.setHours(12,0,0,0);date.setDate(date.getDate()+offset);const iso=localISODate(date);
  const open=tasks.filter(taskIsOpen),sched=SCHEDULE.find(d=>d.day===DAY_NAMES[date.getDay()])||null;
  return {offset,date,iso,sched,
    overdue:open.filter(t=>t.due&&t.due<iso).sort(prioritySort),
    dueToday:open.filter(t=>t.due===iso).sort(prioritySort),
    dueSoon:open.filter(t=>t.due&&t.due>iso&&t.due<=addDaysISO(iso,2)).sort(prioritySort),
    inProgress:open.filter(t=>t.status==='progress'&&!(t.due&&t.due<=iso)).sort(prioritySort),
    habitsLeft:offset?[]:habits.filter(h=>!(h.checks&&h.checks[iso]===true)),
    exam:upcomingExams(iso)[0]||null,weak:weakTopics(3)};
}
function subjectOfBlock(title){const m=/^(Chemistry|Biology|Maths)/.exec(title||'');return m?m[1]:null;}
function openNotesAt(subject,index){notesSubject=subject;lsSet('bp_notesSubject',subject);notesExpanded[subject+'-'+index]=true;saveNotesExpanded();showView('notes');renderNotes();const c=document.getElementById('note-'+subject+'-'+index);if(c)c.scrollIntoView({block:'start'});}
function startQuizOn(subject,key){testSubjectFilter=subject||'All';testTopicFocus=key||null;if(!key)qStats.mode='smart';showView('test');document.querySelectorAll('#testSubjectTabs button').forEach(b=>b.classList.toggle('active-subject',b.dataset.subject===testSubjectFilter));newQuestion();}
function coachPlan(ctx,opts){
  opts=opts||{};const ci=ctx.offset?null:checkinFor(ctx.iso),autoTired=!opts.tired&&readiness(ci)==='low';const items=[],tired=!!opts.tired||autoTired,tomorrow=ctx.offset>0,when=tomorrow?'tomorrow':'today';
  const add=(o)=>items.push(o);
  const taskItem=(t,score,why)=>({id:'task-'+t.id,score,minutes:Math.max(5,Number(t.duration)||25),title:t.title,detail:why,action:{label:'Open task',run:()=>editTask(t.id)}});
  ctx.overdue.slice(0,3).forEach((t,i)=>add(taskItem(t,(t.priority==='high'?95:85)-i,'Overdue since '+niceDate(t.due)+(t.priority==='high'?' · high priority':''))));
  ctx.dueToday.slice(0,4).forEach((t,i)=>add(taskItem(t,(t.priority==='high'?90:80)-i,'Due '+(tomorrow?'tomorrow':'today')+(t.priority==='high'?' · high priority':''))));
  // Exam pressure
  const ex=ctx.exam,exDays=ex?daysUntil(ex.date,ctx.iso):null;
  const nextTopic=ex&&NOTES[ex.subject]?nextUnrevisedTopic(ex.subject):null;
  const weakHere=ex&&ex.subject!=='Other'?ctx.weak.filter(w=>w.subject===ex.subject):[];
  // Today's study block
  const study=ctx.sched&&ctx.sched.study,studySubject=subjectOfBlock(study&&study.title);
  const studyMatchesExam=ex&&studySubject===ex.subject;
  if(study&&!tired){
    const t=nextUnrevisedTopic(studySubject);
    add({id:'study',score:(exDays!==null&&exDays<=14&&studyMatchesExam)?88:62,minutes:60,title:'Study block: '+study.title,
      detail:study.items.join(' · ')+(t?'. Suggested start: '+t.topic.title+' (not yet revised).':''),
      action:t?{label:'Open that topic',run:()=>openNotesAt(studySubject,t.index)}:{label:'Open notes',run:()=>{if(studySubject){notesSubject=studySubject;lsSet('bp_notesSubject',studySubject);}showView('notes');renderNotes();}}});
  }
  // Training block
  const train=ctx.sched&&ctx.sched.train;
  if(train){
    if(tired){add({id:'train-light',score:58,minutes:25,title:'Keep training light',detail:(autoTired?'Your check-in says recovery is low':'You said you are low on energy')+', so swap "'+train.title+'" for a light walk or mobility work. If it is pain or illness rather than tiredness, rest fully.',action:{label:'See recovery ideas',run:()=>showView('schedule')}});}
    else add({id:'train',score:/rest|recovery/i.test(train.title)?40:66,minutes:/rest|recovery/i.test(train.title)?30:60,title:'Training: '+train.title,detail:train.items.slice(0,4).join(' · '),action:{label:'Open training',run:()=>showView('training')}});
  }
  // Retrieval practice on weak topics (also the low-energy study swap)
  if(ctx.weak.length||tired){
    const w=ctx.weak[0];
    add({id:'quiz',score:tired?75:(weakHere.length?84:56),minutes:15,title:w?'Quiz your weakest topic: '+w.topic:'15-minute quiz',
      detail:w?w.subject+' · you are averaging '+w.pct+'% there'+(tired?'. Short recall is a good low-energy option.':'.'):'Short recall practice is a low-effort way to keep momentum.',
      action:{label:'Start quiz',run:()=>startQuizOn(w?w.subject:'All',w?w.key:null)}});
  }
  if(ex&&exDays<=21&&nextTopic&&!study){add({id:'exam-topic',score:70,minutes:45,title:'Revise '+nextTopic.topic.title,detail:ex.name+' is in '+daysLabel(exDays).toLowerCase()+'.',action:{label:'Open topic',run:()=>openNotesAt(ex.subject,nextTopic.index)}});}
  if(!tomorrow&&!opts.tasksOnly){const fd=cardsDue('All').length;if(fd)add({id:'cards',score:tired?72:57,minutes:Math.max(5,Math.min(30,Math.ceil(fd*0.5))),title:'Flashcards: '+fd+' due',detail:'Spaced-repetition reviews built from your notes.',action:{label:'Review now',run:()=>showView('cards')}});
    if(!ci)add({id:'checkin',score:36,minutes:1,title:'Do your morning check-in',detail:'Sleep, energy and soreness. It lets me adjust training for you.',action:{label:'Check in',run:()=>{showView('command');const c=document.getElementById('commandCheckin');if(c)c.scrollIntoView({block:'center'});}}});}
  if(!tomorrow&&!opts.tasksOnly){
    const tr=ctx.sched&&ctx.sched.train;if(tr&&!workoutLog.some(w=>w.date===ctx.iso)&&new Date().getHours()>=15)add({id:'quicklog',score:33,minutes:2,title:'Log today\'s training',detail:'One tap from your week plan, so Progress stays accurate.',action:{label:'Log it',run:()=>showView('training')}});
    const sm=studyMinutes(addDaysISO(ctx.iso,-6),ctx.iso),core=['Chemistry','Biology','Maths'],tot=core.reduce((a,k)=>a+sm[k],0);if(tot>=90){const lo=core.reduce((a,k)=>sm[k]<sm[a]?k:a),hi=core.reduce((a,k)=>sm[k]>sm[a]?k:a);if(sm[lo]<0.4*sm[hi])add({id:'balance',score:58,minutes:30,title:'Give '+lo+' some time',detail:lo+' has '+fmtMins(sm[lo])+' this week vs '+fmtMins(sm[hi])+' of '+hi+'.',action:{label:'Start a session',run:()=>{showView('timer');setFocusSubject(lo);}}});}
    const mc=Object.keys(mistakes).length;if(mc>=3)add({id:'mistakes',score:tired?70:55,minutes:Math.min(20,5+mc),title:'Fix '+mc+' mistakes',detail:'Things you got wrong recently. Each clears after two correct goes.',action:{label:'Open mistakes',run:()=>showView('mistakes')}});
    const red=topRedSpec(ctx.exam&&ctx.exam.subject);if(red)add({id:'spec',score:(ctx.exam&&red.subject===ctx.exam.subject&&daysUntil(ctx.exam.date,ctx.iso)<=21)?82:52,minutes:30,title:red.count+' red '+red.subject+' spec point'+(red.count===1?'':'s'),detail:'Start with '+red.p.code+': '+red.p.point,action:{label:'Open checklist',run:()=>{specSubject=red.subject;specFilter='r';showView('spec');}}});
  }
  ctx.inProgress.slice(0,2).forEach(t=>add(taskItem(t,50,'Already in progress — finish it off')));
  ctx.dueSoon.slice(0,2).forEach(t=>add(taskItem(t,45,'Due '+niceDate(t.due))));
  if(ctx.habitsLeft.length)add({id:'habits',score:40,minutes:Math.min(15,ctx.habitsLeft.length*3),title:'Daily habits: '+ctx.habitsLeft.length+' still to check',detail:ctx.habitsLeft.slice(0,4).map(h=>h.title).join(' · '),action:{label:'Open habits',run:()=>showView('habits')}});
  if(!tomorrow&&!opts.tasksOnly&&backupIsDue())add({id:'backup',score:20,minutes:2,title:'Back up your data',detail:'It takes seconds and protects all your tasks, notes and progress.',action:{label:'Back up now',run:()=>exportBackup()}});
  items.sort((a,b)=>b.score-a.score);
  const budget=opts.minutes;
  if(budget){let used=0;const chosen=[];
    items.forEach(it=>{
      if(used+it.minutes<=budget){chosen.push(it);used+=it.minutes;}
      // The most urgent item is too long for this slot: still start it, timeboxed, rather than burying it under easy wins.
      else if(!chosen.length&&it.score>=80&&budget>=10){const m=budget;chosen.push({...it,minutes:m,detail:'Needs about '+it.minutes+' min in total, so start it now and timebox this slot. '+(it.detail||'')});used+=m;}
    });
    if(!chosen.length&&items.length){chosen.push(items[0]);used=items[0].minutes;}
    return {items:chosen,minutes:used,budget,when};}
  const top=items.slice(0,6);return {items:top,minutes:top.reduce((a,b)=>a+b.minutes,0),budget:null,when};
}
function coachGreeting(){const h=new Date().getHours();return h>=22||h<5?'It is late':h<12?'Good morning':h<18?'Good afternoon':'Good evening';}
function coachExamLine(ctx){const e=ctx.exam;if(!e)return '';const d=daysUntil(e.date,ctx.iso);return e.name+' is '+(d===0?'today':d===1?'tomorrow':'in '+d+' days')+'. '+examPace(e,ctx.iso);}
function coachReplyPlan(opts){
  opts=opts||{};const ctx=coachContext(opts.offset||0),plan=coachPlan(ctx,opts),lines=[];
  const dayName=DAY_NAMES[ctx.date.getDay()];
  if(opts.lead)lines.push(opts.lead);
  const ciNow=!opts.offset?checkinFor(localISODate()):null;if(!opts.tired&&ciNow&&readiness(ciNow)==='low')lines.push('Your check-in (slept '+fmtNum(ciNow.sleep)+' h, energy '+ciNow.energy+'/5, soreness '+ciNow.soreness+'/5) says recovery is low, so I have kept training light.');
  if(!plan.items.length)lines.push('Nothing urgent for '+plan.when+'. A clear day — use it for the weakest topic or an early start on something due soon.');
  else lines.push((opts.minutes?'Best use of '+opts.minutes+' minutes':(ctx.offset?'Tomorrow ('+dayName+')':dayName))+': '+plan.items.length+' thing'+(plan.items.length===1?'':'s')+', about '+plan.minutes+' min in total.');
  const ex=coachExamLine(ctx);if(ex&&!opts.minutes)lines.push(ex);
  if(camp&&!opts.minutes){const cd=daysUntil(camp.fightDate,ctx.iso),cp=campPhase(cd);if(cp)lines.push('Fight camp: '+(cd===0?'fight day':cd+' days to '+camp.name)+' ('+cp.label+' phase).');}
  if(opts.tail)lines.push(opts.tail);
  return {lines,items:plan.items};
}
function coachParse(raw){
  const s=String(raw||'').toLowerCase().trim();
  const mm=s.match(/(\d{1,3})\s*(?:min|mins|minutes|m)\b/),hh=s.match(/(\d(?:\.\d)?)\s*(?:hour|hours|hr|hrs|h)\b/);
  const minutes=mm?Math.min(600,+mm[1]):hh?Math.round(+hh[1]*60):null;
  return {s,minutes,tired:/tired|exhaust|knackered|low energy|drained|sleepy|shattered|no energy|burnt? ?out|can'?t be bothered|unmotivated/.test(s),tomorrow:/tomorrow/.test(s)};
}
function coachAnswer(raw){
  const p=coachParse(raw),s=p.s;
  if(!s)return {lines:['Type a question or tap one of the buttons above.'],items:[]};
  if(/\b(help|what can you|how do you work|who are you)\b/.test(s))return {lines:['I build your day from what is in this app: tasks and deadlines, your weekly schedule, habits, quiz results, notes you have revised, and exam dates.','Try: "plan my day", "I have 30 minutes", "I\'m tired", "what\'s urgent", "what should I revise", "how is my week going" or "plan tomorrow".','I am a rules-based coach running on your phone. I am not an AI model and nothing leaves this device.'],items:[]};
  if(/^(hi|hello|hey|yo|morning|evening)\b/.test(s)&&s.length<20)return coachReplyPlan({lead:coachGreeting()+'. Here is what I would do:'});
  if(/\b(thanks|thank you|cheers)\b/.test(s))return {lines:['Anytime. Go and get it done.'],items:[]};
  if(/(how am i|how is my week|how\'s my week|progress|this week|stats|doing so far)/.test(s))return coachWeek();
  if(p.tired)return coachReplyPlan({tired:true,minutes:p.minutes,offset:p.tomorrow?1:0,lead:'Tired days still count — the aim is to keep momentum without burning out.',tail:'Rest and sleep are part of training. If this is more than a bad day, take it easy and talk to someone you trust.'});
  if(p.minutes)return coachReplyPlan({minutes:p.minutes,offset:p.tomorrow?1:0});
  if(/\b(urgent|overdue|deadline|first|priorit|important|late)\b/.test(s)){
    const ctx=coachContext(0),list=[...ctx.overdue,...ctx.dueToday].slice(0,5);
    if(!list.length)return {lines:['Nothing overdue and nothing due today. You are ahead.'+(ctx.dueSoon.length?' Next up: '+ctx.dueSoon[0].title+' ('+niceDate(ctx.dueSoon[0].due)+').':'')],items:[]};
    return {lines:[ctx.overdue.length+' overdue, '+ctx.dueToday.length+' due today. Start here:'],items:coachPlan({...ctx,habitsLeft:[],exam:null,weak:[],inProgress:[],dueSoon:[],sched:null},{tasksOnly:true}).items};
  }
  if(/\b(exam|countdown|days left)\b/.test(s)&&!/revise|study/.test(s)){
    const list=upcomingExams();if(!list.length)return {lines:['No exam dates saved yet. Add them in the Exams panel below and I will plan around them.'],items:[]};
    return {lines:list.slice(0,4).map(e=>e.name+': '+daysLabel(daysUntil(e.date)).toLowerCase()+(NOTES[e.subject]?' · '+examPace(e):'')),items:[]};
  }
  if(/\b(revise|revision|study|learn|weak|quiz|test|practice|practise|topic|recall)\b/.test(s)){
    const ctx=coachContext(0),weak=ctx.weak,items=[],lines=[];
    const ex=ctx.exam&&NOTES[ctx.exam.subject]?ctx.exam:null;
    if(weak.length){lines.push('Your weakest topics right now:');weak.forEach(w=>items.push({id:'w-'+w.key,score:0,minutes:15,title:w.topic,detail:w.subject+' · averaging '+w.pct+'% over '+w.n+' attempt'+(w.n===1?'':'s'),action:{label:'Drill this',run:()=>startQuizOn(w.subject,w.key)}}));}
    else lines.push('No quiz history yet, so I cannot tell what is weak. Do a few questions first — smart mode will start steering you.');
    const subj=ex?ex.subject:subjectOfBlock(ctx.sched&&ctx.sched.study&&ctx.sched.study.title),nt=subj?nextUnrevisedTopic(subj):null;
    if(nt){items.push({id:'next-topic',score:0,minutes:40,title:'Next unrevised '+subj+' topic: '+nt.topic.title,detail:ex?ex.name+' is in '+daysLabel(daysUntil(ex.date)).toLowerCase()+'.':'From today\'s study block.',action:{label:'Open topic',run:()=>openNotesAt(subj,nt.index)}});}
    items.push({id:'quiz-any',score:0,minutes:15,title:'Quick mixed quiz',detail:'Smart mode picks weaker and older topics more often.',action:{label:'Start quiz',run:()=>startQuizOn('All',null)}});
    const fdue=cardsDue('All').length;if(fdue)items.push({id:'cards-due',score:0,minutes:Math.max(5,Math.min(30,Math.ceil(fdue*0.5))),title:fdue+' flashcards due',detail:'Quick spaced-repetition reviews from your notes.',action:{label:'Review now',run:()=>showView('cards')}});
    return {lines,items};
  }
  if(/\b(train|workout|gym|boxing|lift|session|exercise|spar)\b/.test(s)){
    const ctx=coachContext(p.tomorrow?1:0),t=ctx.sched&&ctx.sched.train;if(!t)return {lines:['No training block found for that day.'],items:[]};
    const rest=/rest|recovery/i.test(t.title);
    return {lines:[(p.tomorrow?'Tomorrow':'Today')+' ('+ctx.sched.day+'): '+t.title+'.',rest?'It is a recovery day — keep it easy.':'Warm up properly and keep the tendon-safety checklist in mind.'],items:[{id:'t',score:0,minutes:rest?30:60,title:t.title,detail:t.items.join(' · '),action:{label:'Open training',run:()=>showView('training')}}]};
  }
  if(/\b(habit|habits|routine)\b/.test(s)){
    const ctx=coachContext(0);
    if(!habits.length)return {lines:['You have no habits yet. Add one in Habits and I will remind you what is left each day.'],items:[]};
    return {lines:[ctx.habitsLeft.length?ctx.habitsLeft.length+' of '+habits.length+' habits still to check today:':'All '+habits.length+' habits checked today. Nice.'],items:ctx.habitsLeft.length?[{id:'h',score:0,minutes:ctx.habitsLeft.length*3,title:ctx.habitsLeft.map(h=>h.title).slice(0,5).join(' · '),detail:'',action:{label:'Open habits',run:()=>showView('habits')}}]:[]};
  }
  if(/\b(plan|day|today|schedule|recommend|suggest|what should i|what do i|what now|do next|next|tomorrow)\b/.test(s)||s.length>0)return coachReplyPlan({offset:p.tomorrow?1:0,lead:/\b(plan|day|today|schedule|recommend|suggest|what should i|what do i|what now|do next|next|tomorrow)\b/.test(s)?'':'I did not catch a specific question, so here is the general plan:'});
}
function coachWeek(){
  const today=localISODate(),weekAgo=addDaysISO(today,-6);
  const doneTasks=tasks.filter(t=>t.status==='done'&&isThisWeek(isoToLocalDate(t.updated))).length;
  const sessions=workoutLog.filter(w=>w.date>=weekAgo&&w.date<=today).length;
  let ticks=0,possible=habits.length*7;habits.forEach(h=>{for(let i=0;i<7;i++){if(h.checks&&h.checks[addDaysISO(today,-i)]===true)ticks++;}});
  const practised=Object.values(qStats.topics).filter(t=>Date.now()-Date.parse(t.last)<7*86400000).length;
  const lines=['Last 7 days: '+doneTasks+' task'+(doneTasks===1?'':'s')+' completed, '+sessions+' logged workout'+(sessions===1?'':'s')+', '+(possible?Math.round(ticks/possible*100)+'% of habit check-ins ('+ticks+'/'+possible+')':'no habits tracked')+', '+practised+' quiz topic'+(practised===1?'':'s')+' practised.'];
  const ciWeek=Object.keys(checkins).filter(k=>k>=weekAgo&&k<=today).map(k=>checkins[k]);if(ciWeek.length)lines.push('Average sleep '+fmtNum(ciWeek.reduce((a,c)=>a+c.sleep,0)/ciWeek.length)+' h over '+ciWeek.length+' check-in'+(ciWeek.length===1?'':'s')+'.');
  const pw=papers.filter(p=>p.date>=weekAgo&&p.date<=today);if(pw.length)lines.push(pw.length+' past paper'+(pw.length===1?'':'s')+' this week, averaging '+Math.round(pw.reduce((a,p)=>a+paperPct(p),0)/pw.length)+'%.');
  {const sm=studyMinutes(weekAgo,today),tot=Object.values(sm).reduce((a,b)=>a+b,0);if(tot)lines.push('Study time: '+fmtMins(tot)+' (Chem '+fmtMins(sm.Chemistry)+', Bio '+fmtMins(sm.Biology)+', Maths '+fmtMins(sm.Maths)+').');}
  const w=weakTopics(1)[0];if(w)lines.push('Weakest area: '+w.topic+' ('+w.pct+'%).');
  const ov=tasks.filter(t=>taskIsOpen(t)&&taskIsOverdue(t)).length;if(ov)lines.push(ov+' task'+(ov===1?' is':'s are')+' overdue — clearing those is the quickest win.');
  return {lines,items:[]};
}
let coachBusy=false;
function coachAppend(who,reply){
  const log=document.getElementById('coachLog');if(!log)return;
  const msg=mkEl('div','coach-msg '+who);
  if(who==='me'){msg.appendChild(mkEl('p','',reply.lines[0]));}
  else{
    reply.lines.filter(Boolean).forEach(l=>msg.appendChild(mkEl('p','',l)));
    (reply.items||[]).forEach(it=>{
      const c=mkEl('div','coach-item');const top=mkEl('div','coach-item-top');top.appendChild(mkEl('strong','',it.title));if(it.minutes)top.appendChild(mkEl('span','coach-min','~'+it.minutes+' min'));c.appendChild(top);
      if(it.detail)c.appendChild(mkEl('div','coach-detail',it.detail));
      if(it.action){const b=mkEl('button','small-action coach-act',it.action.label);b.type='button';b.addEventListener('click',()=>{try{it.action.run();}catch(e){console.warn(e);}});c.appendChild(b);}
      msg.appendChild(c);
    });
  }
  log.appendChild(msg);while(log.children.length>24)log.removeChild(log.firstChild);
  msg.scrollIntoView({block:'nearest'});
}
function coachAsk(text){
  const q=String(text||'').trim().slice(0,200);if(!q)return;
  coachAppend('me',{lines:[q]});
  let reply;try{reply=coachAnswer(q)||{lines:['Try "plan my day".'],items:[]};}catch(e){console.warn(e);reply={lines:['Something went wrong building that answer. Try "plan my day".'],items:[]};}
  coachAppend('bot',reply);
}
function coachSubmit(ev){ev.preventDefault();const i=document.getElementById('coachInput');const v=i.value;i.value='';coachAsk(v);return false;}
function renderCoachView(){
  const chips=document.getElementById('coachChips');
  if(chips&&!chips.children.length){
    [['Plan my day','plan my day'],['I have 30 min','I have 30 minutes'],['I\'m tired','I\'m tired'],['What\'s urgent?','what is urgent'],['What to revise?','what should I revise'],['Plan tomorrow','plan tomorrow'],['My week','how is my week going']].forEach(([label,q])=>{const b=mkEl('button','coach-chip',label);b.type='button';b.addEventListener('click',()=>coachAsk(q));chips.appendChild(b);});
  }
  const log=document.getElementById('coachLog');
  if(log&&!log.children.length){
    const late=new Date().getHours()>=22||new Date().getHours()<5;
    coachAppend('bot',coachReplyPlan({offset:late?1:0,lead:coachGreeting()+'.'+(late?' Sleep beats cramming, so here is a plan for tomorrow instead:':' Here is what I would do today:')}));
  }
  renderExams();
  const d=document.getElementById('examDate');if(d&&!d.min)d.min=localISODate();
}
function renderCommandCoachCard(){
  const box=document.getElementById('commandCoachCard');if(!box)return;box.textContent='';
  const ctx=coachContext(0),plan=coachPlan(ctx,{}),card=mkEl('div','coach-card');
  const head=mkEl('div','coach-card-head');head.appendChild(mkEl('span','metric-label','TODAY\'S TOP 3'));
  const go=mkEl('button','small-action','Ask the coach →');go.type='button';go.addEventListener('click',()=>showView('coach'));head.appendChild(go);card.appendChild(head);
  if(ctx.exam){const d=daysUntil(ctx.exam.date,ctx.iso);card.appendChild(mkEl('div','coach-exam'+(d<=7?' soon':''),'⏳ '+ctx.exam.name+' · '+(d===0?'today':d===1?'tomorrow':d+' days')));}
  const top=plan.items.slice(0,3);
  if(!top.length)card.appendChild(mkEl('div','coach-detail','Nothing urgent. A good day to work on your weakest topic.'));
  top.forEach((it,i)=>{const r=mkEl('div','coach-row');r.appendChild(mkEl('span','coach-num',String(i+1)));const t=mkEl('div','coach-row-text');t.appendChild(mkEl('div','coach-row-title',it.title));if(it.detail)t.appendChild(mkEl('div','coach-detail',it.detail.length>110?it.detail.slice(0,107)+'…':it.detail));r.appendChild(t);card.appendChild(r);});
  box.appendChild(card);
}
/* ===================== end v31 block ===================== */

/* ===================== v32 features ===================== */
const SCHEDULE_KEY='bp_schedule_v1',CHECKIN_KEY='bp_checkins_v1',CARDS_KEY='bp_flashcards_v1',PAPERS_KEY='bp_papers_v1',BODY_KEY='bp_bodyweight_v1',APPEAR_KEY='bp_appearance_v1';
const ISO_RE=/^\d{4}-\d{2}-\d{2}$/;
const clampNum=(x,lo,hi,step)=>{let n=Number(x);if(!Number.isFinite(n))return null;n=Math.max(lo,Math.min(hi,n));return step?Math.round(n/step)*step:n;};
function fmtShortDate(iso){return fmtDate(new Date(iso+'T12:00:00'),{day:'numeric',month:'short'});}
function fmtNum(n,d){return Number(n).toFixed(d===undefined?1:d).replace(/\.0+$/,'');}
function downloadBlob(text,type,name){const blob=new Blob([text],{type}),url=URL.createObjectURL(blob),a=document.createElement('a');a.href=url;a.download=name;document.body.appendChild(a);a.click();a.remove();setTimeout(()=>URL.revokeObjectURL(url),1500);}
function segButtons(values,current,onPick,labelFn){const wrap=mkEl('div','seg');values.forEach(v=>{const b=mkEl('button','seg-btn'+(String(v)===String(current)?' on':''),labelFn?labelFn(v):String(v));b.type='button';b.setAttribute('aria-pressed',String(v)===String(current)?'true':'false');b.addEventListener('click',()=>onPick(v));wrap.appendChild(b);});return wrap;}

/* ---------- 1. Editable weekly schedule ---------- */
const SCHEDULE_DEFAULT=JSON.parse(JSON.stringify(SCHEDULE));
function normalizeBlock(b){if(!b||typeof b!=='object'||Array.isArray(b))return null;const title=typeof b.title==='string'?b.title.trim().slice(0,120):'';const items=Array.isArray(b.items)?b.items.filter(x=>typeof x==='string'&&x.trim()).map(x=>x.trim().slice(0,160)).slice(0,15):[];if(!title)return null;return {title,items};}
function normalizeScheduleCustom(v){const out={};if(!v||typeof v!=='object'||Array.isArray(v))return out;SCHEDULE_DEFAULT.forEach(d=>{const c=v[d.day];if(!c||typeof c!=='object'||Array.isArray(c))return;const o={};['train','study'].forEach(m=>{const b=normalizeBlock(c[m]);if(b)o[m]=b;});if(Object.keys(o).length)out[d.day]=o;});return out;}
let scheduleCustom=normalizeScheduleCustom(safeReadJSON(SCHEDULE_KEY,{}));
let scheduleEditing=null;
function applySchedule(){SCHEDULE.forEach((d,i)=>{const def=SCHEDULE_DEFAULT[i],c=scheduleCustom[d.day]||{};['train','study'].forEach(m=>{const src=c[m]||def[m];d[m]={title:src.title,items:[...src.items]};});});}
applySchedule();
function persistSchedule(){if(!lsSet(SCHEDULE_KEY,JSON.stringify(scheduleCustom)))storageFullWarn();}
function renderSchedule(){
  const list=document.getElementById('scheduleList');if(!list)return;list.textContent='';
  const today=DAY_NAMES[new Date().getDay()];
  SCHEDULE.forEach(d=>{
    const mode=dayModes[d.day]==='study'?'study':'train',block=d[mode],edited=!!(scheduleCustom[d.day]&&scheduleCustom[d.day][mode]);
    const card=mkEl('div','card'+(d.day===today?' sched-today':''));
    const head=mkEl('div','day-header');const h=mkEl('h3','',d.day);if(d.day===today)h.appendChild(mkEl('span','today-pill','TODAY'));head.appendChild(h);
    const tog=mkEl('div','mode-toggle');[['train','Train'],['study','Study']].forEach(([m,l])=>{const b=mkEl('button',mode===m?(m==='train'?'active-train':'active-study'):'',l);b.type='button';b.addEventListener('click',()=>setMode(d.day,m));tog.appendChild(b);});head.appendChild(tog);card.appendChild(head);
    if(scheduleEditing===d.day+'|'+mode){
      const f=mkEl('div','sched-form');
      const t=document.createElement('input');t.id='schedTitle';t.maxLength=120;t.value=block.title;t.setAttribute('aria-label','Block title');
      const ta=document.createElement('textarea');ta.id='schedItems';ta.rows=Math.max(4,block.items.length+1);ta.value=block.items.join('\n');ta.setAttribute('aria-label','Items, one per line');
      f.append(mkEl('label','metric-label',(mode==='train'?'TRAINING':'STUDY')+' TITLE'),t,mkEl('label','metric-label','ITEMS · ONE PER LINE'),ta);
      const acts=mkEl('div','item-actions');
      const save=mkEl('button','','Save');save.type='button';save.addEventListener('click',()=>saveScheduleBlock(d.day,mode));
      const cancel=mkEl('button','','Cancel');cancel.type='button';cancel.addEventListener('click',()=>{scheduleEditing=null;renderSchedule();});
      acts.append(save,cancel);
      if(edited){const rs=mkEl('button','','Reset to original');rs.type='button';rs.addEventListener('click',()=>resetScheduleBlock(d.day,mode));acts.appendChild(rs);}
      f.appendChild(acts);card.appendChild(f);
    }else{
      const t=mkEl('p','block-title',block.title);if(edited)t.appendChild(mkEl('span','edited-pill','edited'));card.appendChild(t);
      const ul=mkEl('ul','block-list');block.items.forEach(i=>ul.appendChild(mkEl('li','',i)));card.appendChild(ul);
      const ed=mkEl('button','small-action sched-edit','✎ Edit '+(mode==='train'?'training':'study'));ed.type='button';ed.addEventListener('click',()=>{scheduleEditing=d.day+'|'+mode;renderSchedule();});card.appendChild(ed);
    }
    list.appendChild(card);
  });
}
function saveScheduleBlock(day,mode){
  const title=document.getElementById('schedTitle').value.trim(),items=document.getElementById('schedItems').value.split('\n').map(x=>x.trim()).filter(Boolean);
  if(!title){alert('Give the block a title.');return;}
  const b=normalizeBlock({title,items});scheduleCustom[day]=scheduleCustom[day]||{};scheduleCustom[day][mode]=b;persistSchedule();applySchedule();scheduleEditing=null;renderSchedule();
}
function resetScheduleBlock(day,mode){if(!confirm('Put '+day+' '+mode+' back to the original plan?'))return;if(scheduleCustom[day]){delete scheduleCustom[day][mode];if(!Object.keys(scheduleCustom[day]).length)delete scheduleCustom[day];}persistSchedule();applySchedule();scheduleEditing=null;renderSchedule();}

/* ---------- 2. Recovery check-in ---------- */
function normalizeCheckins(v){const out={};if(!v||typeof v!=='object'||Array.isArray(v))return out;Object.keys(v).filter(k=>ISO_RE.test(k)).sort().slice(-400).forEach(k=>{const c=v[k];if(!c||typeof c!=='object')return;const sleep=clampNum(c.sleep,0,16,0.5),energy=clampNum(c.energy,1,5,1),soreness=clampNum(c.soreness,1,5,1);if(sleep===null||energy===null||soreness===null)return;out[k]={sleep,energy,soreness};});return out;}
let checkins=normalizeCheckins(safeReadJSON(CHECKIN_KEY,{}));
let checkinDraft=null,checkinEditing=false;
function checkinFor(iso){return checkins[iso]||null;}
function readiness(c){if(!c)return null;if(c.sleep<6||c.energy<=2||c.soreness>=4)return 'low';if(c.sleep<7||c.energy===3||c.soreness===3)return 'ok';return 'good';}
const READINESS_LABEL={low:'Take it easier',ok:'Steady',good:'Good to go'};
function lastCheckin(){const k=Object.keys(checkins).sort().pop();return k?checkins[k]:null;}
function saveCheckin(){const d=checkinDraft;if(!d)return;const c=normalizeCheckins({[localISODate()]:d})[localISODate()];if(!c){alert('Pick sleep, energy and soreness first.');return;}checkins[localISODate()]=c;if(!lsSet(CHECKIN_KEY,JSON.stringify(checkins)))storageFullWarn();checkinEditing=false;checkinDraft=null;renderCheckinCard();renderCommandCoachCard();}
function renderCheckinCard(){
  const box=document.getElementById('commandCheckin');if(!box)return;box.textContent='';
  const today=localISODate(),c=checkinFor(today);
  const card=mkEl('div','checkin-card');
  if(c&&!checkinEditing){
    const r=readiness(c);const row=mkEl('div','checkin-done');
    row.appendChild(mkEl('span','checkin-badge r-'+r,(r==='low'?'▼ ':r==='good'?'▲ ':'■ ')+READINESS_LABEL[r]));
    row.appendChild(mkEl('span','checkin-sum','Slept '+fmtNum(c.sleep)+' h · energy '+c.energy+'/5 · soreness '+c.soreness+'/5'));
    const e=mkEl('button','link-btn','Edit');e.type='button';e.addEventListener('click',()=>{checkinEditing=true;checkinDraft={...c};renderCheckinCard();});row.appendChild(e);
    card.appendChild(row);box.appendChild(card);return;
  }
  if(!checkinDraft){const l=lastCheckin();checkinDraft={sleep:l?l.sleep:7.5,energy:null,soreness:null};}
  const d=checkinDraft;
  card.appendChild(mkEl('div','checkin-title','Morning check-in · 10 seconds'));
  const sl=mkEl('div','checkin-row');sl.appendChild(mkEl('span','checkin-label','Sleep'));
  const minus=mkEl('button','step-btn','−');minus.type='button';minus.setAttribute('aria-label','Less sleep');
  const val=mkEl('span','checkin-val',fmtNum(d.sleep)+' h');
  const plus=mkEl('button','step-btn','+');plus.type='button';plus.setAttribute('aria-label','More sleep');
  minus.addEventListener('click',()=>{d.sleep=Math.max(0,d.sleep-0.5);val.textContent=fmtNum(d.sleep)+' h';});
  plus.addEventListener('click',()=>{d.sleep=Math.min(16,d.sleep+0.5);val.textContent=fmtNum(d.sleep)+' h';});
  sl.append(minus,val,plus);card.appendChild(sl);
  [['energy','Energy','1 = drained · 5 = great'],['soreness','Soreness','1 = fresh · 5 = very sore']].forEach(([k,label,hint])=>{
    const row=mkEl('div','checkin-row');row.appendChild(mkEl('span','checkin-label',label));
    row.appendChild(segButtons([1,2,3,4,5],d[k],v=>{d[k]=v;renderCheckinCard();}));card.appendChild(row);card.appendChild(mkEl('div','checkin-hint',hint));
  });
  const acts=mkEl('div','checkin-acts');const s=mkEl('button','btn btn-primary','Save check-in');s.type='button';s.disabled=!(d.energy&&d.soreness);s.addEventListener('click',saveCheckin);acts.appendChild(s);
  if(checkinEditing){const x=mkEl('button','','Cancel');x.type='button';x.addEventListener('click',()=>{checkinEditing=false;checkinDraft=null;renderCheckinCard();});acts.appendChild(x);}
  card.appendChild(acts);box.appendChild(card);
}

/* ---------- 3. Flashcards (spaced repetition) ---------- */
const CARD_INTERVALS=[0,1,3,7,14,30,60];const NEW_CARDS_PER_DAY=15;
let cardIndexCache=null;
function cardIndex(){
  if(cardIndexCache)return cardIndexCache;const out=[];
  Object.keys(NOTES).forEach(subject=>(NOTES[subject]||[]).forEach((t,ti)=>{const seen={};(t.sections||[]).forEach((s,si)=>{if(!s||!Array.isArray(s.points)||!s.points.length)return;let h=String(s.heading||'Key points');if(seen[h])h=h+' #'+si;seen[h]=1;out.push({key:subject+'|'+t.title+'|'+h,subject,topic:t.title,topicIndex:ti,heading:String(s.heading||'Key points'),points:s.points});});}));
  return (cardIndexCache=out);
}
function normalizeCardState(v){const out={cards:{},meta:{newDate:'',newCount:0,subject:'All'}};if(!v||typeof v!=='object'||Array.isArray(v))return out;
  if(v.cards&&typeof v.cards==='object'&&!Array.isArray(v.cards)){let n=0;for(const k of Object.keys(v.cards)){if(n>=4000)break;const c=v.cards[k];if(typeof k!=='string'||k.split('|').length<3||k.length>400||!c||typeof c!=='object')continue;const b=clampNum(c.b,0,CARD_INTERVALS.length-1,1);if(b===null||!ISO_RE.test(c.due||''))continue;out.cards[k]={b,due:c.due,n:clampNum(c.n,0,100000,1)||0,l:clampNum(c.l,0,100000,1)||0};n++;}}
  if(v.meta&&typeof v.meta==='object'){if(ISO_RE.test(v.meta.newDate||''))out.meta.newDate=v.meta.newDate;out.meta.newCount=clampNum(v.meta.newCount,0,1000,1)||0;if(['All','Chemistry','Biology','Maths'].includes(v.meta.subject))out.meta.subject=v.meta.subject;if(v.meta.reviews&&typeof v.meta.reviews==='object'&&!Array.isArray(v.meta.reviews)){out.meta.reviews={};Object.keys(v.meta.reviews).filter(k=>ISO_RE.test(k)).sort().slice(-120).forEach(k=>{const n=clampNum(v.meta.reviews[k],0,100000,1);if(n)out.meta.reviews[k]=n;});}}
  return out;}
let cardState=normalizeCardState(safeReadJSON(CARDS_KEY,null));
function saveCardState(){lsSet(CARDS_KEY,JSON.stringify(cardState));}
let cardSession=null;
function newCardsLeftToday(){const t=localISODate();return Math.max(0,NEW_CARDS_PER_DAY-(cardState.meta.newDate===t?cardState.meta.newCount:0));}
function cardsDue(subject){const t=localISODate();return cardIndex().filter(c=>(subject==='All'||!subject||c.subject===subject)&&cardState.cards[c.key]&&cardState.cards[c.key].due<=t);}
function cardsNew(subject){return cardIndex().filter(c=>(subject==='All'||!subject||c.subject===subject)&&!cardState.cards[c.key]);}
function nextIntervalLabel(c,rating){const s=cardState.cards[c.key]||{b:0};const b=rating==='again'?0:rating==='hard'?Math.max(1,s.b):rating==='good'?Math.min(6,s.b+1):Math.min(6,s.b+2);const days=rating==='hard'?Math.max(1,Math.ceil(CARD_INTERVALS[b]/2)):CARD_INTERVALS[b];return days===0?'again today':days===1?'1 day':days+' days';}
function startCardSession(){
  const subj=cardState.meta.subject;const due=cardsDue(subj).sort((a,b)=>cardState.cards[a.key].due.localeCompare(cardState.cards[b.key].due));
  const fresh=cardsNew(subj).slice(0,newCardsLeftToday());
  const queue=[...due.slice(0,60),...fresh].map(c=>c.key);
  if(!queue.length){alert('Nothing due right now. Come back tomorrow, or pick another subject.');return;}
  cardSession={queue,done:0,again:0,flipped:false,total:queue.length};renderCards();
}
function rateCard(rating){
  if(!cardSession||!cardSession.queue.length)return;const key=cardSession.queue.shift();const c=cardIndex().find(x=>x.key===key);if(!c)return renderCards();
  const t=localISODate();const isNew=!cardState.cards[key];const s=cardState.cards[key]||{b:0,due:t,n:0,l:0};
  if(isNew){if(cardState.meta.newDate!==t){cardState.meta.newDate=t;cardState.meta.newCount=0;}cardState.meta.newCount++;}
  s.n++;
  if(rating==='again'){s.b=0;s.l++;s.due=t;cardSession.queue.push(key);cardSession.again++;}
  else{s.b=rating==='hard'?Math.max(1,s.b):rating==='good'?Math.min(6,s.b+1):Math.min(6,s.b+2);const days=rating==='hard'?Math.max(1,Math.ceil(CARD_INTERVALS[s.b]/2)):CARD_INTERVALS[s.b];s.due=addDaysISO(t,days);cardSession.done++;}
  cardState.cards[key]=s;{const rvw=cardState.meta.reviews||(cardState.meta.reviews={});rvw[t]=(rvw[t]||0)+1;}if(rating==='again')mistakeMiss('c|'+key,{type:'card',subject:c.subject,topic:c.topic,label:c.heading,ref:key});else if(rating!=='hard')mistakeHit('c|'+key);saveCardState();cardSession.flipped=false;renderCards();
}
function renderCards(){
  const box=document.getElementById('cardsBody');if(!box)return;box.textContent='';
  if(cardSession&&cardSession.queue.length){
    const key=cardSession.queue[0],c=cardIndex().find(x=>x.key===key);
    if(!c){cardSession.queue.shift();return renderCards();}
    const prog=mkEl('div','card-progress','Card '+(cardSession.done+cardSession.again+1)+' · '+cardSession.queue.length+' left in this session');box.appendChild(prog);
    const fc=mkEl('div','flashcard'+(cardSession.flipped?' flipped':''));
    fc.appendChild(mkEl('div','fc-subject',c.subject+' · '+c.topic));
    fc.appendChild(mkEl('div','fc-front',c.heading));
    if(!cardSession.flipped){fc.appendChild(mkEl('div','fc-prompt','Say or jot down the key points, then flip.'));const flip=mkEl('button','btn btn-primary fc-flip','Show answer');flip.type='button';flip.addEventListener('click',()=>{cardSession.flipped=true;renderCards();});fc.appendChild(flip);}
    else{const ul=mkEl('ul','fc-points');c.points.forEach(p=>ul.appendChild(mkEl('li','',p)));fc.appendChild(ul);
      const r=mkEl('div','fc-rate');[['again','Again','r-again'],['hard','Hard','r-hard'],['good','Good','r-good'],['easy','Easy','r-easy']].forEach(([k,l,cls])=>{const b=mkEl('button','fc-btn '+cls);b.type='button';b.appendChild(mkEl('span','',l));b.appendChild(mkEl('small','',nextIntervalLabel(c,k)));b.addEventListener('click',()=>rateCard(k));r.appendChild(b);});fc.appendChild(r);}
    box.appendChild(fc);
    const end=mkEl('button','link-btn','End session');end.type='button';end.addEventListener('click',()=>{cardSession=null;renderCards();});box.appendChild(end);return;
  }
  if(cardSession){const sum=mkEl('div','insight-card');sum.appendChild(mkEl('div','checkin-title','Session complete'));sum.appendChild(mkEl('p','insight-note',cardSession.done+' cards reviewed'+(cardSession.again?', '+cardSession.again+' needed another go':'')+'. They will come back when they are due.'));box.appendChild(sum);cardSession=null;}
  const subj=cardState.meta.subject;
  const tabs=segButtons(['All','Chemistry','Biology','Maths'],subj,v=>{cardState.meta.subject=v;saveCardState();renderCards();});tabs.classList.add('seg-wide');box.appendChild(tabs);
  const due=Math.min(60,cardsDue(subj).length),fresh=Math.min(cardsNew(subj).length,newCardsLeftToday()),total=cardIndex().filter(c=>subj==='All'||c.subject===subj).length,learned=cardIndex().filter(c=>(subj==='All'||c.subject===subj)&&cardState.cards[c.key]).length;
  const stats=mkEl('div','command-grid');[['DUE NOW',due,'Reviews waiting'],['NEW TODAY',fresh,'Up to '+NEW_CARDS_PER_DAY+' a day'],['STARTED',learned,'of '+total+' cards']].forEach(([l,v,d])=>{const m=mkEl('div','metric-card');m.append(mkEl('div','metric-label',l),mkEl('div','metric-value',String(v)),mkEl('div','metric-detail',d));stats.appendChild(m);});box.appendChild(stats);
  const go=mkEl('button','btn btn-primary','Start '+(due+fresh)+' card'+(due+fresh===1?'':'s'));go.type='button';go.style.width='100%';go.disabled=!(due+fresh);go.addEventListener('click',startCardSession);box.appendChild(go);
  const missed=cardIndex().filter(c=>(subj==='All'||c.subject===subj)&&cardState.cards[c.key]&&cardState.cards[c.key].l>0).sort((a,b)=>cardState.cards[b.key].l-cardState.cards[a.key].l).slice(0,3);
  if(missed.length){box.appendChild(mkEl('div','section-kicker','Most-missed cards'));missed.forEach(c=>{const b=mkEl('button','insight-topic');b.type='button';b.append(mkEl('span','',c.topic+' · '+c.heading),mkEl('span','insight-pct','missed '+cardState.cards[c.key].l+'×'));b.addEventListener('click',()=>openNotesAt(c.subject,c.topicIndex));box.appendChild(b);});}
}

/* ---------- charts (inline SVG, single axis, hover + table) ---------- */
const SVGNS='http://www.w3.org/2000/svg';
function svgEl(tag,attrs){const n=document.createElementNS(SVGNS,tag);for(const k in attrs)n.setAttribute(k,attrs[k]);return n;}
function niceTicks(min,max,count){const span=max-min||1,step0=span/(count||4),mag=Math.pow(10,Math.floor(Math.log10(step0))),step=[1,2,2.5,5,10].map(m=>m*mag).find(s=>s>=step0)||step0;const out=[];for(let v=Math.ceil(min/step)*step;v<=max+1e-9;v+=step)out.push(+v.toFixed(6));return out;}
function chartTable(cols,rows){const d=document.createElement('details');d.className='chart-table';d.appendChild(mkEl('summary','','Show data as a table'));const t=document.createElement('table');const tr=document.createElement('tr');cols.forEach(c=>tr.appendChild(mkEl('th','',c)));t.appendChild(tr);rows.forEach(r=>{const x=document.createElement('tr');r.forEach(c=>x.appendChild(mkEl('td','',String(c))));t.appendChild(x);});d.appendChild(t);return d;}
/* series: [{name, color, kind:'line'|'dots', points:[{x:iso, y:number}]}]; one y-axis only. */
function lineChart(o){
  const W=340,H=o.height||170,m={l:40,r:o.directLabel===false?16:48,t:14,b:22};const wrap=mkEl('div','chart');
  if(o.title)wrap.appendChild(mkEl('div','chart-title',o.title));
  if(o.series.length>1){const lg=mkEl('div','chart-legend');o.series.forEach(s=>{const it=mkEl('span','lg-item');const sw=mkEl('span','lg-sw'+(s.kind==='dots'?' dot':''));sw.style.background=s.color;it.append(sw,mkEl('span','',s.name));lg.appendChild(it);});wrap.appendChild(lg);}
  const all=o.series.flatMap(s=>s.points);if(!all.length){wrap.appendChild(mkEl('div','empty-state',o.empty||'No data yet.'));return wrap;}
  const xs=all.map(p=>Date.parse(p.x+'T12:00:00'));let x0=Math.min(...xs),x1=Math.max(...xs);if(x0===x1){x0-=86400000;x1+=86400000;}
  let y0=Math.min(...all.map(p=>p.y)),y1=Math.max(...all.map(p=>p.y));if(o.ref){y0=Math.min(y0,o.ref.y);y1=Math.max(y1,o.ref.y);}if(o.yMin!==undefined)y0=Math.min(y0,o.yMin);if(o.yMax!==undefined)y1=Math.max(y1,o.yMax);
  const pad=(y1-y0||Math.abs(y1)||1)*0.12;if(o.yMin===undefined)y0-=pad;y1+=pad;
  const X=t=>m.l+(t-x0)/(x1-x0)*(W-m.l-m.r),Y=v=>H-m.b-(v-y0)/(y1-y0)*(H-m.t-m.b);
  const svg=svgEl('svg',{viewBox:'0 0 '+W+' '+H,class:'chart-svg',role:'img','aria-label':o.aria||o.title||'Chart'});
  const tks=niceTicks(y0,y1,4),stp=tks.length>1?+(tks[1]-tks[0]).toFixed(6):1,dec=Number.isInteger(stp)?0:Math.min(3,(String(stp).split('.')[1]||'').length);tks.forEach(v=>{if(v<y0||v>y1)return;svg.appendChild(svgEl('line',{x1:m.l,x2:W-m.r,y1:Y(v),y2:Y(v),class:'c-grid'}));const t=svgEl('text',{x:m.l-6,y:Y(v)+3,class:'c-axis','text-anchor':'end'});t.textContent=String(+v.toFixed(dec));svg.appendChild(t);});
  const dates=[...new Set(all.map(p=>p.x))].sort();[dates[0],dates[dates.length-1]].filter((v,i,a)=>a.indexOf(v)===i).forEach((d,i,arr)=>{const t=svgEl('text',{x:X(Date.parse(d+'T12:00:00')),y:H-6,class:'c-axis','text-anchor':arr.length>1?(i===0?'start':'end'):'middle'});t.textContent=fmtShortDate(d);svg.appendChild(t);});
  if(o.ref){const ry=Y(o.ref.y);svg.appendChild(svgEl('line',{x1:m.l,x2:W-m.r,y1:ry,y2:ry,class:'c-ref'}));const t=svgEl('text',{x:W-m.r,y:ry-4,class:'c-axis','text-anchor':'end'});t.textContent=o.ref.label;svg.appendChild(t);}
  o.series.forEach(s=>{const pts=s.points.map(p=>[X(Date.parse(p.x+'T12:00:00')),Y(p.y)]);
    if(s.kind!=='dots'&&pts.length>1)svg.appendChild(svgEl('path',{d:'M'+pts.map(p=>p[0].toFixed(1)+','+p[1].toFixed(1)).join('L'),fill:'none',stroke:s.color,'stroke-width':2,'stroke-linejoin':'round','stroke-linecap':'round'}));
    if(s.kind==='dots'||pts.length<=24)pts.forEach(p=>svg.appendChild(svgEl('circle',{cx:p[0],cy:p[1],r:s.kind==='dots'?3:4,fill:s.color,class:'c-dot'})));});
  const prim=o.series[0];if(o.directLabel!==false&&prim.points.length){const lp=prim.points[prim.points.length-1];const t=svgEl('text',{x:X(Date.parse(lp.x+'T12:00:00'))+8,y:Y(lp.y)+4,class:'c-label','text-anchor':'start'});t.textContent=fmtNum(lp.y)+(o.unit||'');svg.appendChild(t);}
  const cross=svgEl('line',{y1:m.t,y2:H-m.b,class:'c-cross',visibility:'hidden'});svg.appendChild(cross);
  const hl=o.series.map(s=>{const c=svgEl('circle',{r:5,fill:s.color,class:'c-hl',visibility:'hidden'});svg.appendChild(c);return c;});
  const hit=svgEl('rect',{x:0,y:0,width:W,height:H,fill:'transparent'});svg.appendChild(hit);
  const tip=mkEl('div','chart-tip');tip.hidden=true;
  const move=ev=>{const r=svg.getBoundingClientRect(),px=(ev.clientX-r.left)/r.width*W;let best=null,bd=1e9;dates.forEach(d=>{const dx=Math.abs(X(Date.parse(d+'T12:00:00'))-px);if(dx<bd){bd=dx;best=d;}});if(!best)return;const cx=X(Date.parse(best+'T12:00:00'));cross.setAttribute('x1',cx);cross.setAttribute('x2',cx);cross.setAttribute('visibility','visible');
    const lines=[fmtShortDate(best)];o.series.forEach((s,i)=>{const p=s.points.find(q=>q.x===best);if(p){hl[i].setAttribute('cx',cx);hl[i].setAttribute('cy',Y(p.y));hl[i].setAttribute('visibility','visible');lines.push((o.series.length>1?s.name+': ':'')+(p.tip||fmtNum(p.y)+(o.unit||'')));}else hl[i].setAttribute('visibility','hidden');});
    tip.textContent='';lines.forEach((l,i)=>tip.appendChild(mkEl(i?'div':'strong','',l)));placeTip(tip,svg,cx/W);};
  const leave=()=>{cross.setAttribute('visibility','hidden');hl.forEach(c=>c.setAttribute('visibility','hidden'));tip.hidden=true;};
  hit.addEventListener('pointermove',move);hit.addEventListener('pointerdown',move);hit.addEventListener('pointerleave',ev=>{if(ev.pointerType==='mouse')leave();});
  const holder=mkEl('div','chart-holder');holder.append(svg,tip);holder.__hideTip=leave;wrap.appendChild(holder);
  if(o.table)wrap.appendChild(chartTable(o.table.cols,o.table.rows));
  return wrap;
}
// Tooltip placement uses the SVG's own (unzoomed) width, so it stays put at Large/Extra-large text, and it is clamped inside the chart.
function placeTip(tip,svg,frac){tip.hidden=false;const w=svg.clientWidth||svg.getBoundingClientRect().width,tw=tip.offsetWidth;tip.style.left=Math.max(tw/2,Math.min(w-tw/2,frac*w))+'px';}
// On touch there is no hover: a tooltip stays until you tap somewhere else.
document.addEventListener('pointerdown',ev=>{document.querySelectorAll('.chart-holder').forEach(h=>{if(h.__hideTip&&!h.contains(ev.target))h.__hideTip();});},true);
/* bars: [{x:iso, y:number|null}], categorical days; rounded data-end anchored to baseline. */
function barChart(o){
  const W=340,H=o.height||150,m={l:34,r:10,t:14,b:22};const wrap=mkEl('div','chart');if(o.title)wrap.appendChild(mkEl('div','chart-title',o.title));
  const vals=o.bars.filter(b=>b.y!==null);if(!vals.length){wrap.appendChild(mkEl('div','empty-state',o.empty||'No data yet.'));return wrap;}
  const y1=Math.max(o.yMax||0,...vals.map(b=>b.y),o.ref?o.ref.y:0)*1.1,Y=v=>H-m.b-v/y1*(H-m.t-m.b),n=o.bars.length,slot=(W-m.l-m.r)/n,bw=Math.max(4,slot-2);
  const svg=svgEl('svg',{viewBox:'0 0 '+W+' '+H,class:'chart-svg',role:'img','aria-label':o.aria||o.title||'Bar chart'});
  niceTicks(0,y1,3).forEach(v=>{if(v>y1)return;svg.appendChild(svgEl('line',{x1:m.l,x2:W-m.r,y1:Y(v),y2:Y(v),class:'c-grid'}));const t=svgEl('text',{x:m.l-6,y:Y(v)+3,class:'c-axis','text-anchor':'end'});t.textContent=fmtNum(v,0);svg.appendChild(t);});
  const tip=mkEl('div','chart-tip');tip.hidden=true;
  o.bars.forEach((b,i)=>{const x=m.l+i*slot+1;if(b.y!==null&&b.y>0){const top=Y(b.y),base=Y(0),r=Math.min(4,bw/2,base-top);svg.appendChild(svgEl('path',{d:`M${x},${base}V${top+r}Q${x},${top} ${x+r},${top}H${x+bw-r}Q${x+bw},${top} ${x+bw},${top+r}V${base}Z`,fill:o.color,class:'c-bar'}));}
    const hit=svgEl('rect',{x:m.l+i*slot,y:m.t,width:slot,height:H-m.t-m.b,fill:'transparent'});const show=()=>{tip.textContent='';tip.appendChild(mkEl('strong','',fmtShortDate(b.x)));tip.appendChild(mkEl('div','',b.y===null?'No check-in':(b.tip||fmtNum(b.y)+(o.unit||''))));placeTip(tip,svg,(x+bw/2)/W);};hit.addEventListener('pointerenter',ev=>{if(ev.pointerType==='mouse')show();});hit.addEventListener('pointerdown',show);hit.addEventListener('pointerleave',ev=>{if(ev.pointerType==='mouse')tip.hidden=true;});svg.appendChild(hit);});
  if(o.ref){const ry=Y(o.ref.y);svg.appendChild(svgEl('line',{x1:m.l,x2:W-m.r,y1:ry,y2:ry,class:'c-ref'}));const t=svgEl('text',{x:W-m.r,y:ry-4,class:'c-axis','text-anchor':'end'});t.textContent=o.ref.label;svg.appendChild(t);}
  [0,n-1].filter((v,i,a)=>a.indexOf(v)===i).forEach((i,k,arr)=>{const t=svgEl('text',{x:m.l+i*slot+(k===0?0:slot),y:H-6,class:'c-axis','text-anchor':arr.length>1?(k===0?'start':'end'):'start'});t.textContent=fmtShortDate(o.bars[i].x);svg.appendChild(t);});
  const holder=mkEl('div','chart-holder');holder.append(svg,tip);holder.__hideTip=()=>{tip.hidden=true;};wrap.appendChild(holder);if(o.table)wrap.appendChild(chartTable(o.table.cols,o.table.rows));return wrap;
}

/* ---------- 4. Training progress ---------- */
// Reps: '5', '5 reps', '3x5' / '3×5' (reps after the x), '8-10' (lower bound). Durations, AMRAP or blanks give NaN and are not used for strength estimates.
function repsNumber(r){const s=String(r||'').trim().toLowerCase();if(!s||/min|sec|second|minute|[:'"]|\d\s*s\b|\d\s*m\b/.test(s))return NaN;let m=s.match(/^(\d+)\s*(?:reps?)?$/);if(m)return +m[1];m=s.match(/^\d+\s*[x×]\s*(\d+)/);if(m)return +m[1];m=s.match(/^(\d+)\s*[-–]\s*\d+\s*(?:reps?)?$/);if(m)return +m[1];return NaN;}
function e1rm(load,reps){if(!Number.isFinite(load)||load<=0)return null;if(!Number.isFinite(reps)||reps<1||reps>12)return null;return reps===1?load:load*(1+reps/30);}
function exerciseHistory(){
  const by={};workoutLog.forEach(w=>{const name=String(w.exercise||'').trim();if(!name)return;const k=name.toLowerCase();const reps=repsNumber(w.reps),est=e1rm(Number(w.load),reps);(by[k]=by[k]||{name,sessions:{}});const s=by[k].sessions[w.date]||(by[k].sessions[w.date]={date:w.date,best:null,bestSet:'',rpe:[]});if(est!==null&&(s.best===null||est>s.best)){s.best=est;s.bestSet=fmtNum(Number(w.load))+' kg × '+reps;}if(Number.isFinite(Number(w.rpe))&&w.rpe!==null&&w.rpe!=='')s.rpe.push(Number(w.rpe));});
  return Object.values(by).map(e=>({name:e.name,sessions:Object.values(e.sessions).sort((a,b)=>a.date.localeCompare(b.date))})).sort((a,b)=>b.sessions.length-a.sessions.length);
}
function stalledLifts(){
  const cut=addDaysISO(localISODate(),-21);
  return exerciseHistory().map(e=>{const loaded=e.sessions.filter(s=>s.best!==null);const recent=loaded.filter(s=>s.date>=cut),before=loaded.filter(s=>s.date<cut);if(recent.length<3||!before.length)return null;const bestBefore=Math.max(...before.map(s=>s.best)),bestRecent=Math.max(...recent.map(s=>s.best));if(bestRecent>bestBefore)return null;const pb=before.find(s=>s.best===bestBefore);return {name:e.name,best:bestBefore,bestDate:pb.date,recent:recent.length};}).filter(Boolean);
}
let progressExercise=null;
function renderProgress(){
  const box=document.getElementById('progressBody');if(!box)return;box.textContent='';
  const hist=exerciseHistory().filter(e=>e.sessions.some(s=>s.best!==null));
  const stalls=stalledLifts();
  if(stalls.length){const c=mkEl('div','insight-card stall-card');c.appendChild(mkEl('div','checkin-title','⚠ Stalled lifts'));stalls.forEach(s=>c.appendChild(mkEl('p','insight-note',s.name+': no new best in 3 weeks ('+s.recent+' sessions). Best est. 1RM '+fmtNum(s.best)+' kg on '+fmtShortDate(s.bestDate)+'.')));c.appendChild(mkEl('p','insight-note','Common fixes: a lighter deload week, a different rep range, or more sleep. Check with your coach.'));box.appendChild(c);}
  box.appendChild(mkEl('div','section-kicker','Strength'));
  if(!hist.length){box.appendChild(mkEl('div','empty-state','Log lifts with a load and reps in Training → Log, and your trends appear here.'));}
  else{
    if(!progressExercise||!hist.some(e=>e.name===progressExercise))progressExercise=hist[0].name;
    const chips=mkEl('div','chip-row');hist.slice(0,12).forEach(e=>{const b=mkEl('button','hub-tab'+(e.name===progressExercise?' active':''),e.name);b.type='button';b.addEventListener('click',()=>{progressExercise=e.name;renderProgress();});chips.appendChild(b);});box.appendChild(chips);
    const ex=hist.find(e=>e.name===progressExercise),pts=ex.sessions.filter(s=>s.best!==null);
    box.appendChild(lineChart({title:ex.name+' · estimated 1-rep max (kg)',unit:' kg',series:[{name:'Est. 1RM',color:'var(--viz-1)',points:pts.map(s=>({x:s.date,y:Math.round(s.best*10)/10,tip:fmtNum(s.best)+' kg est. 1RM ('+s.bestSet+')'}))}],table:{cols:['Date','Best set','Est. 1RM (kg)'],rows:pts.map(s=>[s.date,s.bestSet,fmtNum(s.best)])}}));
    const rp=ex.sessions.filter(s=>s.rpe.length).map(s=>({x:s.date,y:Math.round(s.rpe.reduce((a,b)=>a+b,0)/s.rpe.length*10)/10}));
    if(rp.length)box.appendChild(lineChart({title:ex.name+' · average RPE',height:130,yMin:5,yMax:10,series:[{name:'RPE',color:'var(--viz-2)',points:rp}],table:{cols:['Date','Avg RPE'],rows:rp.map(p=>[p.x,p.y])}}));
    box.appendChild(mkEl('p','system-note','Estimated 1RM uses the Epley formula on sets of 1–12 reps. It is a trend line, not a test result.'));
  }
  box.appendChild(mkEl('div','section-kicker','Recovery · last 14 days'));
  const days=[];for(let i=13;i>=0;i--)days.push(addDaysISO(localISODate(),-i));
  const rows=days.map(d=>({d,c:checkins[d]||null}));
  box.appendChild(barChart({title:'Sleep (hours)',unit:' h',color:'var(--viz-1)',ref:{y:8,label:'8 h'},yMax:9,bars:rows.map(r=>({x:r.d,y:r.c?r.c.sleep:null,tip:r.c?fmtNum(r.c.sleep)+' h · energy '+r.c.energy+'/5 · soreness '+r.c.soreness+'/5':''})),empty:'Do the morning check-in on the Today screen and your sleep shows up here.',table:{cols:['Date','Sleep (h)','Energy','Soreness'],rows:rows.filter(r=>r.c).map(r=>[r.d,r.c.sleep,r.c.energy,r.c.soreness])}}));
  const logged=rows.filter(r=>r.c);if(logged.length){const avg=k=>fmtNum(logged.reduce((a,r)=>a+r.c[k],0)/logged.length);box.appendChild(mkEl('p','system-note','Averages over '+logged.length+' check-in'+(logged.length===1?'':'s')+': sleep '+avg('sleep')+' h · energy '+avg('energy')+'/5 · soreness '+avg('soreness')+'/5.'));}
}

/* ---------- 5. Past papers ---------- */
function normalizePaper(p,i){if(!p||typeof p!=='object')return null;const score=Number(p.score),max=Number(p.max);if(!ISO_RE.test(p.date||'')||typeof p.paper!=='string'||!p.paper.trim()||!Number.isFinite(score)||!Number.isFinite(max)||max<=0||max>1000||score<0||score>max)return null;return {id:typeof p.id==='string'&&SAFE_ID_RE.test(p.id)?p.id:'pp-fix-'+i+'-'+Math.random().toString(36).slice(2,6),date:p.date,subject:EXAM_SUBJECTS.includes(p.subject)?p.subject:'Other',paper:p.paper.trim().slice(0,80),score:Math.round(score*10)/10,max:Math.round(max*10)/10,weak:typeof p.weak==='string'?p.weak.slice(0,300):''};}
let papers=normList(safeReadJSON(PAPERS_KEY,[]),normalizePaper);
let paperSubject='All';
function persistPapers(){if(!lsSet(PAPERS_KEY,JSON.stringify(papers)))storageFullWarn();}
function paperPct(p){return Math.round(p.score/p.max*100);}
function addPaper(){
  const g=id=>document.getElementById(id);
  if(!g('ppScore').value.trim()||!g('ppMax').value.trim()){alert('Enter both your marks and the total for the paper.');return;}const p=normalizePaper({date:g('ppDate').value,subject:g('ppSubject').value,paper:g('ppName').value,score:g('ppScore').value,max:g('ppMax').value,weak:g('ppWeak').value,id:'pp'+Date.now().toString(36)},0);
  if(!p){alert('Check the paper name, date and marks (score must be between 0 and the total).');return;}
  papers.push(p);persistPapers();renderPapers();
}
function deletePaper(id){const p=papers.find(x=>x.id===id);if(!p||!confirm('Delete "'+p.paper+'"?'))return;papers=papers.filter(x=>x.id!==id);persistPapers();renderPapers();}
function renderPaperSources(){const box=document.getElementById('paperSources');if(!box||box.dataset.done)return;box.dataset.done='1';const card=mkEl('div','insight-card');card.appendChild(mkEl('div','checkin-title','Real past papers'));Object.entries(PAST_PAPER_LINKS).forEach(([s,l])=>card.appendChild(extLinkRow(s+':',l)));card.appendChild(mkEl('p','insight-note','Free papers with mark schemes on Physics & Maths Tutor (needs internet). Do a paper under timed conditions, mark it, then log your score below.'));box.appendChild(card);}
function renderPapers(){
  renderPaperSources();
  const sum=document.getElementById('paperSummary'),list=document.getElementById('paperList'),form=document.getElementById('paperForm');if(!sum||!list||!form)return;
  sum.textContent='';list.textContent='';
  const subs=['All',...EXAM_SUBJECTS.filter(s=>papers.some(p=>p.subject===s))];if(!subs.includes(paperSubject))paperSubject='All';
  if(papers.length){
    if(subs.length>2){const t=segButtons(subs,paperSubject,v=>{paperSubject=v;renderPapers();});t.classList.add('seg-wide');sum.appendChild(t);}
    const shown=papers.filter(p=>paperSubject==='All'||p.subject===paperSubject).sort((a,b)=>a.date.localeCompare(b.date));
    const last3=shown.slice(-3);sum.appendChild(mkEl('p','insight-note',(paperSubject==='All'?'All subjects':paperSubject)+': '+shown.length+' paper'+(shown.length===1?'':'s')+' · last '+last3.length+' average '+Math.round(last3.reduce((a,p)=>a+paperPct(p),0)/last3.length)+'%'));
    if(shown.length>=2){const byDate={};shown.forEach(p=>{(byDate[p.date]=byDate[p.date]||[]).push(p);});sum.appendChild(lineChart({title:'Past-paper scores (%)',unit:'%',yMin:0,yMax:100,series:[{name:'Score',color:'var(--viz-1)',points:Object.keys(byDate).sort().map(d=>{const ps=byDate[d];return {x:d,y:Math.round(ps.reduce((a,p)=>a+paperPct(p),0)/ps.length),tip:ps.map(p=>p.paper+': '+p.score+'/'+p.max+' ('+paperPct(p)+'%)').join(' · ')};})}],table:{cols:['Date','Paper','Marks','%'],rows:shown.map(p=>[p.date,p.paper,p.score+'/'+p.max,paperPct(p)])}}));}
    [...shown].reverse().forEach(p=>{const c=mkEl('div','exam-item');const l=mkEl('div','exam-main');l.append(mkEl('div','item-title',p.paper),mkEl('div','item-meta',p.subject+' · '+fmtShortDate(p.date)));if(p.weak)l.appendChild(mkEl('div','item-meta','Weak spots: '+p.weak));const r=mkEl('div','exam-days');r.append(mkEl('div','exam-days-n',paperPct(p)+'%'),mkEl('div','exam-days-l',fmtNum(p.score)+'/'+fmtNum(p.max)));const del=mkEl('button','small-action','Delete');del.type='button';del.addEventListener('click',()=>deletePaper(p.id));c.append(l,r,del);list.appendChild(c);});
  }else list.appendChild(mkEl('div','empty-state','No past papers logged yet. Add your first one below.'));
  if(!form.children.length){
    form.innerHTML='<div class="form-panel"><h3 style="margin:0 0 8px;font-size:14px">Log a past paper</h3>'+
      '<div class="field"><label for="ppName">Paper</label><input id="ppName" maxlength="80" placeholder="June 2023 Paper 2"></div>'+
      '<div class="pp-grid"><div class="field"><label for="ppSubject">Subject</label><select id="ppSubject"><option>Chemistry</option><option>Biology</option><option>Maths</option><option>Other</option></select></div>'+
      '<div class="field"><label for="ppDate">Date done</label><input id="ppDate" type="date"></div>'+
      '<div class="field"><label for="ppScore">Marks</label><input id="ppScore" type="number" inputmode="decimal" min="0" step="0.5"></div>'+
      '<div class="field"><label for="ppMax">Out of</label><input id="ppMax" type="number" inputmode="decimal" min="1" step="1"></div></div>'+
      '<div class="field"><label for="ppWeak">Weak spots (optional)</label><input id="ppWeak" maxlength="300" placeholder="Q4 buffers, Q7 NMR"></div>'+
      '<button class="btn btn-primary" style="width:100%;margin-top:10px" type="button" onclick="addPaper()">Save paper</button></div>';
  }
  const dt=document.getElementById('ppDate');if(dt&&!dt.value)dt.value=localISODate();
}
function renderExamsView(){renderExams();renderPapers();const d=document.getElementById('examDate');if(d&&!d.min)d.min=localISODate();
  const a=document.getElementById('examActions');if(a&&!a.children.length){const b=mkEl('button','','📅 Add exams & deadlines to my calendar');b.type='button';b.addEventListener('click',exportCalendar);a.appendChild(b);}}

/* ---------- 6. Calendar export (.ics) ---------- */
function icsEscape(s){return String(s||'').replace(/\\/g,'\\\\').replace(/;/g,'\\;').replace(/,/g,'\\,').replace(/\r?\n/g,'\\n');}
// RFC 5545: lines are at most 75 octets (UTF-8 bytes), continuation lines start with one space; never split a character.
function icsFold(line){const enc=new TextEncoder(),out=[];let cur='',bytes=0,limit=75;for(const ch of line){const b=enc.encode(ch).length;if(bytes+b>limit){out.push(cur);cur=' ';bytes=1;limit=75;}cur+=ch;bytes+=b;}out.push(cur);return out.join('\r\n');}
function buildIcs(){
  const stamp=new Date().toISOString().replace(/[-:]/g,'').replace(/\.\d+Z$/,'Z'),d8=iso=>iso.replace(/-/g,''),L=['BEGIN:VCALENDAR','VERSION:2.0','PRODID:-//Bridge Protocol//EN','CALSCALE:GREGORIAN','METHOD:PUBLISH','X-WR-CALNAME:Bridge Protocol'];
  let n=0;const ev=(uid,date,summary,desc,alarm,alarmText)=>{n++;L.push('BEGIN:VEVENT','UID:'+uid+'@bridge-protocol','DTSTAMP:'+stamp,'DTSTART;VALUE=DATE:'+d8(date),'DTEND;VALUE=DATE:'+d8(addDaysISO(date,1)),'SUMMARY:'+icsEscape(summary));if(desc)L.push('DESCRIPTION:'+icsEscape(desc));L.push('BEGIN:VALARM','ACTION:DISPLAY','DESCRIPTION:'+icsEscape(alarmText),'TRIGGER:'+alarm,'END:VALARM','END:VEVENT');};
  upcomingExams().forEach(e=>ev('exam-'+e.id,e.date,'Exam: '+e.name,e.subject,'-PT15H','Exam tomorrow: '+e.name));
  const today=localISODate();tasks.filter(t=>taskIsOpen(t)&&t.due&&t.due>=today).forEach(t=>ev('task-'+t.id,t.due,'Due: '+t.title,t.notes||'','PT9H','Due today: '+t.title));
  L.push('END:VCALENDAR');return {text:L.map(icsFold).join('\r\n')+'\r\n',count:n};
}
function exportCalendar(){const r=buildIcs();if(!r.count){alert('Nothing to export yet: add an exam date or a task with a due date first.');return;}downloadBlob(r.text,'text/calendar','bridge-protocol-calendar.ics');setTimeout(()=>alert(r.count+' event'+(r.count===1?'':'s')+' exported. Open the downloaded .ics file and choose Samsung Calendar to add them. (The Google Calendar phone app cannot import .ics files; on a computer use calendar.google.com → Settings → Import.) Exporting again later updates the same events.'),300);}

/* ---------- 7. Bodyweight log ---------- */
function normalizeBody(v){const out={entries:[],target:null};if(!v||typeof v!=='object'||Array.isArray(v))return out;const seen={};(Array.isArray(v.entries)?v.entries:[]).forEach(e=>{if(!e||!ISO_RE.test(e.date||''))return;const kg=clampNum(e.kg,25,300,0.1);if(kg===null)return;seen[e.date]=Math.round(kg*10)/10;});out.entries=Object.keys(seen).sort().slice(-1000).map(d=>({date:d,kg:seen[d]}));if(v.target&&typeof v.target==='object'){const kg=clampNum(v.target.kg,25,300,0.1);if(kg!==null&&ISO_RE.test(v.target.date||''))out.target={kg:Math.round(kg*10)/10,date:v.target.date};}return out;}
let body=normalizeBody(safeReadJSON(BODY_KEY,null));
function persistBody(){if(!lsSet(BODY_KEY,JSON.stringify(body)))storageFullWarn();}
function avgWeight(endIso,days){const start=addDaysISO(endIso,-(days-1));const e=body.entries.filter(x=>x.date>=start&&x.date<=endIso);return e.length?e.reduce((a,x)=>a+x.kg,0)/e.length:null;}
function inRange(v,lo,hi){const n=Number(v);return v!==''&&v!==null&&Number.isFinite(n)&&n>=lo&&n<=hi;}
function addWeight(){const raw=document.getElementById('bwKg').value;if(!inRange(raw,25,300)){alert('Enter your weight in kg (25–300).');return;}const kg=clampNum(raw,25,300,0.1),date=document.getElementById('bwDate').value||localISODate();if(kg===null||!ISO_RE.test(date)){alert('Enter your weight in kg (25–300).');return;}body=normalizeBody({...body,entries:[...body.entries.filter(e=>e.date!==date),{date,kg}]});persistBody();document.getElementById('bwKg').value='';renderBodyweight();}
function saveWeightTarget(){const rawT=document.getElementById('bwTargetKg').value.trim();if(rawT===''){body.target=null;persistBody();renderBodyweight();return;}if(!inRange(rawT,25,300)){alert('Target must be between 25 and 300 kg.');return;}const kg=clampNum(rawT,25,300,0.1),date=document.getElementById('bwTargetDate').value;if(kg===null||!ISO_RE.test(date)){body.target=null;}else body.target={kg:Math.round(kg*10)/10,date};persistBody();renderBodyweight();}
function renderBodyweight(){
  const box=document.getElementById('bodyweightBox');if(!box)return;box.textContent='';
  const card=mkEl('div','insight-card');card.appendChild(mkEl('div','checkin-title','Bodyweight'));
  const today=localISODate(),last=body.entries[body.entries.length-1];
  const f=mkEl('div','bw-form');f.innerHTML='<input id="bwKg" type="number" inputmode="decimal" step="0.1" min="25" max="300" placeholder="kg" aria-label="Weight in kg"><input id="bwDate" type="date" aria-label="Date"><button class="btn btn-primary" type="button" onclick="addWeight()">Log</button>';card.appendChild(f);
  box.appendChild(card);document.getElementById('bwDate').value=today;
  if(body.entries.length){
    const ref=last.date,a7=avgWeight(ref,7),p7=avgWeight(addDaysISO(ref,-7),7);
    const stats=mkEl('div','bw-stats');const stat=(l,v)=>{const s=mkEl('div','bw-stat');s.append(mkEl('div','metric-label',l),mkEl('div','bw-val',v));stats.appendChild(s);};
    stat('LATEST',fmtNum(last.kg)+' kg');stat('7-DAY AVG',fmtNum(a7)+' kg');const stale=daysUntil(last.date)<-7;
    let weekly=null;if(p7!==null){weekly=a7-p7;stat('VS LAST WEEK',(weekly>0?'+':'')+fmtNum(weekly,2)+' kg');}
    card.appendChild(stats);
    if(stale)card.appendChild(mkEl('p','insight-note warn-note','Your last weigh-in was '+fmtShortDate(last.date)+'. These numbers are from then; log a fresh weight.'));
    if(weekly!==null){const pct=weekly/p7*100;if(pct<=-1)card.appendChild(mkEl('p','insight-note warn-note','⚠ Losing about '+fmtNum(Math.abs(pct))+'% of bodyweight a week. Faster than ~1% a week usually costs strength and recovery; consider eating a bit more and talk to your coach.'));else if(Math.abs(pct)<0.25)card.appendChild(mkEl('p','insight-note','Weight is steady. If that is not the goal, adjust calories by 100–150 a day and give it two weeks.'));}
    const pts=body.entries.slice(-90);const avg=pts.map(e=>({x:e.date,y:Math.round(avgWeight(e.date,7)*10)/10}));
    card.appendChild(lineChart({title:'Weight (kg)',unit:' kg',series:[{name:'7-day average',color:'var(--viz-1)',kind:'line',points:avg},{name:'Daily weigh-in',color:'var(--viz-2)',kind:'dots',points:pts.map(e=>({x:e.date,y:e.kg}))}],ref:body.target?{y:body.target.kg,label:'target '+fmtNum(body.target.kg)}:null,table:{cols:['Date','Weight (kg)','7-day avg'],rows:pts.map((e,i)=>[e.date,e.kg,avg[i].y])}}));
  }else card.appendChild(mkEl('p','insight-note','Weigh in a few mornings a week, same conditions. The 7-day average smooths out water swings.'));
  const tg=mkEl('details','bw-target');tg.appendChild(mkEl('summary','','Weight-class target (optional)'));const tf=mkEl('div','bw-form');tf.innerHTML='<input id="bwTargetKg" type="number" inputmode="decimal" step="0.1" min="25" max="300" placeholder="target kg" aria-label="Target kg"><input id="bwTargetDate" type="date" aria-label="Target date"><button class="btn btn-secondary" type="button" onclick="saveWeightTarget()">Save</button>';tg.appendChild(tf);
  if(body.target){tg.open=true;const cur=avgWeight(last?last.date:today,7)||(last&&last.kg);const days=daysUntil(body.target.date);if(cur&&days>0){const need=(body.target.kg-cur)/(days/7);const pct=Math.abs(need)/cur*100;tg.appendChild(mkEl('p','insight-note'+(pct>1?' warn-note':''),'To reach '+fmtNum(body.target.kg)+' kg by '+fmtShortDate(body.target.date)+' you need about '+(need>0?'+':'')+fmtNum(need,2)+' kg a week ('+fmtNum(pct)+'% of bodyweight).'+(pct>1?' That is faster than the ~0.5–1% a week usually recommended. Talk to your coach about the timeline or weight class.':'')));}else if(days<=0)tg.appendChild(mkEl('p','insight-note','Target date has passed. Set a new one or clear it.'));}
  card.appendChild(tg);
  if(body.target){document.getElementById('bwTargetKg').value=body.target.kg;document.getElementById('bwTargetDate').value=body.target.date;}
}

/* ---------- 8. Appearance ---------- */
function normalizeAppearance(v){const o={theme:'dark',text:'normal'};if(v&&typeof v==='object'&&!Array.isArray(v)){if(['dark','light','system'].includes(v.theme))o.theme=v.theme;if(['normal','large','xl'].includes(v.text))o.text=v.text;}return o;}
let appearance=normalizeAppearance(safeReadJSON(APPEAR_KEY,null));
const TEXT_ZOOM={normal:1,large:1.12,xl:1.25};
function resolvedTheme(){if(appearance.theme==='system'){try{return window.matchMedia('(prefers-color-scheme: light)').matches?'light':'dark';}catch(e){return 'dark';}}return appearance.theme;}
function applyAppearance(){const root=document.documentElement,t=resolvedTheme();root.dataset.theme=t;root.style.zoom=TEXT_ZOOM[appearance.text]===1?'':String(TEXT_ZOOM[appearance.text]);root.dataset.text=appearance.text;const m=document.querySelector('meta[name="theme-color"]');if(m)m.setAttribute('content',t==='light'?'#f4f6f9':'#090d12');}
function setAppearance(k,v){appearance=normalizeAppearance({...appearance,[k]:v});lsSet(APPEAR_KEY,JSON.stringify(appearance));applyAppearance();renderAppearance();}
function renderAppearance(){const box=document.getElementById('appearanceBox');if(!box)return;box.textContent='';
  box.appendChild(mkEl('div','metric-label','THEME'));box.appendChild(segButtons(['dark','light','system'],appearance.theme,v=>setAppearance('theme',v),v=>({dark:'Dark',light:'Light',system:'Match phone'})[v]));
  box.appendChild(mkEl('div','metric-label','TEXT SIZE'));box.appendChild(segButtons(['normal','large','xl'],appearance.text,v=>setAppearance('text',v),v=>({normal:'Normal',large:'Large',xl:'Extra large'})[v]));}
try{window.matchMedia('(prefers-color-scheme: light)').addEventListener('change',()=>{if(appearance.theme==='system')applyAppearance();});}catch(e){}
applyAppearance();
/* ===================== end v32 features ===================== */

/* ===================== v33 features ===================== */
const STUDY_KEY='bp_studyLog_v1',MISTAKES_KEY='bp_mistakes_v1',BLURT_KEY='bp_blurt_v1',SPECRAG_KEY='bp_specRag_v1',CAMP_KEY='bp_camp_v1';
const STUDY_SUBJECTS=['Chemistry','Biology','Maths','Other'];
function fmtMins(m){m=Math.round(m||0);if(m<60)return m+' min';const h=Math.floor(m/60),r=m%60;return h+' h'+(r?' '+r+' min':'');}
function weekAgoISO(){return addDaysISO(localISODate(),-6);}

/* ---------- 1. Quick log from the week plan ---------- */
function parsePlanItem(text){
  const s=String(text||'').trim();
  let m=s.match(/^(\d+)\s*[x×]\s*(\d+(?:[.,]\d+)?\s*(?:min|mins|minutes|sec|secs|s|m)\b)\s*(.*)$/i);
  if(m)return {exercise:(m[3]||'').replace(/^[—–-]\s*/,'').trim()||s,sets:Math.min(30,+m[1]),reps:m[2].replace(/\s+/g,''),note:''};
  m=s.match(/^(.*?)\s+(\d+)\s*[x×]\s*([0-9][^\s(@]*)\s*(.*)$/);
  if(m&&m[1].trim())return {exercise:m[1].replace(/[:\s]+$/,'').trim(),sets:Math.min(30,Math.max(1,+m[2])),reps:m[3],note:m[4].replace(/^[\s(]+|[\s)]+$/g,'').trim()};
  return {exercise:s,sets:1,reps:'',note:''};
}
function lastLoadFor(name){const k=String(name).toLowerCase();const w=workoutLog.find(x=>String(x.exercise||'').toLowerCase()===k&&x.load!==null&&x.load!==undefined);return w?w.load:null;}
let quickLogDay=null,quickLogRows=null,quickLogMsg='',quickLogKey='';
function quickLogPlan(){const day=quickLogDay||DAY_NAMES[new Date().getDay()];const d=SCHEDULE.find(x=>x.day===day);return {day,block:d?d.train:null};}
let quickLogBuilt={title:'',date:''};
function buildQuickRows(){const {block}=quickLogPlan();quickLogBuilt={title:block?block.title:'',date:localISODate()};quickLogRows=block?block.items.map(it=>{const p=parsePlanItem(it);return {...p,on:true,load:lastLoadFor(p.exercise),rpe:null};}):[];}
function renderQuickLog(){
  const box=document.getElementById('quickLog');if(!box)return;box.textContent='';
  const {day,block}=quickLogPlan();const qk=day+'|'+localISODate();if(quickLogKey!==qk){quickLogRows=null;quickLogMsg='';if(quickLogKey&&quickLogKey.split('|')[1]!==localISODate())quickLogDay=null;}const {day:d2,block:b2}=quickLogPlan();quickLogKey=d2+'|'+localISODate();if(!quickLogRows)buildQuickRows();
  const card=mkEl('div','insight-card quicklog');
  const head=mkEl('div','ql-head');head.appendChild(mkEl('div','checkin-title',"Log today's plan"));
  const sel=document.createElement('select');sel.className='ql-day';sel.setAttribute('aria-label','Plan day');DAY_NAMES.slice(1).concat('Sunday').forEach(dn=>{const o=document.createElement('option');o.value=dn;o.textContent=dn+(dn===DAY_NAMES[new Date().getDay()]?' (today)':'');sel.appendChild(o);});sel.value=d2;sel.addEventListener('change',()=>{quickLogDay=sel.value;quickLogRows=null;quickLogMsg='';renderQuickLog();});head.appendChild(sel);card.appendChild(head);
  if(!b2){box.appendChild(card);return;}
  card.appendChild(mkEl('div','insight-note',b2.title+' · untick anything you skipped, add weights, save.'));
  const today=localISODate();const done=workoutLog.filter(w=>w.date===today&&w.type===b2.title).length;
  if(done)card.appendChild(mkEl('div','ql-done','✓ '+done+' entr'+(done===1?'y':'ies')+' from this plan already logged today'));
  const grid=mkEl('div','ql-grid');
  quickLogRows.forEach((r,i)=>{
    const row=mkEl('div','ql-row'+(r.on?'':' off'));
    const cb=document.createElement('input');cb.type='checkbox';cb.checked=r.on;cb.setAttribute('aria-label','Did '+r.exercise);cb.addEventListener('change',()=>{r.on=cb.checked;row.classList.toggle('off',!r.on);});
    const name=mkEl('div','ql-name',r.exercise);if(r.note)name.appendChild(mkEl('small','',' '+r.note));
    const f=(ph,val,type,key,w)=>{const x=document.createElement('input');x.type=type;x.placeholder=ph;x.value=val===null||val===undefined?'':val;x.className='ql-in'+(w?' '+w:'');x.setAttribute('aria-label',ph+' for '+r.exercise);if(type==='number'){x.inputMode='decimal';x.step='any';}x.addEventListener('input',()=>{r[key]=type==='number'?(x.value===''?null:Number(x.value)):x.value;});return x;};
    const fields=mkEl('div','ql-fields');fields.append(f('sets',r.sets,'number','sets','sm'),f('reps / time',r.reps,'text','reps'),f('kg',r.load,'number','load','sm'),f('RPE',r.rpe,'number','rpe','sm'));
    const top=mkEl('label','ql-top');top.append(cb,name);row.append(top,fields);grid.appendChild(row);
  });
  card.appendChild(grid);
  const acts=mkEl('div','checkin-acts');const save=mkEl('button','btn btn-primary','Save to training log');save.type='button';save.addEventListener('click',saveQuickLog);acts.appendChild(save);card.appendChild(acts);
  if(quickLogMsg)card.appendChild(mkEl('div','ql-done',quickLogMsg));
  box.appendChild(card);
}
function saveQuickLog(){
  if(!quickLogRows)return;if(quickLogBuilt.date!==localISODate()){quickLogRows=null;renderQuickLog();alert('A new day has started, so the list has been refreshed. Check it and save again.');return;}const block={title:quickLogBuilt.title};if(!block.title)return;
  const rows=quickLogRows.filter(r=>r.on);if(!rows.length){alert('Tick at least one exercise you did.');return;}
  for(const r of rows){if(r.load!==null&&r.load!==undefined&&(!Number.isFinite(r.load)||r.load<0||r.load>1000)){alert('Check the weight for '+r.exercise+' (0–1000 kg).');return;}if(r.rpe!==null&&r.rpe!==undefined&&(!Number.isFinite(r.rpe)||r.rpe<1||r.rpe>10)){alert('RPE for '+r.exercise+' should be 1–10.');return;}const s=Number(r.sets);if(!Number.isInteger(s)||s<1||s>30){alert('Sets for '+r.exercise+' should be 1–30.');return;}}
  const now=new Date().toISOString(),date=localISODate();
  const entries=rows.map((r,i)=>({id:'w'+Date.now().toString(36)+i+Math.random().toString(36).slice(2,5),date,type:block.title.slice(0,80),exercise:String(r.exercise).slice(0,120),sets:Number(r.sets),reps:String(r.reps||'done').slice(0,30),load:r.load===undefined?null:r.load,rpe:r.rpe===undefined?null:r.rpe,notes:r.note||'',created:now}));
  workoutLog=normalizeWorkoutLog([...entries,...workoutLog]).slice(0,1000);persistWorkoutLog();
  quickLogMsg='✓ Saved '+entries.length+' exercise'+(entries.length===1?'':'s')+' to your log. See them in Progress.';quickLogRows=null;renderQuickLog();if(typeof renderWorkoutLog==='function')renderWorkoutLog();
}

/* ---------- 2. Study time ---------- */
function normalizeStudy(arr){return (Array.isArray(arr)?arr:[]).filter(x=>x&&typeof x==='object'&&ISO_RE.test(x.date||'')).map((x,i)=>{const mins=clampNum(x.minutes,1,600,1);if(mins===null)return null;return {id:typeof x.id==='string'&&SAFE_ID_RE.test(x.id)?x.id:'s-fix-'+i,date:x.date,subject:STUDY_SUBJECTS.includes(x.subject)?x.subject:'Other',topic:typeof x.topic==='string'?x.topic.slice(0,80):'',minutes:mins,source:x.source==='manual'?'manual':'timer'};}).filter(Boolean).slice(-3000);}
let studyLog=normalizeStudy(safeReadJSON(STUDY_KEY,[]));
let studySession=null,studyArming=false;
function persistStudy(){if(!lsSet(STUDY_KEY,JSON.stringify(studyLog)))storageFullWarn();}
function studyMinutes(from,to){const out={Chemistry:0,Biology:0,Maths:0,Other:0};studyLog.forEach(s=>{if(s.date>=from&&s.date<=to)out[s.subject]+=s.minutes;});return out;}
function defaultStudySubject(){const d=SCHEDULE.find(x=>x.day===DAY_NAMES[new Date().getDay()]);return (d&&subjectOfBlock(d.study&&d.study.title))||'Chemistry';}
function startStudyFocus(sec){const subj=(document.getElementById('focusSubject')||{}).value||defaultStudySubject(),topic=((document.getElementById('focusTopic')||{}).value||'').trim();studyArming=true;try{startPreset(sec);}finally{studyArming=false;}studySession={subject:STUDY_SUBJECTS.includes(subj)?subj:'Other',topic:topic.slice(0,80),planned:sec};}
function recordStudySession(sec){if(!studySession)return;const minutes=Math.round(sec/60);const s=studySession;studySession=null;if(minutes<1)return;studyLog.push({id:'s'+Date.now().toString(36),date:localISODate(),subject:s.subject,topic:s.topic,minutes:Math.min(600,minutes),source:'timer'});persistStudy();const t=document.getElementById('focusObjectiveText');if(t)t.textContent='✓ Logged '+fmtMins(minutes)+' of '+s.subject+(s.topic?' ('+s.topic+')':'')+'.';renderStudyTime();}
function addManualStudy(){const subj=document.getElementById('stSubject').value,mins=Number(document.getElementById('stMinutes').value);if(!Number.isFinite(mins)||mins<1||mins>600){alert('Enter minutes between 1 and 600.');return;}studyLog.push({id:'s'+Date.now().toString(36),date:document.getElementById('stDate').value||localISODate(),subject:STUDY_SUBJECTS.includes(subj)?subj:'Other',topic:'',minutes:Math.round(mins),source:'manual'});studyLog=normalizeStudy(studyLog);persistStudy();document.getElementById('stMinutes').value='';renderStudyTime();}
function studyBars(mins){const wrap=mkEl('div','hbars');const max=Math.max(1,...Object.values(mins));STUDY_SUBJECTS.forEach(s=>{const row=mkEl('div','hbar-row');row.appendChild(mkEl('span','hbar-label',s));const track=mkEl('div','hbar-track');const fill=mkEl('div','hbar-fill');fill.style.width=(mins[s]/max*100)+'%';track.appendChild(fill);row.appendChild(track);row.appendChild(mkEl('span','hbar-val',fmtMins(mins[s])));wrap.appendChild(row);});return wrap;}
function renderStudyTime(){
  ['studyTimeBox','weeklyStudyBox'].forEach(id=>{const box=document.getElementById(id);if(!box)return;box.textContent='';
    const mins=studyMinutes(weekAgoISO(),localISODate()),total=Object.values(mins).reduce((a,b)=>a+b,0);
    const card=mkEl('div','insight-card');card.appendChild(mkEl('div','checkin-title','Study time · last 7 days · '+fmtMins(total)));
    card.appendChild(studyBars(mins));
    if(id==='studyTimeBox'){const f=mkEl('div','bw-form');f.innerHTML='<select id="stSubject" aria-label="Subject"><option>Chemistry</option><option>Biology</option><option>Maths</option><option>Other</option></select><input id="stMinutes" type="number" inputmode="numeric" min="1" max="600" placeholder="min" aria-label="Minutes"><input id="stDate" type="date" aria-label="Date"><button class="btn btn-secondary" type="button" onclick="addManualStudy()">Add</button>';card.appendChild(mkEl('div','insight-note','Studied without the timer? Add it here.'));card.appendChild(f);}
    box.appendChild(card);const d=document.getElementById('stDate');if(d&&!d.value)d.value=localISODate();});
}
// A study session that is interrupted (reset, or another timer started) is logged if it ran 5+ minutes.
function flushStudySession(){if(!studySession)return;const el=studySession.planned-(timerInterval?timerSecondsLeft():remaining);if(el>=300)recordStudySession(el);else studySession=null;}
function setFocusSubject(s){const sel=document.getElementById('focusSubject');if(sel)sel.value=s;}

/* ---------- 3. Mistake book ---------- */
function normalizeMistakes(v){const out={};if(!v||typeof v!=='object'||Array.isArray(v))return out;let n=0;for(const k of Object.keys(v).slice(-600)){const m=v[k];if(typeof k!=='string'||k.length>600||!/^[qcn]\|/.test(k)||!m||typeof m!=='object')continue;out[k]={type:k[0]==='q'?'quiz':k[0]==='c'?'card':'note',subject:STUDY_SUBJECTS.includes(m.subject)?m.subject:'Other',topic:String(m.topic||'').slice(0,160),label:String(m.label||'').slice(0,300),ref:String(m.ref||'').slice(0,500),added:ISO_RE.test(m.added||'')?m.added:localISODate(),misses:clampNum(m.misses,1,9999,1)||1,streak:clampNum(m.streak,0,1,1)||0};n++;}return out;}
let mistakes=normalizeMistakes(safeReadJSON(MISTAKES_KEY,{}));
let mistakeFilter='All';
function saveMistakes(){lsSet(MISTAKES_KEY,JSON.stringify(mistakes));}
function mistakeMiss(key,info){const m=mistakes[key]||{...info,added:localISODate(),misses:0,streak:0};m.misses++;m.streak=0;delete mistakes[key];mistakes[key]=m;const ks=Object.keys(mistakes);if(ks.length>600)ks.slice(0,ks.length-600).forEach(k=>delete mistakes[k]);saveMistakes();}
function mistakeHit(key){const m=mistakes[key];if(!m)return false;m.streak++;let cleared=false;if(m.streak>=2){delete mistakes[key];cleared=true;}saveMistakes();return cleared;}
function practiseMistake(key){const m=mistakes[key];if(!m)return;
  if(m.type==='quiz'){const q=QUESTIONS.find(x=>x.q===m.ref);if(!q){alert('That question is no longer in the bank.');return;}testTopicFocus=null;testSubjectFilter=q.subject;showView('test');currentQ=q;lastResult=null;lastAnswerText='';renderTest();}
  else if(m.type==='card'){const c=cardIndex().find(x=>x.key===m.ref);if(!c){alert('That card no longer exists.');return;}cardSession={queue:[c.key],done:0,again:0,flipped:false,total:1};showView('cards');}
  else{const [subj,...rest]=m.ref.split('|');const title=rest.join('|');const i=(NOTES[subj]||[]).findIndex(t=>t.title===title);if(i>=0)openNotesAt(subj,i);}
}
function renderMistakes(){
  const box=document.getElementById('mistakesBody');if(!box)return;box.textContent='';
  const all=Object.entries(mistakes);const subs=['All',...STUDY_SUBJECTS.filter(s=>all.some(([,m])=>m.subject===s))];if(!subs.includes(mistakeFilter))mistakeFilter='All';
  if(!all.length){box.appendChild(mkEl('div','empty-state','No mistakes logged. Quiz mark points you miss, flashcards you mark "Again" and blurt points you forget land here automatically. Get one right twice and it clears itself.'));return;}
  if(subs.length>2){const t=segButtons(subs,mistakeFilter,v=>{mistakeFilter=v;renderMistakes();});t.classList.add('seg-wide');box.appendChild(t);}
  const list=all.filter(([,m])=>mistakeFilter==='All'||m.subject===mistakeFilter).sort((a,b)=>b[1].misses-a[1].misses||b[1].added.localeCompare(a[1].added));
  box.appendChild(mkEl('p','insight-note',list.length+' to fix · each one clears after you get it right twice in a row.'));
  list.slice(0,150).forEach(([key,m])=>{const c=mkEl('div','exam-item mistake');const l=mkEl('div','exam-main');l.appendChild(mkEl('div','item-title',m.label||m.topic));
    l.appendChild(mkEl('div','item-meta',({quiz:'Quiz',card:'Flashcard',note:'Blurt'})[m.type]+' · '+m.subject+' · '+m.topic));
    if(m.type==='quiz')l.appendChild(mkEl('div','item-meta mistake-ref',m.ref.length>140?m.ref.slice(0,137)+'…':m.ref));
    l.appendChild(mkEl('div','item-meta','Missed '+m.misses+'×'+(m.streak?' · 1 of 2 correct':'')));
    const acts=mkEl('div','item-actions');const pr=mkEl('button','',m.type==='note'?'Open notes':'Practise');pr.type='button';pr.addEventListener('click',()=>practiseMistake(key));const rm=mkEl('button','','Remove');rm.type='button';rm.addEventListener('click',()=>{delete mistakes[key];saveMistakes();renderMistakes();});acts.append(pr,rm);l.appendChild(acts);c.appendChild(l);box.appendChild(c);});
}

/* ---------- 4. Blurting ---------- */
const BLURT_STOP=new Set('about above after again against along among another because before being below between both could does doing during each either every first from further have having here into itself just more most must other over same should since some such than that their them then there these they this those through under until very were what when where which while whose will with within would your also used using uses called means because therefore however example include includes including between following form forms formed'.split(' '));
function blurtTokens(text){return normMark(text).replace(/[^a-z0-9+\-\s]/g,' ').split(/\s+/).filter(Boolean);}
function keyTerms(point){const out=[];const seen=new Set();blurtTokens(point).forEach(t=>{const tech=/[a-z]/.test(t)&&/\d/.test(t);if((t.length>=5&&!BLURT_STOP.has(t)&&/^[a-z]/.test(t))||tech){const k=tech?t:t.slice(0,6);if(!seen.has(k)){seen.add(k);out.push(k);}}});return out;}
function blurtMark(subject,index,answer){
  const topic=(NOTES[subject]||[])[index];if(!topic)return null;
  const toks=blurtTokens(answer),stems=new Set(toks.map(t=>/\d/.test(t)?t:t.slice(0,6)));
  let total=0,hit=0;const sections=(topic.sections||[]).map(sec=>({heading:sec.heading,points:(sec.points||[]).map(p=>{const terms=keyTerms(p);if(!terms.length)return {text:p,hit:null};const need=Math.max(1,Math.ceil(terms.length*0.4));const got=terms.filter(t=>stems.has(t)).length;const ok=got>=need;total++;if(ok)hit++;return {text:p,hit:ok};})}));
  return {pct:total?Math.round(hit/total*100):0,hit,total,sections};
}
function normalizeBlurt(v){const out={};if(!v||typeof v!=='object'||Array.isArray(v))return out;Object.keys(v).slice(0,600).forEach(k=>{const x=v[k];if(!k.includes('|')||!x||typeof x!=='object')return;const best=clampNum(x.best,0,100,1),last=clampNum(x.last,0,100,1);if(best===null||last===null)return;out[k]={best,last,date:ISO_RE.test(x.date||'')?x.date:localISODate(),n:clampNum(x.n,1,9999,1)||1};});return out;}
let blurtHistory=normalizeBlurt(safeReadJSON(BLURT_KEY,{}));
let blurtSubject='Biology',blurtIndex=0,blurtResult=null;
function renderBlurt(){
  const box=document.getElementById('blurtBody');if(!box)return;const draft=document.getElementById('blurtText')?document.getElementById('blurtText').value:'';box.textContent='';
  const clearDraft=()=>{const t=document.getElementById('blurtText');if(t)t.value='';};const tabs=segButtons(['Chemistry','Biology','Maths'],blurtSubject,v=>{blurtSubject=v;blurtIndex=0;blurtResult=null;clearDraft();renderBlurt();});tabs.classList.add('seg-wide');box.appendChild(tabs);
  const list=NOTES[blurtSubject]||[];if(blurtIndex>=list.length)blurtIndex=0;
  const sel=document.createElement('select');sel.className='blurt-select';sel.setAttribute('aria-label','Topic');list.forEach((t,i)=>{const o=document.createElement('option');o.value=i;const h=blurtHistory[blurtSubject+'|'+t.title];o.textContent=t.title+(h?' · best '+h.best+'%':'');sel.appendChild(o);});sel.value=String(blurtIndex);sel.addEventListener('change',()=>{blurtIndex=Number(sel.value);blurtResult=null;clearDraft();renderBlurt();});box.appendChild(sel);
  const ta=document.createElement('textarea');ta.id='blurtText';ta.rows=9;ta.className='blurt-text';ta.placeholder='Close your notes. Write everything you remember about this topic: key terms, processes, equations, examples.';ta.value=blurtResult?blurtResult.answer:draft;if(blurtResult)ta.readOnly=true;box.appendChild(ta);
  const acts=mkEl('div','checkin-acts');
  if(!blurtResult){const mark=mkEl('button','btn btn-primary','Mark my recall');mark.type='button';mark.addEventListener('click',()=>{const ans=ta.value.trim();if(ans.length<20){alert('Write a bit more first. Even rough notes count.');return;}const r=blurtMark(blurtSubject,blurtIndex,ans);if(!r)return;const key=blurtSubject+'|'+list[blurtIndex].title,h=blurtHistory[key];blurtHistory[key]={best:Math.max(h?h.best:0,r.pct),last:r.pct,date:localISODate(),n:(h?h.n:0)+1};lsSet(BLURT_KEY,JSON.stringify(blurtHistory));r.sections.forEach(sec=>sec.points.forEach(pt=>{if(pt.hit)mistakeHit('n|'+blurtSubject+'|'+list[blurtIndex].title+'|'+pt.text.slice(0,120));}));blurtResult={...r,answer:ans};renderBlurt();});acts.appendChild(mark);}
  else{const again=mkEl('button','btn btn-primary','Try again');again.type='button';again.addEventListener('click',()=>{blurtResult=null;renderBlurt();const t=document.getElementById('blurtText');if(t)t.value='';});acts.appendChild(again);}
  box.appendChild(acts);
  if(blurtResult){const r=blurtResult,card=mkEl('div','insight-card');card.appendChild(mkEl('div','checkin-title','You recalled about '+r.pct+'% ('+r.hit+' of '+r.total+' points)'));card.appendChild(mkEl('p','insight-note','Automatic marking looks for the key terms of each point, so it is a guide. Read the misses properly.'));
    const missed=[];r.sections.forEach(s=>{const pts=s.points.filter(p=>p.hit!==null);if(!pts.length)return;card.appendChild(mkEl('p','note-subhead',s.heading));const ul=mkEl('ul','blurt-points');pts.forEach(p=>{const li=mkEl('li',p.hit?'hit':'miss',(p.hit?'✓ ':'✗ ')+p.text);ul.appendChild(li);if(!p.hit)missed.push({heading:s.heading,text:p.text});});card.appendChild(ul);});
    if(missed.length){const b=mkEl('button','small-action','Add '+missed.length+' missed point'+(missed.length===1?'':'s')+' to the mistake book');b.type='button';b.addEventListener('click',()=>{const t=list[blurtIndex];missed.forEach(p=>mistakeMiss('n|'+blurtSubject+'|'+t.title+'|'+p.text.slice(0,120),{type:'note',subject:blurtSubject,topic:t.title,label:p.text.slice(0,300),ref:blurtSubject+'|'+t.title}));b.disabled=true;b.textContent='Added ✓';});card.appendChild(b);}
    box.appendChild(card);}
}

/* ---------- 5. Spec checklist ---------- */
function normalizeSpecRag(v){const out={};if(!v||typeof v!=='object'||Array.isArray(v))return out;let n=0;for(const k of Object.keys(v)){if(n>=4000)break;if(typeof k==='string'&&k.length<=80&&k.includes('|')&&['r','a','g'].includes(v[k])){out[k]=v[k];n++;}}return out;}
let specRag=normalizeSpecRag(safeReadJSON(SPECRAG_KEY,{}));
let specSubject='Biology',specFilter='all',specGapsOnly=false;const specOpen={};
/* v36: free external practice. Pages checked Oct 2026; they need internet and open in the browser. */
const PMT='https://www.physicsandmathstutor.com/',SME='https://www.savemyexams.com/a-level/';
const OCR_MODULE_SLUGS={Biology:['development-of-practical-skills-in-biology','foundations-in-biology','exchange-and-transport','biodiversity-evolution-and-disease','communication-homeostasis-and-energy','genetics-evolution-and-ecosystems'],Chemistry:['development-of-practical-skills-in-chemistry','foundations-in-chemistry','periodic-table-and-energy','core-organic-chemistry','physical-chemistry-and-transition-elements','organic-chemistry-and-analysis']};
const MATHS_PMT_TOPICS={'Pure mathematics':['proof','algebra-and-functions','coordinate-geometry','sequences-and-series','trigonometry','exponentials-and-logarithms','differentiation','integration','numerical-methods','vectors'],Statistics:['sampling','data-presentation-and-interpretation','probability','statistical-distributions','hypothesis-testing'],Mechanics:['quantities-and-units-in-mechanics','kinematics','forces-and-newtons-laws','moments']};
const PAST_PAPER_LINKS={Biology:[['Paper 1',PMT+'past-papers/a-level-biology/ocr-a-paper-1/'],['Paper 2',PMT+'past-papers/a-level-biology/ocr-a-paper-2/'],['Paper 3',PMT+'past-papers/a-level-biology/ocr-a-paper-3/']],Chemistry:[['Paper 1',PMT+'past-papers/a-level-chemistry/ocr-a-paper-1/'],['Paper 2',PMT+'past-papers/a-level-chemistry/ocr-a-paper-2/'],['Paper 3',PMT+'past-papers/a-level-chemistry/ocr-a-paper-3/']],Maths:[['A-level papers',PMT+'maths-revision/a-level-edexcel/papers/'],['AS papers',PMT+'maths-revision/a-level-edexcel/papers-as/']]};
function moduleLinks(subject,moduleName){const m=String(moduleName).match(/^Module (\d)/);if(m&&OCR_MODULE_SLUGS[subject]){const n=+m[1],sub=subject.toLowerCase();return [['PMT questions & notes',PMT+sub+'-revision/a-level-ocr-a/module-'+n+'/'],['Save My Exams',SME+sub+'/ocr/17/topics/'+n+'-'+OCR_MODULE_SLUGS[subject][n-1]+'/']];}
  if(subject==='Maths'){const part={'Pure mathematics':'pure',Statistics:'statistics',Mechanics:'mechanics'}[moduleName];if(part)return [['Save My Exams notes',SME+'maths/edexcel/18/'+part+'/revision-notes/']];}return [];}
function mathsTopicLink(moduleName,topicName){const list=MATHS_PMT_TOPICS[moduleName];const m=String(topicName).match(/Topic (\d+)/);if(!list||!m)return null;const n=+m[1],i=moduleName==='Pure mathematics'?n-1:moduleName==='Statistics'?n-1:n-6;return list[i]?PMT+'maths-revision/a-level-edexcel/'+list[i]+'/':null;}
function extLinkRow(label,links){const row=mkEl('div','ext-links');if(label)row.appendChild(mkEl('span','ext-label',label));links.forEach(([t,u])=>{const a=document.createElement('a');a.href=u;a.target='_blank';a.rel='noopener noreferrer';a.textContent=t+' ↗';row.appendChild(a);});return row;}
/* Notes coverage (v34): each spec point may carry cov={s:'c'|'p'|'m', r:[[topicTitle,heading]], g:'what is missing'} */
const COV_LABEL={c:'covered',p:'partly covered',m:'not in your notes'};
function openNoteRef(subject,ref){const list=NOTES[subject]||[];const i=list.findIndex(t=>t&&t.title===ref[0]);if(i<0){alert('That note section could not be found.');return;}openNotesAt(subject,i);const si=(list[i].sections||[]).findIndex(x=>x&&x.heading===ref[1]);if(si>=0){const el=document.getElementById('note-sec-'+subject+'-'+i+'-'+si);if(el)setTimeout(()=>el.scrollIntoView({block:'start'}),60);}}
function covLine(subject,p){const c=p.cov;const line=mkEl('div','spec-cov cov-'+c.s);line.appendChild(mkEl('span','cov-tag',(c.s==='c'?'✓':c.s==='p'?'½':'✗')+' Notes: '+COV_LABEL[c.s]));if(c.g)line.appendChild(mkEl('span','cov-gap',' · '+c.g));
  (c.r||[]).slice(0,2).forEach(ref=>{const b=mkEl('button','link-btn cov-link','Open: '+ref[0].replace(/^OCR A H\d+ — |^Save My Exams Supplement — /,'')+(ref[1]?' › '+ref[1]:''));b.type='button';b.addEventListener('click',()=>openNoteRef(subject,ref));line.appendChild(b);});return line;}
function covCounts(subject){const pts=(SPECS[subject]&&SPECS[subject].points)||[];const c={c:0,p:0,m:0,n:0};pts.forEach(p=>{c[p.cov?p.cov.s:'n']++;});return c;}
function specAvailable(){return typeof SPECS==='object'&&SPECS&&Object.keys(SPECS).length>0;}
function specCounts(subject,filterFn){const pts=(SPECS[subject]&&SPECS[subject].points)||[];const c={r:0,a:0,g:0,u:0,total:0};pts.forEach(p=>{if(filterFn&&!filterFn(p))return;c.total++;const v=specRag[subject+'|'+p.code];c[v||'u']++;});return c;}
function setRag(subject,code,v){const k=subject+'|'+code;if(specRag[k]===v)delete specRag[k];else specRag[k]=v;lsSet(SPECRAG_KEY,JSON.stringify(specRag));}
function ragBar(c){const bar=mkEl('div','rag-bar');[['g','rag-g'],['a','rag-a'],['r','rag-r'],['u','rag-u']].forEach(([k,cls])=>{if(!c[k])return;const s=mkEl('span',cls);s.style.flex=String(c[k]);bar.appendChild(s);});return bar;}
function specSearch(point){const terms=keyTerms(point).filter(t=>!/\d/.test(t)).slice(0,2);openGlobalSearch();const i=document.getElementById('globalSearchInput');if(i){i.value=terms.join(' ')||point.split(' ').slice(0,2).join(' ');renderGlobalSearch(i.value);}}
function renderSpec(){
  const box=document.getElementById('specBody');if(!box)return;box.textContent='';
  if(!specAvailable()){box.appendChild(mkEl('div','empty-state','Specification checklists are not loaded.'));return;}
  const subs=Object.keys(SPECS);if(!subs.includes(specSubject))specSubject=subs[0];
  const tabs=segButtons(subs,specSubject,v=>{specSubject=v;renderSpec();});tabs.classList.add('seg-wide');box.appendChild(tabs);
  const S=SPECS[specSubject],c=specCounts(specSubject);
  const sum=mkEl('div','insight-card');sum.appendChild(mkEl('div','checkin-title',S.title));sum.appendChild(ragBar(c));
  const legend=mkEl('div','rag-legend');[['✓ Confident',c.g,'rag-tg'],['~ Shaky',c.a,'rag-ta'],['✗ Not yet',c.r,'rag-tr'],['Unrated',c.u,'']].forEach(([l,n,cls])=>legend.appendChild(mkEl('span',cls,l+' '+n)));sum.appendChild(legend);
  sum.appendChild(mkEl('p','insight-note','Source: '+S.source+'. Points are short paraphrases of the official learning outcomes, so check the spec itself for exact wording.'));
  if(S.points.some(p=>p.cov)){const cc=covCounts(specSubject),tot=cc.c+cc.p+cc.m;sum.appendChild(mkEl('div','metric-label','YOUR NOTES COVER'));const bar=mkEl('div','rag-bar');[['c','rag-g'],['p','rag-a'],['m','rag-r']].forEach(([k,cls])=>{if(!cc[k])return;const sp=mkEl('span',cls);sp.style.flex=String(cc[k]);bar.appendChild(sp);});sum.appendChild(bar);const lg=mkEl('div','rag-legend');[['✓ Fully '+cc.c,'rag-tg'],['½ Partly '+cc.p,'rag-ta'],['✗ Missing '+cc.m,'rag-tr']].forEach(([l,cls])=>lg.appendChild(mkEl('span',cls,l)));sum.appendChild(lg);const filled=S.points.filter(p=>p.cov&&p.cov.f).length;sum.appendChild(mkEl('p','insight-note',(filled?filled+' points were filled in v35 with "Spec completion" notes (at the end of '+specSubject+' notes) — tap a point\'s note link to read it. ':'')+'Coverage was judged by AI ('+Math.round(cc.c/tot*100)+'% fully covered) and the new notes were written and fact-checked by AI, so check anything surprising against your textbook.'));}box.appendChild(sum);
  const ft=segButtons(['all','u','r','a','g'],specFilter,v=>{specFilter=v;renderSpec();},v=>({all:'All',u:'Unrated',r:'✗ Red',a:'~ Amber',g:'✓ Green'})[v]);ft.classList.add('seg-wide');box.appendChild(ft);
  if(S.points.some(p=>p.cov&&p.cov.s!=='c')||specGapsOnly){const gl=mkEl('label','iv-warn spec-gaps');const gc=document.createElement('input');gc.type='checkbox';gc.checked=specGapsOnly;gc.addEventListener('change',()=>{specGapsOnly=gc.checked;renderSpec();});gl.append(gc,document.createTextNode(' Only points your notes miss or only partly cover'));box.appendChild(gl);}
  const keep=p=>{const v=specRag[specSubject+'|'+p.code];return (specFilter==='all'||(specFilter==='u'?!v:v===specFilter))&&(!specGapsOnly||(p.cov&&p.cov.s!=='c'));};
  const mods=[];S.points.forEach(p=>{let m=mods.find(x=>x.name===p.module);if(!m){m={name:p.module,topics:[]};mods.push(m);}let t=m.topics.find(x=>x.name===p.topic);if(!t){t={name:p.topic,points:[]};m.topics.push(t);}t.points.push(p);});
  let shown=0;
  mods.forEach(m=>{const pts=m.topics.flatMap(t=>t.points).filter(keep);if(!pts.length)return;shown+=pts.length;
    const d=document.createElement('details');d.className='spec-mod';const okey=specSubject+'|'+m.name;d.open=!!specOpen[okey];
    const s=document.createElement('summary');const mc=specCounts(specSubject,p=>p.module===m.name);s.append(mkEl('span','spec-mod-name',m.name),mkEl('span','spec-mod-count',mc.g+'/'+mc.total+' ✓'));d.appendChild(s);d.appendChild(ragBar(mc));
    const fill=()=>{if(d.dataset.filled)return;d.dataset.filled='1';const ml=moduleLinks(specSubject,m.name);if(ml.length)d.appendChild(extLinkRow('Practise online:',ml));m.topics.forEach(t=>{const tp=t.points.filter(keep);if(!tp.length)return;d.appendChild(mkEl('div','spec-topic',t.name));if(specSubject==='Maths'){const u=mathsTopicLink(m.name,t.name);if(u)d.appendChild(extLinkRow('',[['PMT topic questions & mark schemes',u]]));}tp.forEach(p=>{const row=mkEl('div','spec-row');const txt=mkEl('div','spec-text');txt.append(mkEl('span','spec-code',p.code),document.createTextNode(' '+p.point));if(p.cov)txt.appendChild(covLine(specSubject,p));const nq=specQuestionCount(specSubject,p.code);if(nq){const qb=mkEl('button','link-btn spec-q','Practise '+nq+' question'+(nq>1?'s':''));qb.type='button';qb.addEventListener('click',()=>startQuizOn(specSubject,'spec:'+specSubject+'|'+p.code));const ql=mkEl('div','spec-qline');ql.appendChild(qb);txt.appendChild(ql);}row.appendChild(txt);
      const btns=mkEl('div','spec-btns');[['r','✗','Not yet'],['a','~','Shaky'],['g','✓','Confident']].forEach(([v,sym,lab])=>{const b=mkEl('button','rag-btn rag-'+v,sym);b.type='button';b.title=lab;b.setAttribute('aria-label',lab+': '+p.code);const on=specRag[specSubject+'|'+p.code]===v;b.setAttribute('aria-pressed',on?'true':'false');if(on)b.classList.add('on');b.addEventListener('click',()=>{setRag(specSubject,p.code,v);btns.querySelectorAll('.rag-btn').forEach(x=>{const xv=x.classList.contains('rag-r')?'r':x.classList.contains('rag-a')?'a':'g';const o=specRag[specSubject+'|'+p.code]===xv;x.classList.toggle('on',o);x.setAttribute('aria-pressed',o?'true':'false');});const nc=specCounts(specSubject,q=>q.module===m.name);s.querySelector('.spec-mod-count').textContent=nc.g+'/'+nc.total+' ✓';const ob=d.querySelector('.rag-bar');if(ob)ob.replaceWith(ragBar(nc));const tc=specCounts(specSubject);const sb=sum.querySelector('.rag-bar');if(sb)sb.replaceWith(ragBar(tc));const lg=sum.querySelector('.rag-legend');if(lg){const sp=lg.querySelectorAll('span');[tc.g,tc.a,tc.r,tc.u].forEach((n,i)=>{sp[i].textContent=sp[i].textContent.replace(/\d+$/,String(n));});}});btns.appendChild(b);});
      const f=mkEl('button','rag-btn rag-find','🔎');f.type='button';f.title='Find in notes';f.setAttribute('aria-label','Find in notes: '+p.code);f.addEventListener('click',()=>specSearch(p.point));btns.appendChild(f);row.appendChild(btns);d.appendChild(row);});});};
    if(d.open)fill();d.addEventListener('toggle',()=>{specOpen[okey]=d.open;if(d.open)fill();});box.appendChild(d);});
  if(!shown)box.appendChild(mkEl('div','empty-state','Nothing matches this filter.'));
}
function topRedSpec(subject){if(!specAvailable())return null;const subs=subject&&SPECS[subject]?[subject]:Object.keys(SPECS);for(const s of subs){const p=SPECS[s].points.find(x=>specRag[s+'|'+x.code]==='r');if(p)return {subject:s,p,count:SPECS[s].points.filter(x=>specRag[s+'|'+x.code]==='r').length};}return null;}

/* ---------- 6. Combo caller (boxing rounds) ---------- */
const COMBOS={2.5:['1','1, 2','1, 1, 2','2, 3, 2','1, 2, 3','slip, 2','1, 2, roll','3, 2','double jab','1, 6, 3'],3.5:['1, 2','1, 2, 3, 2','1, 1, 2','2, 3, 2','1, 2, slip, 2','1, 6, 3, 2','3, 2, 3','1, 2, roll, 2, 3','jab, step back, 2','body 3, head 3','5, 2','1, 2, 5, 2','6, 3, 2','pivot, 2'],5:['1, 2, 3, 2','1, 1, 2, roll, 2','1, 2, slip, 2, 3, 2','body 3, head 3, 2','1, 6, 3, 2, roll','2, 3, 2, pivot','jab to the body, 2 to the head','1, 2, 3, roll, 3, 2','double jab, 2, 3']};
let comboLast='';
function comboSay(text){const el=document.getElementById('ivCombo');if(el)el.textContent=text;try{if('speechSynthesis' in window&&typeof SpeechSynthesisUtterance!=='undefined'){window.speechSynthesis.cancel();const u=new SpeechSynthesisUtterance(text.replace(/\b1\b/g,'one').replace(/\b2\b/g,'two').replace(/\b3\b/g,'three').replace(/\b4\b/g,'four').replace(/\b5\b/g,'five').replace(/\b6\b/g,'six'));u.rate=1.15;u.lang='en-GB';window.speechSynthesis.speak(u);}}catch(e){}}
function comboClear(){const el=document.getElementById('ivCombo');if(el)el.textContent='';try{if('speechSynthesis' in window)window.speechSynthesis.cancel();}catch(e){}}
function comboTick(ph,idx,left){
  if(!iv||!ivCfg.combos||ph.type!=='round'||left<=3)return;
  const now=Date.now(),phaseStart=iv.startAt+iv.starts[idx]*1000;
  if(iv.comboIdx!==idx){iv.comboIdx=idx;iv.nextCombo=phaseStart+2500;}
  if(now>=iv.nextCombo){const list=COMBOS[ivCfg.comboPace]||COMBOS[3.5];let c=list[Math.floor(Math.random()*list.length)];if(c===comboLast&&list.length>1)c=list[(list.indexOf(c)+1)%list.length];comboLast=c;comboSay(c);iv.nextCombo=now+ivCfg.comboPace*1000*(0.8+Math.random()*0.4);}
}

/* ---------- 7. Fight camp ---------- */
function normalizeCamp(v){if(!v||typeof v!=='object'||Array.isArray(v))return null;if(!ISO_RE.test(v.fightDate||''))return null;const w=ISO_RE.test(v.weighInDate||'')&&v.weighInDate<=v.fightDate?v.weighInDate:addDaysISO(v.fightDate,-1);const lim=v.limitKg===null||v.limitKg===''||v.limitKg===undefined?null:clampNum(v.limitKg,25,300,0.1);return {name:typeof v.name==='string'&&v.name.trim()?v.name.trim().slice(0,60):'Fight',fightDate:v.fightDate,weighInDate:w,limitKg:lim===null?null:Math.round(lim*10)/10};}
let camp=normalizeCamp(safeReadJSON(CAMP_KEY,null));
const CAMP_PHASES=[{id:'base',label:'Base',from:57,text:'Build general fitness and strength. Plenty of technical work, controlled volume.'},{id:'build',label:'Build',from:29,text:'More fight-specific conditioning and sparring. Strength work stays, volume starts to shift to boxing.'},{id:'peak',label:'Peak',from:15,text:'Hardest sparring and highest intensity. Protect sleep and recovery.'},{id:'taper',label:'Taper',from:8,text:'Cut volume, keep sharpness. Fewer, quality rounds.'},{id:'week',label:'Fight week',from:0,text:'Stay sharp and fresh. Light pads, rest, weight managed as agreed with your coach.'}];
function campPhase(days){if(days<0)return null;return CAMP_PHASES.find(p=>days>=p.from)||CAMP_PHASES[CAMP_PHASES.length-1];}
function saveCamp(){const g=id=>document.getElementById(id).value;const lim=g('campLimit').trim();if(lim!==''&&!inRange(lim,25,300)){alert('Weight limit must be 25–300 kg, or blank.');return;}const c=normalizeCamp({name:g('campName'),fightDate:g('campFight'),weighInDate:g('campWeigh'),limitKg:lim===''?null:Number(lim)});if(!c){alert('Choose the fight date.');return;}if(daysUntil(c.fightDate)<0){alert('That date has passed.');return;}camp=c;lsSet(CAMP_KEY,JSON.stringify(camp));renderCamp();}
function clearCamp(){if(!confirm('Clear this fight camp?'))return;camp=null;try{localStorage.removeItem(CAMP_KEY);}catch(e){}renderCamp();}
function renderCamp(){
  const box=document.getElementById('campBody');if(!box)return;box.textContent='';
  const editing=!camp||box.dataset.edit==='1';
  if(camp&&!editing){
    const d=daysUntil(camp.fightDate),ph=campPhase(d);
    const hero=mkEl('div','insight-card camp-hero');hero.append(mkEl('div','metric-label',camp.name.toUpperCase()),mkEl('div','camp-days',d<0?'Done':d===0?'Fight day':String(d)),mkEl('div','insight-note',d>0?'days to go · '+fmtShortDate(camp.fightDate)+' · weigh-in '+fmtShortDate(camp.weighInDate):''));
    const tl=mkEl('div','camp-timeline');CAMP_PHASES.forEach(p=>{const seg=mkEl('div','camp-seg'+(ph&&ph.id===p.id?' on':''),p.label);tl.appendChild(seg);});hero.appendChild(tl);
    if(ph)hero.appendChild(mkEl('p','insight-note','Now: '+ph.label+'. '+ph.text+' Agree the specifics with your coach.'));box.appendChild(hero);
    if(camp.limitKg){const card=mkEl('div','insight-card');card.appendChild(mkEl('div','checkin-title','Making weight · limit '+fmtNum(camp.limitKg)+' kg'));
      const last=body.entries[body.entries.length-1];
      if(!last)card.appendChild(mkEl('p','insight-note','Log your weight in Body & food and this shows how you are tracking.'));
      else{const fresh=avgWeight(localISODate(),7),cur=fresh!==null?fresh:last.kg,over=cur-camp.limitKg,wd=daysUntil(camp.weighInDate);
        if(fresh===null)card.appendChild(mkEl('p','insight-note warn-note','No weigh-in in the last 7 days (last: '+fmtNum(last.kg)+' kg on '+fmtShortDate(last.date)+'). Log a fresh one in Body & food for an accurate plan.'));
        card.appendChild(mkEl('p','insight-note',(fresh!==null?'7-day average ':'Last weigh-in ')+fmtNum(cur)+' kg · '+(over>0?fmtNum(over,1)+' kg over the limit':'at or under the limit')+'.'));
        if(over>0&&wd>0){const per=over/(wd/7),pct=per/cur*100;card.appendChild(mkEl('p','insight-note'+(pct>1?' warn-note':''),'Needs about '+fmtNum(per,2)+' kg a week ('+fmtNum(pct)+'% of bodyweight) to reach the limit by weigh-in.'+(pct>1?' That is faster than the ~0.5–1% a week usually advised. Talk to your coach now about the plan or the weight class.':'')));}
        card.appendChild(mkEl('p','insight-note','Make weight gradually through food, not by dehydrating. Rapid weight cutting is dangerous and many boxing bodies restrict it; follow your coach and your governing body’s rules.'));}
      const use=mkEl('button','small-action','Use as my bodyweight target');use.type='button';use.addEventListener('click',()=>{body.target={kg:camp.limitKg,date:camp.weighInDate};persistBody();use.textContent='Target set ✓';use.disabled=true;});card.appendChild(use);box.appendChild(card);}
    const acts=mkEl('div','row-actions');const e=mkEl('button','','Edit camp');e.type='button';e.addEventListener('click',()=>{box.dataset.edit='1';renderCamp();});const c=mkEl('button','','Clear');c.type='button';c.addEventListener('click',clearCamp);acts.append(e,c);box.appendChild(acts);return;}
  const f=mkEl('div','form-panel');f.innerHTML='<h3 style="margin:0 0 8px;font-size:14px">'+(camp?'Edit fight camp':'Set up a fight camp')+'</h3>'+
    '<div class="field"><label for="campName">Event</label><input id="campName" maxlength="60" placeholder="Club show, regional final…"></div>'+
    '<div class="pp-grid"><div class="field"><label for="campFight">Fight date</label><input id="campFight" type="date"></div><div class="field"><label for="campWeigh">Weigh-in</label><input id="campWeigh" type="date"></div></div>'+
    '<div class="field"><label for="campLimit">Weight limit kg (optional)</label><input id="campLimit" type="number" inputmode="decimal" step="0.1" min="25" max="300"></div>'+
    '<div class="checkin-acts"><button class="btn btn-primary" type="button" onclick="saveCamp()">Save camp</button>'+(camp?'<button type="button" onclick="document.getElementById(\'campBody\').dataset.edit=\'0\';renderCamp()">Cancel</button>':'')+'</div>';
  box.appendChild(f);delete box.dataset.edit;
  const g=id=>document.getElementById(id);g('campFight').min=localISODate();if(camp){g('campName').value=camp.name;g('campFight').value=camp.fightDate;g('campWeigh').value=camp.weighInDate;g('campLimit').value=camp.limitKg===null?'':camp.limitKg;}
  box.appendChild(mkEl('p','system-note','Phases: Base (8+ weeks out), Build (4–8), Peak (2–4), Taper (1–2), Fight week. They are a general outline, not a prescription.'));
}

/* ---------- 8. Share backup ---------- */
function buildBackupJSON(){const data={format:'bridge-protocol-backup',version:1,exportedAt:new Date().toISOString(),appVersion:'v38',data:{}};for(let i=0;i<localStorage.length;i++){const key=localStorage.key(i);if(key&&key.startsWith('bp_')){try{data.data[key]=JSON.parse(localStorage.getItem(key));}catch(e){data.data[key]=localStorage.getItem(key);}}}data.data[TASKS_KEY]=tasks;data.data[PROJECTS_KEY]=projects;return JSON.stringify(data,null,2);}
function shareBackup(){
  const name='bridge-protocol-backup-'+localISODate()+'.txt';let file=null;try{file=new File([buildBackupJSON()],name,{type:'text/plain'});}catch(e){}
  if(file&&navigator.canShare&&navigator.canShare({files:[file]})){navigator.share({files:[file],title:'Bridge Protocol backup'}).then(()=>{lsSet(LAST_BACKUP_KEY,new Date().toISOString());renderBackupNudge();refreshDataStatus();}).catch(e=>{if(!e||e.name!=='AbortError'){alert('Sharing failed, so the backup will download instead.');exportBackup();}});}
  else{alert('This browser cannot share files, so the backup will download instead.');exportBackup();}
}

/* ---------- 9. Swipe between section tabs ---------- */
(function(){let sx=0,sy=0,st=0,ok=false;const main=document.querySelector('main')||document.body;
  main.addEventListener('touchstart',e=>{if(e.touches.length!==1){ok=false;return;}const t=e.target;ok=!(t.closest&&t.closest('input,textarea,select,.hub-tabs,.chip-row,.chart,.coach-chips,.seg,table,.iv-fields,.ql-grid,.fc-rate,.subject-tabs,.training-tabs,.calendar-grid,[data-noswipe]'));sx=e.touches[0].clientX;sy=e.touches[0].clientY;st=Date.now();},{passive:true});
  main.addEventListener('touchend',e=>{if(!ok||!currentView)return;const t=e.changedTouches[0],dx=t.clientX-sx,dy=t.clientY-sy;if(Date.now()-st>600||Math.abs(dx)<70||Math.abs(dy)>45||Math.abs(dx)<Math.abs(dy)*2)return;const hub=hubOf(currentView),i=hub.views.indexOf(currentView),j=dx<0?i+1:i-1;if(j>=0&&j<hub.views.length)showView(hub.views[j]);},{passive:true});
})();

/* ---------- 10. Weekly report ---------- */
function weeklyReportData(){
  const to=localISODate(),from=weekAgoISO(),rows=[];
  const sm=studyMinutes(from,to),st=Object.values(sm).reduce((a,b)=>a+b,0);rows.push(['Study time',fmtMins(st)+(st?' (Chem '+fmtMins(sm.Chemistry)+', Bio '+fmtMins(sm.Biology)+', Maths '+fmtMins(sm.Maths)+(sm.Other?', other '+fmtMins(sm.Other):'')+')':'')]);
  rows.push(['Tasks completed',String(tasks.filter(t=>t.status==='done'&&isoToLocalDate(t.updated)>=from&&isoToLocalDate(t.updated)<=to).length)]);
  const qt=Object.entries(qStats.topics).filter(([,t])=>isoToLocalDate(t.last)>=from);rows.push(['Quiz topics practised',qt.length?qt.length+' (average '+Math.round(qt.reduce((a,[,t])=>a+topicStrength(t),0)/qt.length*100)+'%)':'0']);
  let rev=0;const rv=(cardState.meta&&cardState.meta.reviews)||{};Object.keys(rv).forEach(d=>{if(d>=from&&d<=to)rev+=rv[d];});rows.push(['Flashcards reviewed',String(rev)]);
  const pw=papers.filter(p=>p.date>=from&&p.date<=to);rows.push(['Past papers',pw.length?pw.length+' (average '+Math.round(pw.reduce((a,p)=>a+paperPct(p),0)/pw.length)+'%)':'0']);
  if(specAvailable())rows.push(['Spec points confident',Object.keys(SPECS).map(s=>{const c=specCounts(s);return s+' '+c.g+'/'+c.total;}).join(', ')]);
  rows.push(['Mistakes to fix',String(Object.keys(mistakes).length)]);
  const wd=new Set(workoutLog.filter(w=>w.date>=from&&w.date<=to).map(w=>w.date));rows.push(['Training days logged',String(wd.size)]);
  const ci=Object.keys(checkins).filter(k=>k>=from&&k<=to).map(k=>checkins[k]);rows.push(['Sleep',ci.length?'average '+fmtNum(ci.reduce((a,c)=>a+c.sleep,0)/ci.length)+' h over '+ci.length+' check-in'+(ci.length===1?'':'s'):'no check-ins']);
  const last=body.entries[body.entries.length-1];if(last){const a=avgWeight(last.date,7),p=avgWeight(addDaysISO(last.date,-7),7);rows.push(['Bodyweight (7-day avg)',fmtNum(a)+' kg'+(p!==null?' ('+(a-p>0?'+':'')+fmtNum(a-p,2)+' kg vs previous week)':'')]);}
  if(camp&&daysUntil(camp.fightDate)>=0)rows.push(['Fight camp',daysUntil(camp.fightDate)+' days to '+camp.name]);
  const ex=upcomingExams()[0];if(ex)rows.push(['Next exam',ex.name+' in '+daysUntil(ex.date)+' days']);
  return {title:'Weekly report · '+fmtShortDate(from)+' – '+fmtShortDate(to),rows};
}
function renderWeeklyReport(){const box=document.getElementById('weeklyReport');if(!box)return;box.textContent='';const r=weeklyReportData();const card=mkEl('div','insight-card report-card');card.appendChild(mkEl('div','checkin-title',r.title));const t=document.createElement('table');t.className='report-table';r.rows.forEach(([k,v])=>{const tr=document.createElement('tr');tr.append(mkEl('th','',k),mkEl('td','',v));t.appendChild(tr);});card.appendChild(t);
  const acts=mkEl('div','checkin-acts no-print');const sh=mkEl('button','btn btn-primary','Share');sh.type='button';sh.addEventListener('click',shareWeeklyReport);const pr=mkEl('button','','Save as PDF / print');pr.type='button';pr.addEventListener('click',()=>{document.body.classList.add('printing-report');const done=()=>{document.body.classList.remove('printing-report');window.removeEventListener('afterprint',done);};window.addEventListener('afterprint',done);window.print();setTimeout(done,60000);});acts.append(sh,pr);card.appendChild(acts);box.appendChild(card);}
function shareWeeklyReport(){const r=weeklyReportData(),text=r.title+'\n'+r.rows.map(([k,v])=>k+': '+v).join('\n');if(navigator.share){navigator.share({title:r.title,text}).catch(()=>{});}else if(navigator.clipboard){navigator.clipboard.writeText(text).then(()=>alert('Report copied. Paste it into a message.'),()=>alert(text));}else alert(text);}
/* ===================== end v33 features ===================== */

/* ===================== Navigation (v32): hubs, section tabs, history-aware routing ===================== */
const HUBS=[
  {id:'home', label:'Home', icon:'⌂', views:['command','coach','weekly']},
  {id:'plan', label:'Plan', icon:'☑', views:['tasks','planner','projects','habits','schedule']},
  {id:'study',label:'Study',icon:'✎', views:['notes','cards','test','blurt','mistakes','spec','exams']},
  {id:'train',label:'Train',icon:'🥊',views:['training','timer','progress','macros','camp','checklist']},
  {id:'more', label:'More', icon:'☰', views:['lifeos','system']}
];
const VIEW_LABELS={command:'Today',coach:'Coach',weekly:'Weekly review',tasks:'Tasks',planner:'Calendar',projects:'Projects',habits:'Habits',schedule:'Week plan',notes:'Notes',cards:'Flashcards',test:'Quiz',exams:'Exams & papers',blurt:'Blurt',mistakes:'Mistakes',spec:'Spec checklist',camp:'Fight camp',training:'Training',timer:'Timer',progress:'Progress',macros:'Body & food',checklist:'Tendon check',lifeos:'Life OS',system:'Settings'};
const APP_VIEWS = HUBS.flatMap(h=>h.views);
const PRIMARY_NAV_VIEWS = HUBS.filter(h=>h.id!=='more').flatMap(h=>h.views);
const hubLast={};const viewScroll={};
let currentView=null,pendingNav=null,overlayClosing=false;
function hubOf(view){return HUBS.find(h=>h.views.includes(view))||HUBS[0];}
function overlayIsOpen(){const m=document.getElementById('sectionMenuBackdrop'),s=document.getElementById('globalSearchBackdrop'),mu=document.getElementById('musicBackdrop');return !!((m&&!m.classList.contains('hidden'))||(s&&!s.classList.contains('hidden'))||(mu&&!mu.classList.contains('hidden')));}
function hideOverlays(){closeSectionMenu();closeGlobalSearch();if(typeof closeMusic==='function')closeMusic();}
function navState(){try{return history.state||null;}catch(e){return null;}}
// Every overlay pushes one history entry, so the Android back gesture closes it instead of leaving the app.
function pushOverlayState(kind){try{const st=navState();if(st&&st.overlay)history.replaceState({view:currentView,overlay:kind},'');else history.pushState({view:currentView,overlay:kind},'');}catch(e){}}
function closeOverlay(then){
  const st=navState();
  if(overlayClosing)return;
  if(st&&st.overlay&&overlayIsOpen()){pendingNav=then||null;overlayClosing=true;setTimeout(()=>{overlayClosing=false;},800);try{history.back();return;}catch(e){overlayClosing=false;}}
  hideOverlays();if(then)then();
}
function openSectionMenu(){const backdrop=document.getElementById('sectionMenuBackdrop'),btn=document.getElementById('nav-more');if(!backdrop)return;closeGlobalSearch();if(typeof closeMusic==='function')closeMusic();backdrop.classList.remove('hidden');backdrop.setAttribute('aria-hidden','false');if(btn)btn.setAttribute('aria-expanded','true');const search=document.getElementById('sectionMenuSearch');filterSectionMenu('');if(search){search.value='';}pushOverlayState('menu');}
function closeSectionMenu(){const backdrop=document.getElementById('sectionMenuBackdrop'),btn=document.getElementById('nav-more');if(backdrop){backdrop.classList.add('hidden');backdrop.setAttribute('aria-hidden','true');}if(btn)btn.setAttribute('aria-expanded','false');}
function navigateFromMenu(name){closeOverlay(()=>showView(name));}
function filterSectionMenu(value){const q=String(value||'').trim().toLowerCase();let shown=0;document.querySelectorAll('.section-menu-item').forEach(item=>{const match=!q||(item.dataset.menuLabel||'').toLowerCase().includes(q)||item.textContent.toLowerCase().includes(q);item.hidden=!match;if(match)shown++;});document.querySelectorAll('.section-menu-group').forEach(group=>{group.hidden=!Array.from(group.querySelectorAll('.section-menu-item')).some(item=>!item.hidden)});const empty=document.getElementById('sectionMenuEmpty');if(empty)empty.style.display=shown?'none':'block';}
document.addEventListener('keydown',event=>{if(event.key==='Escape'&&overlayIsOpen()){closeOverlay();}if((event.ctrlKey||event.metaKey)&&event.shiftKey&&event.key.toLowerCase()==='f'){event.preventDefault();openGlobalSearch();return;}if((event.ctrlKey||event.metaKey)&&event.key.toLowerCase()==='k'){event.preventDefault();openSectionMenu();}});
let globalSearchTimer=null;
let gsCache=null; // v36: search index built once per opening (815 questions made per-keystroke rebuilds slow)
function openGlobalSearch(){gsCache=null;if(typeof closeMusic==='function')closeMusic();const warm=()=>{if(!gsCache&&!document.getElementById('globalSearchBackdrop').classList.contains('hidden'))gsCache=globalSearchRecords().map(r=>{r.hay=(r.title+' '+r.group+' '+r.detail).toLocaleLowerCase();return r;});};if('requestIdleCallback' in window)requestIdleCallback(warm,{timeout:250});else setTimeout(warm,60);closeSectionMenu();const back=document.getElementById('globalSearchBackdrop');if(!back)return;back.classList.remove('hidden');back.setAttribute('aria-hidden','false');pushOverlayState('search');const input=document.getElementById('globalSearchInput');if(input){input.value='';renderGlobalSearch('');window.setTimeout(()=>input.focus({preventScroll:true}),30);}}
function closeGlobalSearch(){gsCache=null;const back=document.getElementById('globalSearchBackdrop');if(back){back.classList.add('hidden');back.setAttribute('aria-hidden','true');}if(globalSearchTimer!==null){window.clearTimeout(globalSearchTimer);globalSearchTimer=null;}}
function goHub(id){
  const hub=HUBS.find(h=>h.id===id);if(!hub)return;
  if(id==='more'){openSectionMenu();return;}
  if(currentView&&hubOf(currentView).id===id){if(currentView!==hub.views[0])showView(hub.views[0]);else window.scrollTo({top:0,behavior:'smooth'});return;}
  showView(hubLast[id]||hub.views[0],{restoreScroll:true});
}
function renderHubTabs(){
  const box=document.getElementById('hubTabs');if(!box||!currentView)return;const hub=hubOf(currentView);
  if(box.dataset.hub!==hub.id){box.textContent='';box.dataset.hub=hub.id;box.style.scrollBehavior='auto';box.scrollLeft=0;
    hub.views.forEach(v=>{const b=document.createElement('button');b.type='button';b.className='hub-tab';b.id='hubtab-'+v;b.setAttribute('role','tab');b.textContent=VIEW_LABELS[v]||v;b.addEventListener('click',()=>showView(v));box.appendChild(b);});}
  box.querySelectorAll('.hub-tab').forEach(b=>{const on=b.id==='hubtab-'+currentView;b.classList.toggle('active',on);b.setAttribute('aria-selected',on?'true':'false');if(on){const l=b.offsetLeft-box.offsetLeft,r=l+b.offsetWidth;if(l<box.scrollLeft||r>box.scrollLeft+box.clientWidth)box.scrollLeft=Math.max(0,l-16);}});box.style.scrollBehavior='';
}
function showView(name,opts){
  opts=opts||{};
  if(!APP_VIEWS.includes(name)) return;
  if(currentView)viewScroll[currentView]=window.scrollY||0;
  hideOverlays();
  const hub=hubOf(name);
  APP_VIEWS.forEach(v=>{const view=document.getElementById('view-'+v);if(view)view.classList.toggle('hidden',v!==name);});
  HUBS.forEach(h=>{const nav=document.getElementById('nav-'+h.id);if(nav){const on=h.id===hub.id;nav.classList.toggle('tab-active',on);if(on)nav.setAttribute('aria-current','page');else nav.removeAttribute('aria-current');}});
  document.querySelectorAll('.section-menu-item').forEach(item=>{const match=(item.getAttribute('onclick')||'').includes("'"+name+"'");if(match)item.setAttribute('aria-current','page');else item.removeAttribute('aria-current');});
  const more=document.getElementById('nav-more');if(more)more.setAttribute('aria-expanded','false');
  const changed=currentView!==name;currentView=name;hubLast[hub.id]=name;renderHubTabs();
  try{document.title=(VIEW_LABELS[name]||'Bridge Protocol')+' · Bridge Protocol';}catch(e){}
  if(!opts.fromHistory){try{if(opts.replace)history.replaceState({view:name},'','#/'+name);else if(changed)history.pushState({view:name},'','#/'+name);}catch(e){}}
  if(name==='command') renderCommandCentre();
  if(name==='notes'&&!notesDrawn) renderNotes();
  if(name==='test'&&!currentQ) newQuestion();
  if(name==='checklist'&&!checklistDrawn) renderChecklist();
  if(name==='coach') renderCoachView();
  if(name==='tasks') renderTasks();
  if(name==='projects') renderProjects();
  if(name==='planner') renderPlanner();
  if(name==='habits') renderHabits();
  if(name==='weekly') renderWeeklyReview();
  if(name==='schedule') renderSchedule();
  if(name==='training'){showTrainingPanel('plan');if(!document.getElementById('workoutDate').value)document.getElementById('workoutDate').value=localISODate();updateWillieMapping();}
  if(name==='timer') renderFocusTaskOptions();
  if(name==='system'){refreshDataStatus();renderAppearance();}
  if(name==='lifeos') lifeRenderAll();
  if(name==='cards'&&typeof renderCards==='function') renderCards();
  if(name==='exams'&&typeof renderExamsView==='function') renderExamsView();
  if(name==='progress'&&typeof renderProgress==='function') renderProgress();
  if(name==='macros'&&typeof renderBodyweight==='function') renderBodyweight();
  if(name==='blurt') renderBlurt();
  if(name==='mistakes') renderMistakes();
  if(name==='spec') renderSpec();
  if(name==='camp') renderCamp();
  if(name==='training') renderQuickLog();
  if(name==='timer'){renderStudyTime();const fs=document.getElementById('focusSubject');if(fs&&!fs.dataset.touched)fs.value=defaultStudySubject();}
  if(name==='weekly'){renderStudyTime();renderWeeklyReport();}
  window.scrollTo(0,(opts.fromHistory||opts.restoreScroll)?(viewScroll[name]||0):0);
}
window.addEventListener('popstate',e=>{
  overlayClosing=false;
  if(overlayIsOpen()){hideOverlays();const f=pendingNav;pendingNav=null;if(f)f();return;}
  pendingNav=null;
  const st=e.state;const v=(st&&st.view)||((location.hash.match(/^#\/(\w+)/)||[])[1])||'command';
  if(APP_VIEWS.includes(v)&&v!==currentView)showView(v,{fromHistory:true});
});
function startViewFromHash(){const v=((location.hash||'').match(/^#\/(\w+)/)||[])[1];return APP_VIEWS.includes(v)?v:'command';}
/* ===================== end navigation ===================== */
function scheduleGlobalSearch(value){if(globalSearchTimer!==null)window.clearTimeout(globalSearchTimer);globalSearchTimer=window.setTimeout(()=>{globalSearchTimer=null;renderGlobalSearch(value);},75);}
function globalSearchRecords(){
 const records=[];const add=(view,group,title,detail,open)=>records.push({view,group,title:String(title||'Untitled'),detail:String(detail||''),open});
 (tasks||[]).forEach(t=>add('tasks','Tasks',t.title,[t.notes,t.status,t.due?'Due '+t.due:'',taskProjectName(t.projectId)].filter(Boolean).join(' · '),()=>{showView('tasks');if(t.status==='done')setTaskFilter('done');else setTaskFilter('all');}));
 (projects||[]).forEach(p=>add('projects','Projects',p.title,[p.description,p.status,p.target?'Target '+p.target:''].filter(Boolean).join(' · '),()=>{showView('projects');}));
 (habits||[]).forEach(h=>add('habits','Habits',h.title,[h.area,h.cadence].filter(Boolean).join(' · '),()=>showView('habits')));
 (workoutLog||[]).forEach(w=>add('training','Training log',w.exercise,[w.date,w.type,w.notes,w.reps].filter(Boolean).join(' · '),()=>showView('training')));
 (customNotes||[]).forEach(n=>add('notes','My notes',n.title||'Untitled note',String(n.body||'').slice(0,240),()=>{notesSubject='Custom';try{localStorage.setItem('bp_notesSubject',notesSubject);}catch(e){}notesExpanded['Custom-'+n.id]=true;saveNotesExpanded();showView('notes');renderNotes();}));
 (lifeInbox||[]).forEach(x=>add('lifeos','Quick capture',x.text,[x.type,x.area].filter(Boolean).join(' · '),()=>showView('lifeos')));
 (lifeReading||[]).forEach(x=>add('lifeos','Reading & resources',x.title,[x.notes,x.status,x.url].filter(Boolean).join(' · '),()=>showView('lifeos')));
 (lifeDecisions||[]).forEach(x=>add('lifeos','Decision journal',x.title||x.question||x.decision||'Decision',[x.reason,x.expectation,x.review,x.context,x.options,x.outcome,x.notes].filter(v=>typeof v==='string').join(' · '),()=>showView('lifeos')));
 (lifeRoutines||[]).forEach(x=>add('lifeos','Routines',x.name,[x.area,x.cadence].filter(Boolean).join(' · '),()=>showView('lifeos')));
 (lifeMeals||[]).forEach(x=>add('lifeos','Meals',x.name,[x.date,x.calories+' kcal',x.protein+' g protein',x.note].filter(Boolean).join(' · '),()=>showView('lifeos')));
 (lifeMoney||[]).forEach(x=>add('lifeos','Finance ledger',x.category,[x.date,x.type,x.note,'£'+x.amount].filter(Boolean).join(' · '),()=>showView('lifeos')));
 (QUESTIONS||[]).forEach(q=>add('test','Exam practice',q.topic+' — '+q.q,[q.subject,q.marks+' marks',q.model].filter(Boolean).join(' · '),()=>{testSubjectFilter=q.subject;currentQ=q;lastResult=null;lastAnswerText='';showView('test');renderTest();}));
 (CHECKLIST_ITEMS||[]).forEach(x=>add('checklist','Checklist',x,'Specification / practical checklist item',()=>showView('checklist')));
 (SCHEDULE||[]).forEach(day=>{['train','study'].forEach(mode=>{const block=day[mode];if(block)add('schedule','Weekly schedule',day.day+' — '+block.title,(block.items||[]).join(' · '),()=>showView('schedule'));});});
 (NOTES.Biology||[]).concat(NOTES.Chemistry||[],NOTES.Maths||[]).forEach((topic,ti)=>{
   const subject=(NOTES.Biology||[]).includes(topic)?'Biology':(NOTES.Chemistry||[]).includes(topic)?'Chemistry':'Maths';
   add('notes','Revision notes',topic.title,subject,()=>{notesSubject=subject;try{localStorage.setItem('bp_notesSubject',subject);}catch(e){}const i=(NOTES[subject]||[]).indexOf(topic);notesExpanded[subject+'-'+i]=true;saveNotesExpanded();showView('notes');renderNotes();});
   (topic.sections||[]).forEach((sec,si)=>add('notes','Revision notes',topic.title+' — '+(sec.heading||'Notes'),(sec.points||[]).join(' '),()=>{const i=(NOTES[subject]||[]).indexOf(topic);openNotesSearchResult({subject,ti:i,si,title:topic.title,section:sec.heading||'Notes',snippet:''});}));
 });
 return records;
}
function renderGlobalSearch(raw){
 const wrap=document.getElementById('globalSearchResults');if(!wrap)return;wrap.replaceChildren();const query=String(raw||'').trim().toLocaleLowerCase();
 if(query.length<2){const p=document.createElement('p');p.className='search-empty';p.textContent='Enter at least 2 characters to search.';wrap.appendChild(p);return;}
 const matches=[];(gsCache||(gsCache=globalSearchRecords().map(r=>{r.hay=(r.title+' '+r.group+' '+r.detail).toLocaleLowerCase();return r;}))).forEach(r=>{const hay=r.hay;const at=hay.indexOf(query);if(at<0)return;let snippet=r.detail.replace(/\s+/g,' ').trim();if(snippet.length>190)snippet=snippet.slice(0,187)+'…';if(!snippet)snippet='Open '+r.group.toLowerCase();matches.push({...r,snippet});});
 if(!matches.length){const p=document.createElement('p');p.className='search-empty';p.textContent='No matches found. Try a shorter term or check the spelling.';wrap.appendChild(p);return;}
 const status=document.createElement('p');status.className='search-empty';status.textContent='Found '+matches.length+' result'+(matches.length===1?'':'s')+'. Showing up to 100.';wrap.appendChild(status);
 matches.slice(0,100).forEach(r=>{const b=document.createElement('button');b.type='button';b.className='global-search-result';const t=document.createElement('span');t.className='global-search-result-title';t.textContent=r.title;const l=document.createElement('span');l.className='global-search-result-location';l.textContent=r.group+' · '+r.view.toUpperCase();const d=document.createElement('span');d.className='global-search-result-snippet';d.textContent=r.snippet;b.append(t,l,d);b.addEventListener('click',()=>closeOverlay(()=>r.open()));wrap.appendChild(b);});
}
function setMode(day, mode){ dayModes[day]=mode; saveDayModes(); renderSchedule(); }

function renderChecklist(){
  checklistDrawn=true;
  const wrap = document.getElementById('checklistList');
  wrap.innerHTML='';
  CHECKLIST_ITEMS.forEach((text,i)=>{
    const checked = !!checklistState[i];
    const row = document.createElement('label');
    row.className = 'card check-row';
    row.innerHTML = `<input type="checkbox" ${checked?'checked':''} onchange="toggleCheck(${i}, this.checked)">
      <span class="${checked?'done':''}">${text}</span>`;
    wrap.appendChild(row);
  });
}
function toggleCheck(i, val){ checklistState[i]=val; saveChecklist(); renderChecklist(); }
function resetChecklist(){ checklistState={}; saveChecklist(); renderChecklist(); }

function setNotesSubject(subj){ if(!validNotesSubject(subj))return; notesSubject=subj; lsSet('bp_notesSubject', subj); renderNotes(); }
function toggleNote(key){ notesExpanded[key]=!notesExpanded[key]; saveNotesExpanded();
  // v37: redraw just this card (was the whole list: ~10 ms per tap with 88 topics, and the page could jump)
  const m=/^(.*)-(\d+)$/.exec(key);const card=m&&m[1]===notesSubject&&m[1]!=='Custom'&&document.getElementById('note-'+key);const topic=card&&(NOTES[m[1]]||[])[+m[2]];
  if(card&&topic){card.innerHTML=noteCardInner(m[1],+m[2],topic,!!notesExpanded[key]);return;}
  renderNotes(); }
function clearNotesSearch(){
  const input=document.getElementById('notesSearchInput');
  if(input) input.value='';
  searchAllNotes('');
}
// Build the static revision-note search index once, rather than lowercasing every
// topic and point on every keystroke. Custom notes remain dynamic and are scanned
// separately so edits are visible immediately.
let notesSearchIndex = null;
let notesSearchTimer = null;
function buildNotesSearchIndex(){
  if(notesSearchIndex) return notesSearchIndex;
  const index=[];
  ['Biology','Chemistry','Maths'].forEach(subject=>{
    (NOTES[subject]||[]).forEach((topic,ti)=>{
      index.push({kind:'title',subject,ti,title:topic.title,titleLower:String(topic.title||'').toLocaleLowerCase()});
      (topic.sections||[]).forEach((sec,si)=>index.push({
        kind:'section',subject,ti,si,title:topic.title,heading:sec.heading||'Notes',
        headingLower:String(sec.heading||'').toLocaleLowerCase(),
        points:(sec.points||[]).map(point=>({text:String(point),lower:String(point).toLocaleLowerCase()}))
      }));
    });
  });
  notesSearchIndex=index;
  return index;
}
function scheduleNotesSearch(rawQuery){
  if(notesSearchTimer!==null) window.clearTimeout(notesSearchTimer);
  notesSearchTimer=window.setTimeout(()=>{notesSearchTimer=null;searchAllNotes(rawQuery);},90);
}
function searchAllNotes(rawQuery){
  const results=document.getElementById('notesSearchResults');
  if(!results) return;
  results.innerHTML='';
  const query=String(rawQuery||'').trim().toLocaleLowerCase();
  if(!query){ results.classList.add('hidden'); return; }
  results.classList.remove('hidden');
  const found=[];
  const add=(item)=>{ if(found.length<100) found.push(item); };
  buildNotesSearchIndex().forEach(record=>{
    if(record.kind==='title'){
      if(record.titleLower.includes(query)) add({subject:record.subject,ti:record.ti,si:-1,title:record.title,section:'Topic title',snippet:record.title});
      return;
    }
    const matchedPoints=record.points.filter(point=>point.lower.includes(query));
    const headingMatch=record.headingLower.includes(query);
    if(headingMatch||matchedPoints.length){
      const snippets=[];
      if(headingMatch) snippets.push(record.heading);
      matchedPoints.slice(0,2).forEach(point=>snippets.push(point.text));
      add({subject:record.subject,ti:record.ti,si:record.si,title:record.title,section:record.heading,snippet:snippets.join(' • ')});
    }
  });
  (customNotes||[]).forEach(note=>{
    const title=String(note.title||''), body=String(note.body||'');
    if(title.toLocaleLowerCase().includes(query) || body.toLocaleLowerCase().includes(query)){
      const text=(title+' — '+body).replace(/\s+/g,' ').trim();
      const pos=text.toLocaleLowerCase().indexOf(query);
      const start=Math.max(0,pos-65), end=Math.min(text.length,pos+query.length+115);
      add({subject:'Custom',customId:note.id,title:title||'Untitled note',section:'My Notes',snippet:(start?'…':'')+text.slice(start,end)+(end<text.length?'…':'')});
    }
  });
  if(!found.length){
    const empty=document.createElement('p'); empty.className='search-empty';
    empty.textContent='No matches found. Try a shorter term or check the spelling.'; results.appendChild(empty); return;
  }
  const count=document.createElement('p'); count.className='search-empty';
  count.textContent=(found.length===100?'Showing the first 100 matches.':'Found '+found.length+' matching section'+(found.length===1?'':'s')+'.');
  results.appendChild(count);
  found.forEach(item=>{
    const button=document.createElement('button'); button.type='button'; button.className='search-result';
    const title=document.createElement('span'); title.className='search-result-title'; title.textContent=item.title;
    const location=document.createElement('span'); location.className='search-result-location'; location.textContent=item.subject+' · '+item.section;
    const snippet=document.createElement('span'); snippet.className='search-result-snippet'; snippet.textContent=item.snippet;
    button.append(title,location,snippet);
    button.addEventListener('click',()=>openNotesSearchResult(item));
    results.appendChild(button);
  });
}
function openNotesSearchResult(item){
  notesSubject=item.subject;
  try{localStorage.setItem('bp_notesSubject',notesSubject);}catch(e){}
  if(item.subject==='Custom'){
    notesExpanded['Custom-'+item.customId]=true;
  }else{
    notesExpanded[item.subject+'-'+item.ti]=true;
  }
  saveNotesExpanded();
  showView('notes');
  renderNotes();
  window.setTimeout(()=>{
    const target=item.subject==='Custom'
      ? document.getElementById('custom-note-'+CSS.escape(String(item.customId)))
      : document.getElementById(item.si>=0?'note-sec-'+item.subject+'-'+item.ti+'-'+item.si:'note-'+item.subject+'-'+item.ti);
    if(target){
      target.scrollIntoView({behavior:'smooth',block:'center'});
      target.classList.add('search-target');
      window.setTimeout(()=>target.classList.remove('search-target'),2200);
    }
  },80);
}

function noteCardInner(notesSubject,i,topic,open){
  const key = notesSubject+'-'+i;
    const rev = !!notesRevised[revisedKey(notesSubject, topic.title)];
    let bodyHtml = '';
    if(open){
      bodyHtml = '<div class="note-body">' + topic.sections.map((sec,si)=>{
        const isLast = si===topic.sections.length-1 && !topic.plain;
        return `<p class="note-subhead" id="note-sec-${notesSubject}-${i}-${si}">${escapeHtml(sec.heading)}</p><ul class="${isLast?'astar-list':''}">${sec.points.map(p=>`<li>${escapeHtml(p).replace(/(https:\/\/[^\s)<]+?)(?=(?:&quot;|&#39;|&lt;|&gt;)|[\s)<]|[.,;:]*$)/g, '<a href="$1" target="_blank" rel="noopener noreferrer">$1</a>')}</li>`).join('')}</ul>`;
      }).join('') + `<button type="button" class="revised-btn ${rev?'on':''}" onclick="toggleRevised('${notesSubject}',${i})">${rev?'✓ Revised — tap to undo':'Mark as revised'}</button></div>`;
    }
    return `
      <div class="note-card-header" onclick="toggleNote('${key}')">
        <h4>${escapeHtml(topic.title)}${rev?' <span class="rev-badge">✓</span>':''}</h4>
        <span class="chev ${open?'open':''}">▾</span>
      </div>${bodyHtml}`;
}
let notesDrawn=false,checklistDrawn=false;
function renderNotes(){
  notesDrawn=true;
  if(!validNotesSubject(notesSubject)){ notesSubject='Chemistry'; lsSet('bp_notesSubject',notesSubject); }
  document.querySelectorAll('.subject-tabs button').forEach(b=>{
    b.classList.toggle('active-subject', b.dataset.subject===notesSubject);
  });
  const wrap = document.getElementById('notesList');
  wrap.innerHTML='';
  if(notesSubject === 'Custom'){
    renderCustomNotes(wrap);
    return;
  }
  let lastGroup = null;
  NOTES[notesSubject].forEach((topic,i)=>{
    if(topic.group && topic.group!==lastGroup){
      const gh = document.createElement('p');
      gh.className='group-heading';
      gh.textContent = topic.group;
      wrap.appendChild(gh);
      lastGroup = topic.group;
    }
    const key = notesSubject+'-'+i;
    const open = !!notesExpanded[key];
    const card = document.createElement('div');
    card.className='note-card';
    card.id='note-'+notesSubject+'-'+i;
    card.innerHTML = noteCardInner(notesSubject,i,topic,open);
    wrap.appendChild(card);
  });
}

function showAddNoteForm(){ customNoteFormState = 'new'; renderNotes(); }
function showEditNoteForm(id){ customNoteFormState = id; renderNotes(); }
function cancelNoteForm(){ customNoteFormState = null; renderNotes(); }
function saveNoteForm(){
  const title = document.getElementById('cnTitle').value.trim();
  const body = document.getElementById('cnBody').value.trim();
  if(!title){ alert('Give the note a title first.'); return; }
  if(customNoteFormState === 'new'){
    customNotes.push({ id: Date.now().toString(), title, body });
  } else {
    const note = customNotes.find(n=>n.id===customNoteFormState);
    if(note){ note.title = title; note.body = body; }
  }
  saveCustomNotes();
  customNoteFormState = null;
  renderNotes();
}
function deleteCustomNote(id){
  if(!confirm('Delete this note? This can\'t be undone.')) return;
  customNotes = customNotes.filter(n=>n.id!==id);
  saveCustomNotes();
  renderNotes();
}
function renderCustomNotes(wrap){
  if(customNoteFormState){
    const editing = customNoteFormState !== 'new';
    const existing = editing ? customNotes.find(n=>n.id===customNoteFormState) : null;
    const form = document.createElement('div');
    form.className = 'note-form';
    form.innerHTML = `
      <input id="cnTitle" type="text" placeholder="Note title" value="${existing?escapeHtml(existing.title):''}">
      <textarea id="cnBody" placeholder="Write your note...">${existing?escapeHtml(existing.body):''}</textarea>
      <div class="note-form-actions">
        <button class="btn btn-primary" onclick="saveNoteForm()">Save</button>
        <button class="btn btn-secondary" onclick="cancelNoteForm()">Cancel</button>
      </div>`;
    wrap.appendChild(form);
  } else {
    const addBtn = document.createElement('button');
    addBtn.className = 'add-note-btn';
    addBtn.textContent = '+ Add Note';
    addBtn.onclick = showAddNoteForm;
    wrap.appendChild(addBtn);
    if(customNotes.length===0){
      const empty = document.createElement('p');
      empty.className = 'checklist-hint';
      empty.textContent = 'No notes yet — tap "+ Add Note" to write your first one. They stay saved on this phone even after closing the app.';
      wrap.appendChild(empty);
    }
  }
  customNotes.forEach(note=>{
    const key = 'Custom-'+note.id;
    const open = !!notesExpanded[key];
    const card = document.createElement('div');
    card.className = 'note-card';
    card.id = 'custom-note-'+note.id;
    let bodyHtml = '';
    if(open){
      bodyHtml = `<div class="note-body">
        <p class="custom-note-body">${escapeHtml(note.body)||'(no content — tap Edit to add some)'}</p>
        <div class="custom-note-actions">
          <button class="icon-btn" onclick="event.stopPropagation(); showEditNoteForm('${note.id}')">Edit</button>
          <button class="icon-btn danger" onclick="event.stopPropagation(); deleteCustomNote('${note.id}')">Delete</button>
        </div>
      </div>`;
    }
    card.innerHTML = `
      <div class="note-card-header" onclick="toggleNote('${key}')">
        <h4>${escapeHtml(note.title)}</h4>
        <span class="chev ${open?'open':''}">▾</span>
      </div>${bodyHtml}`;
    wrap.appendChild(card);
  });
}

function renderFocusTaskOptions(){const select=document.getElementById('focusTaskSelect');if(!select)return;const previous=select.value;select.innerHTML='<option value="">Independent focus session</option>'+sortedTasks(tasks.filter(taskIsOpen)).map(t=>`<option value="${t.id}">${escapeHtml(t.title)} · ${Number(t.duration)||25} min</option>`).join('');if(tasks.some(t=>t.id===previous&&taskIsOpen(t)))select.value=previous;updateFocusObjective();}
function updateFocusObjective(){const select=document.getElementById('focusTaskSelect'),text=document.getElementById('focusObjectiveText');if(!select||!text)return;const task=tasks.find(t=>t.id===select.value);text.textContent=task?'Objective: '+task.title+' · estimated '+(Number(task.duration)||25)+' minutes. Completing this timer will not mark the task done.':'Select a task or run a standalone session.';}
function startTaskFocus(){const id=document.getElementById('focusTaskSelect').value;const task=tasks.find(t=>t.id===id&&taskIsOpen(t));if(!task){startStudyFocus(1500);return;}startStudyFocus((Number(task.duration)||25)*60);}

let timerInterval=null, remaining=0, timerEndAt=0, timerWakeLock=null, timerAudioCtx=null;
function startPreset(seconds){ flushStudySession(); remaining=seconds; document.getElementById('timerDisplay').classList.remove('done'); updateTimerDisplay(); startTimer(); }
function timerSecondsLeft(){ return Math.max(0,Math.ceil((timerEndAt-Date.now())/1000)); }
function timerTick(){ remaining=timerSecondsLeft(); updateTimerDisplay(); if(remaining<=0){ stopTimerLoop(); onTimerDone(); } }
function stopTimerLoop(){ if(timerInterval){ clearInterval(timerInterval); timerInterval=null; } timerReleaseWakeLock(); }
function timerPrimeAudio(){ try{ const AC=window.AudioContext||window.webkitAudioContext; if(!AC)return; if(!timerAudioCtx)timerAudioCtx=new AC(); if(timerAudioCtx.state==='suspended')timerAudioCtx.resume(); }catch(e){} }
async function timerRequestWakeLock(){ try{ if('wakeLock' in navigator && !timerWakeLock){ const lock=await navigator.wakeLock.request('screen'); if(!timerInterval&&!ivInterval){ lock.release(); return; } timerWakeLock=lock; lock.addEventListener('release',()=>{ if(timerWakeLock===lock)timerWakeLock=null; }); } }catch(e){} }
function timerReleaseWakeLock(){ const l=timerWakeLock; timerWakeLock=null; try{ if(l)l.release(); }catch(e){} }
function startTimer(){
  if(remaining<=0) return;
  if(typeof musicSuggest==='function') musicSuggest('study');
  document.getElementById('timerDisplay').classList.remove('done');
  if(timerInterval) clearInterval(timerInterval);
  if(iv||ivInterval) ivStop();
  timerPrimeAudio();
  // The end time is an absolute timestamp, so a throttled or suspended tab (screen lock, app switch) cannot make the clock drift.
  timerEndAt=Date.now()+remaining*1000;
  timerInterval=setInterval(timerTick,250);
  timerRequestWakeLock();
}
function pauseTimer(){ if(timerInterval){ remaining=timerSecondsLeft(); updateTimerDisplay(); stopTimerLoop(); } }
function resetTimer(){ flushStudySession(); stopTimerLoop(); remaining=0; updateTimerDisplay(); document.getElementById('timerDisplay').classList.remove('done'); }
document.addEventListener('visibilitychange',()=>{ if(document.visibilityState!=='visible')return; if(timerInterval){ timerTick(); if(timerInterval)timerRequestWakeLock(); } if(iv&&!iv.pausedAt&&ivInterval){ ivTick(); timerRequestWakeLock(); } });
function updateTimerDisplay(){
  const m=Math.floor(Math.max(remaining,0)/60).toString().padStart(2,'0');
  const s=(Math.max(remaining,0)%60).toString().padStart(2,'0');
  document.getElementById('timerDisplay').textContent = m+':'+s;
}
function onTimerDone(){
  if(studySession) recordStudySession(studySession.planned);
  if(navigator.vibrate) navigator.vibrate([200,100,200,100,400]);
  try{
    timerPrimeAudio();
    if(timerAudioCtx){ const o = timerAudioCtx.createOscillator(); o.type='sine'; o.frequency.value=880;
      o.connect(timerAudioCtx.destination); o.start(); setTimeout(()=>{ try{o.stop();}catch(e){} },400); }
  }catch(e){}
  document.getElementById('timerDisplay').classList.add('done');
}
function customStart(){
  const mins = parseFloat(document.getElementById('customMins').value)||0;
  if(mins>0) startPreset(Math.round(mins*60));
}

let testSubjectFilter = 'All';
let currentQ = null;
let lastResult = null;
let lastAnswerText = '';

function setTestSubject(s){
  testSubjectFilter = s; testTopicFocus = null;
  document.querySelectorAll('#testSubjectTabs button').forEach(b=>b.classList.toggle('active-subject', b.dataset.subject===s));
  newQuestion();
}
function newQuestion(){
  currentQ = pickQuestion();
  lastResult = null;
  lastAnswerText = '';
  renderTest();
}
function harshVerdict(pct){
  if(pct >= 100) return "Correct. Don't get used to it.";
  if(pct >= 80) return "Fine, but you dropped marks you shouldn't have.";
  if(pct >= 60) return "Adequate. An examiner would not be impressed.";
  if(pct >= 40) return "Borderline. This would not survive a real exam.";
  if(pct > 0) return "Barely there. Back to the notes with you.";
  return "Nothing credit-worthy here. Zero.";
}
// Normalise text so that typed ASCII (3p6, -1, x2, ->) matches formatted symbols (3p⁶, −1, x², →) and vice versa.
function normMark(s){
  const SUBS='₀₁₂₃₄₅₆₇₈₉', SUPS={'⁰':'0','¹':'1','²':'2','³':'3','⁴':'4','⁵':'5','⁶':'6','⁷':'7','⁸':'8','⁹':'9','⁺':'+','⁻':'-','ⁿ':'n'};
  let t = String(s).toLowerCase();
  t = t.replace(/[₀-₉]/g, c=>String(SUBS.indexOf(c)));
  t = t.replace(/[⁰¹²³⁴⁵⁶⁷⁸⁹⁺⁻ⁿ]/g, c=>SUPS[c]);
  t = t.replace(/[−–—]/g,'-').replace(/×/g,'x').replace(/→|⟶/g,'->').replace(/δ/g,'delta').replace(/½/g,'1/2').replace(/\^/g,'');
  t = t.replace(/ₙ/g,'n').replace(/≤|⩽/g,'<=').replace(/≥|⩾/g,'>=').replace(/π/g,'pi').replace(/√/g,'sqrt');   // v36: symbol and typed forms match
  t = t.replace(/\s*([-+=\/(),<>:])\s*/g,'$1').replace(/\s+/g,' ').trim();
  return t;
}
// Short purely alphabetic or purely numeric keywords (mixed ones like 3d5 / h2o stay substring matches because configurations are written run-together) (e.g. "uv", "ph", "die", "90") must match as whole tokens, not inside other words ("studied", "1900").
function keywordHit(normAnswer,kw){
  // v36: "a && b" needs every part (e.g. "octahedral && 6")
  if(String(kw).includes('&&'))return String(kw).split('&&').map(x=>x.trim()).filter(Boolean).every(part=>keywordHit(normAnswer,part));
  const k=normMark(kw);
  if(!k)return false;
  if(k.length<=3 && (/^[a-z]+$/.test(k)||/^[0-9]+$/.test(k))){
    const esc=k.replace(/[.*+?^${}()|[\]\\]/g,'\\$&');
    return new RegExp('(^|[^a-z0-9])'+esc+'($|[^a-z0-9])').test(normAnswer);
  }
  return normAnswer.includes(k);
}
function markAnswer(){
  const raw = document.getElementById('testAnswer').value;
  lastAnswerText = raw;
  const lower = normMark(raw);
  let scored = 0;
  const fb = currentQ.points.map(pt=>{
    // v36: optional pt.not lists phrases that block the mark (e.g. "insufficient evidence" for a point needing "evidence of correlation")
    const hit = pt.keywords.some(kw=>keywordHit(lower,kw)) && !(Array.isArray(pt.not)&&pt.not.some(kw=>keywordHit(lower,kw)));
    if(hit) scored++;
    return {label: pt.label, hit};
  });
  lastResult = {scored, total: currentQ.points.length};
  if(raw.trim()) recordQuestionResult(currentQ, scored, currentQ.points.length);
  if(raw.trim()) fb.forEach(f=>{const mk='q|'+currentQ.subject+'|'+currentQ.q.slice(0,160)+'|'+f.label;if(f.hit)mistakeHit(mk);else mistakeMiss(mk,{type:'quiz',subject:currentQ.subject,topic:currentQ.topic,label:f.label,ref:currentQ.q});});
  lastFeedback = fb;
  renderTest();
}
let lastFeedback = [];
function renderTest(){
  if(!currentQ) currentQ = pickQuestion();
  renderTestInsights();
  const wrap = document.getElementById('testBody');
  let resultHtml = '';
  if(lastResult){
    const pct = Math.round((lastResult.scored/lastResult.total)*100);
    resultHtml = `
      <div class="test-result">
        <p class="test-score">${lastResult.scored}/${lastResult.total}</p>
        <p class="test-verdict">${harshVerdict(pct)}</p>
        <ul class="test-feedback">
          ${lastFeedback.map(f=>`<li class="${f.hit?'hit':'miss'}">${f.hit?'✓':'✗'} ${f.label}</li>`).join('')}
        </ul>
        <p class="note-subhead">Model answer</p>
        <p class="test-model">${currentQ.model}</p>
      </div>
      <button class="add-note-btn" onclick="newQuestion()">Next Question</button>
    `;
  }
  wrap.innerHTML = `
    <div class="test-card">
      <p class="test-topic">${currentQ.subject} — ${currentQ.topic}</p>
      ${currentQ.sourcePattern ? `<p class="checklist-hint">${currentQ.sourcePattern} · original practice question</p>` : ''}
      <p class="test-question">${currentQ.q}</p>
      <p class="test-marks">[${currentQ.marks} mark${currentQ.marks>1?'s':''}]</p>
    </div>
    <textarea id="testAnswer" placeholder="Type your answer here..." ${lastResult?'readonly':''}>${escapeHtml(lastAnswerText)}</textarea>
    ${lastResult ? '' : '<button class="add-note-btn" onclick="markAnswer()">Mark My Answer</button>'}
    ${resultHtml}
  `;
}

/* ---------- Macro calculator ---------- */
const MC_DEFAULTS = { sex:'male', goal:'cut', age:'18', height:'178', weight:'95', bodyFat:'26', activity:'1.55' };
let mcState = Object.assign({}, MC_DEFAULTS);
function mcPersist(){ try{ localStorage.setItem('bp_macroState', JSON.stringify(mcState)); }catch(e){} }
function mcLoadSavedInputs(){
  try{
    const saved = JSON.parse(localStorage.getItem('bp_macroState') || 'null');
    if(saved && typeof saved==='object'){
      for(const k of Object.keys(MC_DEFAULTS)){ if(typeof saved[k]==='string') mcState[k]=saved[k]; }
    }
  }catch(e){}
  if(mcState.sex!=='male' && mcState.sex!=='female') mcState.sex='male';
  if(['cut','maintain','bulk'].indexOf(mcState.goal)<0) mcState.goal='cut';
  document.getElementById('mcAge').value = mcState.age;
  document.getElementById('mcHeight').value = mcState.height;
  document.getElementById('mcWeight').value = mcState.weight;
  document.getElementById('mcBodyFat').value = mcState.bodyFat;
  const sel = document.getElementById('mcActivity');
  sel.value = mcState.activity;
  if(sel.value !== mcState.activity){ sel.value = MC_DEFAULTS.activity; mcState.activity = MC_DEFAULTS.activity; }
  mcRenderToggles();
}
function mcSaveInputs(){
  mcState.age = document.getElementById('mcAge').value;
  mcState.height = document.getElementById('mcHeight').value;
  mcState.weight = document.getElementById('mcWeight').value;
  mcState.bodyFat = document.getElementById('mcBodyFat').value;
  mcState.activity = document.getElementById('mcActivity').value;
  mcPersist();
}
function mcRenderToggles(){
  document.querySelectorAll('#mcSexToggle button').forEach(b=>b.classList.toggle('on', b.dataset.v===mcState.sex));
  document.querySelectorAll('#mcGoalToggle button').forEach(b=>b.classList.toggle('on', b.dataset.v===mcState.goal));
}
function mcSetSex(v){ mcState.sex=v; mcPersist(); mcRenderToggles(); }
function mcSetGoal(v){ mcState.goal=v; mcPersist(); mcRenderToggles(); }

function mcCompute(inp){
  // inp: {sex, goal, age, height, weight, bodyFat (number or null), activity}
  let bmr, method;
  if(inp.bodyFat!==null){
    const lean = inp.weight*(1-inp.bodyFat/100);
    bmr = 370 + 21.6*lean;
    method = 'Katch-McArdle (uses lean mass '+lean.toFixed(1)+' kg)';
  } else {
    bmr = 10*inp.weight + 6.25*inp.height - 5*inp.age + (inp.sex==='male' ? 5 : -161);
    method = 'Mifflin-St Jeor (no body-fat % entered)';
  }
  const tdee = bmr*inp.activity;
  const adj = inp.goal==='cut' ? -450 : (inp.goal==='bulk' ? 350 : 0);
  const target = Math.round(tdee + adj);
  const protein = Math.round(inp.weight*2.2);
  const fat = Math.round(target*0.27/9);
  let carbs = Math.round((target - protein*4 - fat*9)/4);
  let carbWarn = false;
  if(carbs<0){ carbs=0; carbWarn=true; }
  return { bmr:Math.round(bmr), tdee:Math.round(tdee), adj, target, protein, fat, carbs, method, carbWarn };
}

function calculateMacros(){
  mcSaveInputs();
  const out = document.getElementById('macroResults');
  const num = id => { const v = document.getElementById(id).value.trim(); return v==='' ? null : Number(v); };
  const age=num('mcAge'), height=num('mcHeight'), weight=num('mcWeight'), bf=num('mcBodyFat');
  const activity = Number(document.getElementById('mcActivity').value);
  const errs=[];
  if(age===null || !isFinite(age) || age<14 || age>100) errs.push('Age must be between 14 and 100.');
  if(height===null || !isFinite(height) || height<120 || height>230) errs.push('Height must be between 120 and 230 cm.');
  if(weight===null || !isFinite(weight) || weight<35 || weight>250) errs.push('Weight must be between 35 and 250 kg.');
  if(bf!==null && (!isFinite(bf) || bf<3 || bf>60)) errs.push('Body fat must be between 3% and 60% (or leave it blank).');
  if(!isFinite(activity) || activity<1.2) errs.push('Choose an activity level.');
  if(errs.length){
    out.innerHTML = '<div class="card"><p class="mc-error">'+errs.map(escapeHtml).join('<br>')+'</p></div>';
    return;
  }
  const r = mcCompute({sex:mcState.sex, goal:mcState.goal, age, height, weight, bodyFat:bf, activity});
  const pK=r.protein*4, fK=r.fat*9, cK=r.carbs*4, tot=Math.max(1,pK+fK+cK);
  const pPct=Math.round(pK/tot*100), fPct=Math.round(fK/tot*100), cPct=Math.max(0,100-pPct-fPct);
  const goalName = mcState.goal==='cut' ? 'Fat loss (−450 kcal)' : (mcState.goal==='bulk' ? 'Build (+350 kcal)' : 'Maintain');
  const fibre = Math.round(r.target/1000*14);
  const water = (weight*0.035).toFixed(1);
  let warn = '';
  const floor = mcState.sex==='male' ? 1500 : 1200;
  if(r.target<floor) warn += '<p class="mc-warn">⚠ This target is below '+floor+' kcal, which is too low to sustain hard training. Raise it or pick Maintain.</p>';
  if(r.carbWarn) warn += '<p class="mc-warn">⚠ Protein and fat already use all your calories, so carbs are 0 g. Check your inputs.</p>';
  out.innerHTML =
    '<div class="card macro-hero">'+
      '<p class="sub">'+escapeHtml(goalName)+' • daily target</p>'+
      '<p class="big">'+r.target+' <span style="font-size:16px;color:var(--muted)">kcal</span></p>'+
      '<p class="sub">BMR '+r.bmr+' • maintenance (TDEE) '+r.tdee+' kcal</p>'+
      '<p class="sub">'+escapeHtml(r.method)+'</p>'+
      warn+
    '</div>'+
    '<div class="macro-grid">'+
      '<div class="macro-card"><p class="num" style="color:var(--red-text)">'+r.protein+' g</p><p class="lbl">Protein</p><p class="kc">'+pK+' kcal</p></div>'+
      '<div class="macro-card"><p class="num" style="color:var(--amber-text)">'+r.carbs+' g</p><p class="lbl">Carbs</p><p class="kc">'+cK+' kcal</p></div>'+
      '<div class="macro-card"><p class="num" style="color:var(--blue)">'+r.fat+' g</p><p class="lbl">Fat</p><p class="kc">'+fK+' kcal</p></div>'+
    '</div>'+
    '<div class="card">'+
      '<div class="macro-bar"><div style="width:'+pPct+'%;background:#f87171"></div><div style="width:'+cPct+'%;background:#fbbf24"></div><div style="width:'+fPct+'%;background:#60a5fa"></div></div>'+
      '<div class="macro-legend"><span>Protein '+pPct+'%</span><span>Carbs '+cPct+'%</span><span>Fat '+fPct+'%</span></div>'+
    '</div>'+
    '<div class="card"><ul class="macro-notes">'+
      '<li>Protein is set at 2.2 g per kg of bodyweight — high enough to protect muscle while losing fat and to support strength gains. Spread it over 3–5 meals (~'+Math.round(r.protein/4)+' g each across 4 meals).</li>'+
      '<li>Fat is 27% of calories (floor for hormone health and fat-soluble vitamins). Carbs fill the rest — put most of them around training, since they fuel heavy lifting and boxing rounds.</li>'+
      '<li>Fibre: aim for about '+fibre+' g/day. Water: at least '+water+' L/day, more on training days.</li>'+
      '<li>Weigh yourself first thing each morning and use the weekly average. For fat loss aim for roughly 0.3–0.7 kg per week; if strength is falling quickly or you lose faster than that, add 100–150 kcal.</li>'+
      '<li>Recalculate whenever your bodyweight changes by more than ~3 kg.</li>'+
    '</ul></div>';
}

/* ---------- v38. Music: saved YouTube Music playlists ----------
   Google offers no way for other apps to control YouTube Music, so this keeps a list of the user's playlist / song links and
   opens them in the YouTube Music app (Premium keeps playing in the background while they use Bridge Protocol).
   Only music.youtube.com / youtube.com / youtu.be links are accepted, and links are rebuilt from validated IDs. */
const MUSIC_KEY='bp_music_v1';
const MUSIC_TAGS=[['study','Study & focus'],['training','Training & boxing'],['relax','Wind down'],['any','Anything']];
const MUSIC_MAX=30;
function musicParse(raw){
  let u;try{u=new URL(String(raw||'').trim());}catch(e){return null;}
  if(u.protocol!=='https:'&&u.protocol!=='http:')return null;
  const host=u.hostname.toLowerCase().replace(/^(www|m)\./,'');
  const id=x=>(typeof x==='string'&&/^[A-Za-z0-9_-]{2,64}$/.test(x))?x:null;
  let list=id(u.searchParams.get('list')),v=id(u.searchParams.get('v'));
  if(host==='youtu.be')v=id(u.pathname.split('/')[1]);
  else if(host==='youtube.com'&&/^\/shorts\//.test(u.pathname))v=id(u.pathname.split('/')[2]);
  else if(host!=='music.youtube.com'&&host!=='youtube.com')return null;
  if(v&&v.length<6)v=null;
  if(!list&&!v)return null;
  const path=v?'/watch?v='+v+(list?'&list='+list:''):'/playlist?list='+list;
  return {path,web:'https://music.youtube.com'+path,kind:v?'song':'playlist'};
}
function musicIsAndroid(){return /Android/i.test(navigator.userAgent||'');}
function musicHref(path){const web='https://music.youtube.com'+path;
  // On Android an intent link opens the YouTube Music app directly (falls back to the website if the app is missing).
  return musicIsAndroid()?'intent://music.youtube.com'+path+'#Intent;scheme=https;package=com.google.android.apps.youtube.music;S.browser_fallback_url='+encodeURIComponent(web)+';end':web;}
function normalizeMusic(raw){
  const out={playlists:[],suggest:true};if(!raw||typeof raw!=='object'||Array.isArray(raw))return out;
  out.suggest=raw.suggest!==false;
  (Array.isArray(raw.playlists)?raw.playlists:[]).slice(0,MUSIC_MAX).forEach(p=>{if(!p||typeof p!=='object')return;const parsed=musicParse(p.url);if(!parsed)return;
    const name=String(p.name||'').trim().slice(0,60)||(parsed.kind==='song'?'Song':'Playlist');const tag=MUSIC_TAGS.some(t=>t[0]===p.tag)?p.tag:'any';
    const idv=typeof p.id==='string'&&/^[A-Za-z0-9_-]{1,40}$/.test(p.id)?p.id:'m'+Math.random().toString(36).slice(2,10);
    out.playlists.push({id:idv,name,url:parsed.web,tag,last:typeof p.last==='string'?p.last.slice(0,30):''});});
  return out;
}
let music=normalizeMusic(safeReadJSON(MUSIC_KEY,null)),musicEditId=null;const musicSuggested={};
function musicReload(){music=normalizeMusic(safeReadJSON(MUSIC_KEY,null));}
function saveMusic(){return lsSet(MUSIC_KEY,JSON.stringify(music));}
function musicTagLabel(t){return (MUSIC_TAGS.find(x=>x[0]===t)||MUSIC_TAGS[3])[1];}
function musicPlayLink(p,label,cls){const parsed=musicParse(p.url);const a=document.createElement('a');a.className=cls||'btn btn-primary music-play';a.textContent=label||'▶ Play';
  if(!parsed){a.removeAttribute('href');return a;}a.href=musicHref(parsed.path);if(!musicIsAndroid()){a.target='_blank';a.rel='noopener noreferrer';}
  a.setAttribute('aria-label','Play '+p.name+' in YouTube Music');
  a.addEventListener('click',()=>{p.last=new Date().toISOString();saveMusic();hideMusicToast();if(musicIsOpen())setTimeout(()=>{if(musicIsOpen())closeOverlay();},350);});return a;}
function musicIsOpen(){const m=document.getElementById('musicBackdrop');return !!(m&&!m.classList.contains('hidden'));}
function openMusic(){closeSectionMenu();closeGlobalSearch();hideMusicToast();const back=document.getElementById('musicBackdrop');if(!back)return;musicEditId=null;renderMusic();back.classList.remove('hidden');back.setAttribute('aria-hidden','false');pushOverlayState('music');}
function closeMusic(){const back=document.getElementById('musicBackdrop');if(back){back.classList.add('hidden');back.setAttribute('aria-hidden','true');}}
function renderMusic(){
  const box=document.getElementById('musicBody');if(!box)return;box.textContent='';
  if(!music.playlists.length){const e=mkEl('div','empty-state');e.append(mkEl('strong','','No playlists saved yet.'),mkEl('p','','In YouTube Music, open a playlist (or song), tap ⋮ or Share → Copy link, then paste it below. It opens in the YouTube Music app, and with Premium it keeps playing while you use Bridge Protocol.'));box.appendChild(e);}
  const sorted=[...music.playlists].sort((a,b)=>MUSIC_TAGS.findIndex(t=>t[0]===a.tag)-MUSIC_TAGS.findIndex(t=>t[0]===b.tag)||(b.last||'').localeCompare(a.last||''));
  sorted.forEach(p=>{const row=mkEl('div','music-row');const info=mkEl('div','music-info');info.append(mkEl('div','music-name',p.name),mkEl('div','music-meta',musicTagLabel(p.tag)+(musicParse(p.url).kind==='song'?' · song':'')));
    const act=mkEl('div','music-actions');act.appendChild(musicPlayLink(p));
    const ed=mkEl('button','link-btn','Edit');ed.type='button';ed.setAttribute('aria-label','Edit '+p.name);ed.addEventListener('click',()=>{musicEditId=p.id;renderMusic();const n=document.getElementById('musicName');if(n)n.focus();});
    const del=mkEl('button','link-btn music-del','Delete');del.type='button';del.setAttribute('aria-label','Delete '+p.name);del.addEventListener('click',()=>{if(!confirm('Remove "'+p.name+'" from your music list?'))return;music.playlists=music.playlists.filter(x=>x.id!==p.id);if(musicEditId===p.id)musicEditId=null;saveMusic();renderMusic();});
    act.append(ed,del);row.append(info,act);box.appendChild(row);});
  const editing=music.playlists.find(x=>x.id===musicEditId)||null;
  const form=mkEl('div','form-panel music-form');form.appendChild(mkEl('h3','music-form-title',editing?'Edit "'+editing.name+'"':'Add a playlist or song'));
  const field=(id,label,el)=>{const f=mkEl('div','field');const l=mkEl('label','',label);l.htmlFor=id;el.id=id;f.append(l,el);return f;};
  const name=document.createElement('input');name.maxLength=60;name.placeholder='e.g. Revision focus';name.autocomplete='off';
  const url=document.createElement('input');url.type='url';url.inputMode='url';url.placeholder='https://music.youtube.com/playlist?list=…';url.autocomplete='off';
  const tag=document.createElement('select');MUSIC_TAGS.forEach(([k,l])=>{const o=document.createElement('option');o.value=k;o.textContent=l;tag.appendChild(o);});
  if(editing){name.value=editing.name;url.value=editing.url;tag.value=editing.tag;}
  const msg=mkEl('p','music-msg');msg.setAttribute('aria-live','polite');
  form.append(field('musicName','Name',name),field('musicUrl','YouTube Music link',url),field('musicTag','Use for',tag),msg);
  const save=mkEl('button','btn btn-primary',editing?'Save changes':'Add to my music');save.type='button';save.style.width='100%';
  save.addEventListener('click',()=>{const parsed=musicParse(url.value);if(!parsed){msg.textContent='That doesn\'t look like a YouTube Music or YouTube playlist/song link. Use Share → Copy link in YouTube Music.';url.focus();return;}
    const nm=name.value.trim().slice(0,60)||(parsed.kind==='song'?'Song':'Playlist');
    if(editing){Object.assign(editing,{name:nm,url:parsed.web,tag:tag.value});}
    else{if(music.playlists.length>=MUSIC_MAX){msg.textContent='You can save up to '+MUSIC_MAX+'. Delete one first.';return;}music.playlists.push({id:'m'+Date.now().toString(36)+Math.random().toString(36).slice(2,6),name:nm,url:parsed.web,tag:tag.value,last:''});}
    if(!saveMusic()){msg.textContent='Could not save (storage full).';return;}musicEditId=null;renderMusic();});
  form.appendChild(save);
  if(editing){const cancel=mkEl('button','link-btn','Cancel editing');cancel.type='button';cancel.addEventListener('click',()=>{musicEditId=null;renderMusic();});form.appendChild(cancel);}
  box.appendChild(form);
  const opt=mkEl('label','music-opt');const cb=document.createElement('input');cb.type='checkbox';cb.checked=music.suggest;cb.addEventListener('change',()=>{music.suggest=cb.checked;saveMusic();});
  opt.append(cb,document.createTextNode(' Suggest a playlist when I start a focus timer (Study & focus) or a round timer (Training & boxing)'));box.appendChild(opt);
  const home=document.createElement('a');home.className='link-btn music-home';home.textContent='Open YouTube Music ↗';home.href=musicHref('/');if(!musicIsAndroid()){home.target='_blank';home.rel='noopener noreferrer';}box.appendChild(home);
}
// Offer the matching playlist when a timer starts (at most once per 45 minutes per kind). Never plays on its own.
function musicSuggest(tag){
  if(!music.suggest)return;const now=Date.now();if(musicSuggested[tag]&&now-musicSuggested[tag]<45*60000)return;
  const pick=music.playlists.filter(p=>p.tag===tag).sort((a,b)=>(b.last||'').localeCompare(a.last||''))[0];if(!pick)return;
  musicSuggested[tag]=now;
  let t=document.getElementById('musicToast');if(!t){t=mkEl('div','music-toast');t.id='musicToast';t.setAttribute('role','status');document.body.appendChild(t);}
  t.textContent='';t.append(mkEl('span','music-toast-label','♪ '+musicTagLabel(tag)));t.appendChild(musicPlayLink(pick,'▶ '+pick.name,'music-toast-play'));
  const x=mkEl('button','music-toast-x','✕');x.type='button';x.setAttribute('aria-label','Dismiss music suggestion');x.addEventListener('click',hideMusicToast);t.appendChild(x);
  t.classList.add('show');clearTimeout(t._h);t._h=setTimeout(hideMusicToast,12000);
}
function hideMusicToast(){const t=document.getElementById('musicToast');if(t)t.classList.remove('show');}

if(!validNotesSubject(notesSubject)){notesSubject='Chemistry';lsSet('bp_notesSubject',notesSubject);} // checked at start-up even though Notes draw later
renderSchedule();
renderTasks();
renderProjects();
refreshDataStatus();
// v37: Notes, Quiz and Checklist are drawn the first time they are opened (see showView), and the start screen is
// drawn once by showView instead of twice.
showView(startViewFromHash(),{replace:true});
mcLoadSavedInputs();
updateTimerDisplay();
ivRenderInputs();ivRenderIdle();

// Register service worker for full offline capability, and flag when running offline.
if ('serviceWorker' in navigator) {
  window.addEventListener('load', () => {
    navigator.serviceWorker.register('./service-worker.js').catch(()=>{});
  });
}
window.addEventListener('load',()=>{requestPersistentStorage();});
function updateOfflineBadge(){
  document.getElementById('offlineBadge').classList.toggle('show', !navigator.onLine);
}
window.addEventListener('online', updateOfflineBadge);
window.addEventListener('offline', updateOfflineBadge);
updateOfflineBadge();
const globalSearchInput=document.getElementById('globalSearchInput');if(globalSearchInput)globalSearchInput.addEventListener('input',()=>scheduleGlobalSearch(globalSearchInput.value));




/* Bridge Protocol v28+ — Biology and Chemistry notes expansion. All records use bp_ keys and are included by the existing manual backup exporter. */
const LIFEOS_KEYS={inbox:'bp_lifeInbox_v1',money:'bp_lifeMoney_v1',meals:'bp_lifeMeals_v1',routines:'bp_lifeRoutines_v1',reading:'bp_lifeReading_v1',decisions:'bp_lifeDecisions_v1',history:'bp_lifeHistory_v1',savings:'bp_lifeSavings_v1'};
const lifeRead=(k,fallback=[])=>{const v=safeReadJSON(k,fallback);return Array.isArray(fallback)?(Array.isArray(v)?v:fallback):(v&&typeof v==='object'&&!Array.isArray(v)?v:fallback)};
let lifeInbox=lifeRead(LIFEOS_KEYS.inbox),lifeMoney=lifeRead(LIFEOS_KEYS.money),lifeMeals=lifeRead(LIFEOS_KEYS.meals),lifeRoutines=lifeRead(LIFEOS_KEYS.routines),lifeReading=lifeRead(LIFEOS_KEYS.reading),lifeDecisions=lifeRead(LIFEOS_KEYS.decisions),lifeHistory=lifeRead(LIFEOS_KEYS.history),lifeSavings=lifeRead(LIFEOS_KEYS.savings,{});
function lifeSafeId(v,prefix){return typeof v==='string'&&/^[A-Za-z0-9_-]{1,80}$/.test(v)?v:lifeId(prefix)}
function lifeSafeDate(v){return typeof v==='string'&&/^\d{4}-\d{2}-\d{2}$/.test(v)&&!Number.isNaN(Date.parse(v+'T12:00:00'))?v:localISODate()}
function lifeNormalizeData(){
 lifeInbox=lifeInbox.filter(x=>x&&typeof x==='object'&&typeof x.text==='string').map(x=>({...x,id:lifeSafeId(x.id,'i'),text:x.text.slice(0,240),type:['idea','task','resource'].includes(x.type)?x.type:'idea',area:['personal','study','work','health','home','relationships','finance','admin','other'].includes(x.area)?x.area:'personal',created:typeof x.created==='string'?x.created:new Date().toISOString()})).slice(0,500);
 lifeMoney=lifeMoney.filter(x=>x&&typeof x==='object'&&Number.isFinite(Number(x.amount))&&Number(x.amount)>0&&Number(x.amount)<=10000000).map(x=>({...x,id:lifeSafeId(x.id,'m'),type:x.type==='income'?'income':'expense',amount:Math.round(Number(x.amount)*100)/100,date:lifeSafeDate(x.date),category:typeof x.category==='string'?x.category.slice(0,60):'Other',note:typeof x.note==='string'?x.note.slice(0,160):'',created:typeof x.created==='string'?x.created:new Date().toISOString()})).slice(0,5000);
 lifeMeals=lifeMeals.filter(x=>x&&typeof x==='object'&&typeof x.name==='string'&&Number.isFinite(Number(x.calories))&&Number(x.calories)>=0&&Number(x.calories)<=10000&&Number.isFinite(Number(x.protein))&&Number(x.protein)>=0&&Number(x.protein)<=500).map(x=>({...x,id:lifeSafeId(x.id,'f'),date:lifeSafeDate(x.date),name:x.name.slice(0,120),calories:Math.round(Number(x.calories)),protein:Math.round(Number(x.protein)*10)/10,note:typeof x.note==='string'?x.note.slice(0,160):'',created:typeof x.created==='string'?x.created:new Date().toISOString()})).slice(0,5000);
 lifeRoutines=lifeRoutines.filter(x=>x&&typeof x==='object'&&typeof x.name==='string').map(x=>({...x,id:lifeSafeId(x.id,'r'),name:x.name.slice(0,120),area:typeof x.area==='string'?x.area.slice(0,40):'Personal',cadence:['Daily','Weekdays','Weekly'].includes(x.cadence)?x.cadence:'Daily',checks:x.checks&&typeof x.checks==='object'&&!Array.isArray(x.checks)?Object.fromEntries(Object.entries(x.checks).filter(([k,v])=>/^\d{4}-\d{2}-\d{2}$/.test(k)&&typeof v==='boolean').slice(-400)): {},created:typeof x.created==='string'?x.created:new Date().toISOString()})).slice(0,1000);
 lifeReading=lifeReading.filter(x=>x&&typeof x==='object'&&typeof x.title==='string').map(x=>{let url='';try{const u=new URL(typeof x.url==='string'?x.url:'');if(['http:','https:'].includes(u.protocol))url=u.href}catch(e){}return {...x,id:lifeSafeId(x.id,'b'),title:x.title.slice(0,180),url,notes:typeof x.notes==='string'?x.notes.slice(0,1200):'',status:x.status==='done'?'done':'to-read',created:typeof x.created==='string'?x.created:new Date().toISOString()}}).slice(0,2000);
 lifeDecisions=lifeDecisions.filter(x=>x&&typeof x==='object'&&typeof x.title==='string').map(x=>({...x,id:lifeSafeId(x.id,'d'),title:x.title.slice(0,180),reason:typeof x.reason==='string'?x.reason.slice(0,1500):'',expectation:typeof x.expectation==='string'?x.expectation.slice(0,500):'',review:typeof x.review==='string'&&/^\d{4}-\d{2}-\d{2}$/.test(x.review)?x.review:'',created:typeof x.created==='string'?x.created:new Date().toISOString()})).slice(0,2000);
 lifeHistory=lifeHistory.filter(x=>x&&typeof x==='object').map(x=>({id:lifeSafeId(x.id,'h'),at:typeof x.at==='string'?x.at:new Date().toISOString(),action:typeof x.action==='string'?x.action.slice(0,80):'Updated record',detail:typeof x.detail==='string'?x.detail.slice(0,240):'',undo:x.undo&&x.undo.type==='taskDue'&&typeof x.undo.taskId==='string'&&/^[A-Za-z0-9_-]{1,80}$/.test(x.undo.taskId)?{type:'taskDue',taskId:x.undo.taskId,before:typeof x.undo.before==='string'?x.undo.before:'',after:typeof x.undo.after==='string'?x.undo.after:''}:null})).slice(0,100);
 if(!lifeSavings||typeof lifeSavings!=='object'||Array.isArray(lifeSavings))lifeSavings={};lifeSavings={name:typeof lifeSavings.name==='string'?lifeSavings.name.slice(0,100):'',target:Number.isFinite(Number(lifeSavings.target))&&Number(lifeSavings.target)>0&&Number(lifeSavings.target)<=10000000?Math.round(Number(lifeSavings.target)*100)/100:0,current:Number.isFinite(Number(lifeSavings.current))&&Number(lifeSavings.current)>=0&&Number(lifeSavings.current)<=10000000?Math.round(Number(lifeSavings.current)*100)/100:0,updated:typeof lifeSavings.updated==='string'?lifeSavings.updated:''};
}
lifeNormalizeData();
function lifeReloadFromStorage(){lifeInbox=lifeRead(LIFEOS_KEYS.inbox);lifeMoney=lifeRead(LIFEOS_KEYS.money);lifeMeals=lifeRead(LIFEOS_KEYS.meals);lifeRoutines=lifeRead(LIFEOS_KEYS.routines);lifeReading=lifeRead(LIFEOS_KEYS.reading);lifeDecisions=lifeRead(LIFEOS_KEYS.decisions);lifeHistory=lifeRead(LIFEOS_KEYS.history);lifeSavings=lifeRead(LIFEOS_KEYS.savings,{});lifeNormalizeData();}
function lifeId(prefix){return prefix+Date.now().toString(36)+Math.random().toString(36).slice(2,7)}
function lifePersist(key,value){try{localStorage.setItem(key,JSON.stringify(value));return true}catch(e){storageFullWarn();return false}}
function lifeEsc(v){return escapeHtml(String(v??''))}
function lifeLog(action,detail){lifeHistory.unshift({id:lifeId('h'),at:new Date().toISOString(),action:String(action).slice(0,80),detail:String(detail).slice(0,240)});lifeHistory=lifeHistory.slice(0,100);lifePersist(LIFEOS_KEYS.history,lifeHistory)}
function lifeFmtGBP(n){return new Intl.NumberFormat('en-GB',{style:'currency',currency:'GBP'}).format(Number(n)||0)}
function lifeRenderAll(){lifeInbox=lifeRead(LIFEOS_KEYS.inbox);lifeMoney=lifeRead(LIFEOS_KEYS.money);lifeMeals=lifeRead(LIFEOS_KEYS.meals);lifeRoutines=lifeRead(LIFEOS_KEYS.routines);lifeReading=lifeRead(LIFEOS_KEYS.reading);lifeDecisions=lifeRead(LIFEOS_KEYS.decisions);lifeHistory=lifeRead(LIFEOS_KEYS.history);lifeSavings=lifeRead(LIFEOS_KEYS.savings,{});lifeNormalizeData();const today=localISODate();for(const id of ['lifeMoneyDate','lifeMealDate']){const e=document.getElementById(id);if(e&&!e.value)e.value=today}lifeRenderOverview();lifeRenderCapture();lifeRenderCapacity();lifeRenderMoney();lifeRenderMeals();lifeRenderRoutines();lifeRenderReading();lifeRenderDecisions();lifeRenderAnalytics();lifeRenderHistory();lifeRenderDiagnostics()}
function lifeRenderOverview(){const el=document.getElementById('lifeosOverview');if(!el)return;const today=localISODate(),month=today.slice(0,7),open=Array.isArray(tasks)?tasks.filter(taskIsOpen):[],due=open.filter(t=>t.due&&t.due<=today).length,workouts=Array.isArray(workoutLog)?workoutLog.filter(w=>w.date>=localISODate(new Date(Date.now()-6*86400000))&&w.date<=today):[],spend=lifeMoney.filter(x=>x.type==='expense'&&(x.date||'').startsWith(month)).reduce((a,x)=>a+x.amount,0),protein=lifeMeals.filter(x=>x.date===today).reduce((a,x)=>a+x.protein,0);el.innerHTML=[['OPEN TASKS',open.length],['DUE / OVERDUE',due],['TRAINING ENTRIES · 7D',workouts.length],['SPEND THIS MONTH',lifeFmtGBP(spend)],['TODAY PROTEIN',Math.round(protein)+' g'],['INBOX ITEMS',lifeInbox.length]].map(x=>`<div class="lifeos-stat"><strong>${lifeEsc(x[1])}</strong><span>${x[0]}</span></div>`).join('')}
function lifeAddCapture(){const input=document.getElementById('lifeCaptureText'),text=input.value.trim();if(!text){alert('Enter something to capture first.');input.focus();return}lifeInbox.unshift({id:lifeId('i'),text:text.slice(0,240),type:document.getElementById('lifeCaptureType').value,area:document.getElementById('lifeCaptureArea').value,created:new Date().toISOString()});lifeInbox=lifeInbox.slice(0,500);if(!lifePersist(LIFEOS_KEYS.inbox,lifeInbox))return;input.value='';lifeLog('Captured item',text);lifeRenderCapture();lifeRenderOverview()}
function lifeRenderCapture(){const el=document.getElementById('lifeCaptureList');if(!el)return;el.innerHTML=lifeInbox.length?lifeInbox.slice(0,20).map(x=>`<div class="lifeos-list-item"><strong>${lifeEsc(x.text)}</strong><small>${lifeEsc(x.type)} · ${lifeEsc(x.area)} · ${new Date(x.created).toLocaleDateString()}</small><div class="lifeos-actions">${x.type==='task'?`<button class="btn btn-secondary" onclick="lifePromoteTask('${x.id}')">Convert to task</button>`:''}<button class="btn btn-secondary" onclick="lifeDeleteRecord('inbox','${x.id}')">Dismiss</button></div></div>`).join(''):'<div class="empty-state">Inbox clear.</div>'}
function lifePromoteTask(id){const x=lifeInbox.find(y=>y.id===id);if(!x)return;const now=new Date().toISOString();tasks.push({id:'t'+Date.now().toString(36)+Math.random().toString(36).slice(2,7),title:x.text.slice(0,160),due:'',duration:25,area:['personal','study','work','health','home','relationships','finance','admin','other'].includes(x.area)?x.area:'personal',priority:'medium',status:'next',projectId:'',notes:'Captured in Life OS inbox.',created:now,updated:now});persistTasks();lifeInbox=lifeInbox.filter(y=>y.id!==id);lifePersist(LIFEOS_KEYS.inbox,lifeInbox);lifeLog('Converted inbox item to task',x.text);lifeRenderCapture();lifeRenderOverview();renderTasks();renderCommandCentre()}
function lifeRenderCapacity(){const result=document.getElementById('lifeCapacityResult'),sel=document.getElementById('lifeRescheduleTask');if(!result||!sel)return;const avail=Math.max(0,Number(document.getElementById('lifeAvailableHours').value)||0),fixed=Math.max(0,Number(document.getElementById('lifeFixedHours').value)||0),open=tasks.filter(taskIsOpen),estimated=open.reduce((a,t)=>a+(Number(t.duration)||25),0)/60,usable=Math.max(0,avail-fixed),over=estimated>usable;result.innerHTML=`<div class="lifeos-stat-grid"><div class="lifeos-stat"><strong>${estimated.toFixed(1)} h</strong><span>Open task estimates</span></div><div class="lifeos-stat"><strong>${usable.toFixed(1)} h</strong><span>Time after commitments</span></div></div><div class="lifeos-note">${over?`Estimated workload exceeds available time by ${(estimated-usable).toFixed(1)} hours. Consider reducing scope or renegotiating low-priority tasks.`:`Task estimates fit within the entered capacity, with ${(usable-estimated).toFixed(1)} hours remaining. This estimate excludes unlogged commitments and buffers.`} This is a planning signal, not an automatic schedule.</div>`;const current=sel.value;sel.innerHTML='<option value="">Choose a task…</option>'+open.map(t=>`<option value="${lifeEsc(t.id)}">${lifeEsc(t.title)} · ${lifeEsc(t.priority||'medium')}${t.due?' · due '+lifeEsc(t.due):' · no due date'}</option>`).join('');if(open.some(t=>t.id===current))sel.value=current;lifeUpdateReschedulePreview()}
function lifeUpdateReschedulePreview(){const sel=document.getElementById('lifeRescheduleTask'),date=document.getElementById('lifeRescheduleDate'),preview=document.getElementById('lifeReschedulePreview');if(!sel||!date||!preview)return;const t=tasks.find(x=>x.id===sel.value);preview.textContent=t?`Proposed change: “${t.title}” due date ${t.due||'not set'} → ${date.value||'(choose a date)'}. No change has been applied yet.`:'Select an open task and proposed date. No task is changed until you confirm.'}
function lifeApproveReschedule(){const sel=document.getElementById('lifeRescheduleTask'),date=document.getElementById('lifeRescheduleDate'),t=tasks.find(x=>x.id===sel.value);if(!t||!taskIsOpen(t)){alert('Choose an existing open task.');return}if(!date.value||!/^\d{4}-\d{2}-\d{2}$/.test(date.value)){alert('Choose a valid new due date.');return}const before=t.due||'',after=date.value;if(before===after){alert('The task already has that due date.');return}if(!confirm(`Approve this change?\n\n${t.title}\n${before||'No due date'} → ${after}\n\nOnly this task's due date will change.`))return;t.due=after;t.updated=new Date().toISOString();persistTasks();lifeLog('Approved task reschedule',`${t.title}: ${before||'none'} → ${after}`);lifeHistory[0].undo={type:'taskDue',taskId:t.id,before,after};lifePersist(LIFEOS_KEYS.history,lifeHistory);renderTasks();renderCommandCentre();lifeRenderCapacity();lifeRenderOverview();lifeRenderHistory();alert('Approved change applied and recorded locally.')}
function lifeAddMoney(){const type=document.getElementById('lifeMoneyType').value,amount=Number(document.getElementById('lifeMoneyAmount').value),date=document.getElementById('lifeMoneyDate').value||localISODate();if(!Number.isFinite(amount)||amount<=0||amount>10000000){alert('Enter an amount greater than £0 and no more than £10,000,000.');return}const item={id:lifeId('m'),type,amount:Math.round(amount*100)/100,date,category:document.getElementById('lifeMoneyCategory').value,note:document.getElementById('lifeMoneyNote').value.trim().slice(0,160),created:new Date().toISOString()};lifeMoney.unshift(item);if(!lifePersist(LIFEOS_KEYS.money,lifeMoney))return;lifeLog('Added finance entry',`${type} ${lifeFmtGBP(amount)} · ${item.category}`);document.getElementById('lifeMoneyAmount').value='';document.getElementById('lifeMoneyNote').value='';lifeRenderMoney();lifeRenderOverview()}
function lifeRenderMoney(){const sum=document.getElementById('lifeMoneySummary'),list=document.getElementById('lifeMoneyList');if(!sum||!list)return;const month=localISODate().slice(0,7),rows=lifeMoney.filter(x=>(x.date||'').startsWith(month)),income=rows.filter(x=>x.type==='income').reduce((a,x)=>a+x.amount,0),expenses=rows.filter(x=>x.type==='expense').reduce((a,x)=>a+x.amount,0);sum.innerHTML=`<div class="lifeos-stat-grid"><div class="lifeos-stat"><strong>${lifeFmtGBP(income)}</strong><span>Income · this month</span></div><div class="lifeos-stat"><strong>${lifeFmtGBP(expenses)}</strong><span>Spending · this month</span></div><div class="lifeos-stat"><strong>${lifeFmtGBP(income-expenses)}</strong><span>Net · this month</span></div></div>`;list.innerHTML=lifeMoney.slice(0,15).map(x=>`<div class="lifeos-list-item"><strong>${x.type==='expense'?'−':'+'}${lifeFmtGBP(x.amount)} · ${lifeEsc(x.category)}</strong><small>${lifeEsc(x.date)}${x.note?' · '+lifeEsc(x.note):''}</small><div class="lifeos-actions"><button class="btn btn-secondary" onclick="lifeDeleteRecord('money','${x.id}')">Delete</button></div></div>`).join('')||'<div class="empty-state">No transactions logged.</div>';const n=document.getElementById('lifeSavingsSummary');if(n){const goal=Number(lifeSavings.target)||0,current=Number(lifeSavings.current)||0,pct=goal?Math.min(100,Math.round(current/goal*100)):0;n.innerHTML=goal?`<div class="lifeos-note">${lifeEsc(lifeSavings.name||'Savings goal')}: ${lifeFmtGBP(current)} of ${lifeFmtGBP(goal)} (${pct}%). Remaining ${lifeFmtGBP(Math.max(0,goal-current))}. This is a manually maintained figure, not a bank balance.</div><div style="height:8px;background:var(--line);border-radius:99px;overflow:hidden"><div style="height:100%;width:${pct}%;background:var(--green)"></div></div>`:''}const sn=document.getElementById('lifeSavingsName'),st=document.getElementById('lifeSavingsTarget'),sc=document.getElementById('lifeSavingsCurrent');if(sn&&document.activeElement!==sn)sn.value=lifeSavings.name||'';if(st&&document.activeElement!==st)st.value=lifeSavings.target||'';if(sc&&document.activeElement!==sc)sc.value=lifeSavings.current||''}
function lifeSaveSavings(){const name=document.getElementById('lifeSavingsName').value.trim(),target=Number(document.getElementById('lifeSavingsTarget').value),current=Number(document.getElementById('lifeSavingsCurrent').value||0);if(!name||!Number.isFinite(target)||target<=0||target>10000000||!Number.isFinite(current)||current<0||current>10000000){alert('Enter a goal name, target above £0, and current savings between £0 and £10,000,000.');return}lifeSavings={name:name.slice(0,100),target:Math.round(target*100)/100,current:Math.round(current*100)/100,updated:new Date().toISOString()};if(!lifePersist(LIFEOS_KEYS.savings,lifeSavings))return;lifeLog('Updated savings goal',`${name} · ${lifeFmtGBP(target)}`);lifeRenderMoney();lifeRenderHistory()}
function lifeAddMeal(){const name=document.getElementById('lifeMealName').value.trim(),cal=Number(document.getElementById('lifeMealCalories').value),protein=Number(document.getElementById('lifeMealProtein').value),date=document.getElementById('lifeMealDate').value||localISODate();if(!name){alert('Enter a meal or food name.');return}if(!Number.isFinite(cal)||cal<0||cal>10000||!Number.isFinite(protein)||protein<0||protein>500){alert('Enter valid calorie and protein estimates.');return}const item={id:lifeId('f'),date,name:name.slice(0,120),calories:Math.round(cal),protein:Math.round(protein*10)/10,note:document.getElementById('lifeMealNote').value.trim().slice(0,160),created:new Date().toISOString()};lifeMeals.unshift(item);if(!lifePersist(LIFEOS_KEYS.meals,lifeMeals))return;lifeLog('Logged meal',`${name} · ${item.calories} kcal · ${item.protein} g protein`);document.getElementById('lifeMealName').value='';document.getElementById('lifeMealCalories').value='';document.getElementById('lifeMealProtein').value='';document.getElementById('lifeMealNote').value='';lifeRenderMeals();lifeRenderOverview()}
function lifeRenderMeals(){const sum=document.getElementById('lifeMealSummary'),list=document.getElementById('lifeMealList');if(!sum||!list)return;const day=document.getElementById('lifeMealDate').value||localISODate(),rows=lifeMeals.filter(x=>x.date===day),cal=rows.reduce((a,x)=>a+x.calories,0),pro=rows.reduce((a,x)=>a+x.protein,0);sum.innerHTML=`<div class="lifeos-stat-grid"><div class="lifeos-stat"><strong>${cal}</strong><span>kcal · selected day</span></div><div class="lifeos-stat"><strong>${pro.toFixed(1)} g</strong><span>Protein · selected day</span></div></div>`;list.innerHTML=lifeMeals.slice(0,12).map(x=>`<div class="lifeos-list-item"><strong>${lifeEsc(x.name)}</strong><small>${lifeEsc(x.date)} · ${x.calories} kcal · ${x.protein} g protein${x.note?' · '+lifeEsc(x.note):''}</small><div class="lifeos-actions"><button class="btn btn-secondary" onclick="lifeDeleteRecord('meals','${x.id}')">Delete</button></div></div>`).join('')||'<div class="empty-state">No meals logged yet.</div>'}
function lifeAddRoutine(){const name=document.getElementById('lifeRoutineName').value.trim();if(!name){alert('Enter a routine name.');return}lifeRoutines.push({id:lifeId('r'),name:name.slice(0,120),area:document.getElementById('lifeRoutineArea').value,cadence:document.getElementById('lifeRoutineCadence').value,checks:{},created:new Date().toISOString()});if(!lifePersist(LIFEOS_KEYS.routines,lifeRoutines))return;lifeLog('Added routine',name);document.getElementById('lifeRoutineName').value='';lifeRenderRoutines();lifeRenderOverview()}
function lifeToggleRoutine(id,checked){const r=lifeRoutines.find(x=>x.id===id);if(!r)return;if(!r.checks||typeof r.checks!=='object')r.checks={};r.checks[localISODate()]=!!checked;if(!lifePersist(LIFEOS_KEYS.routines,lifeRoutines))return;lifeLog(checked?'Completed routine':'Unchecked routine',r.name);lifeRenderRoutines()}
function lifeRenderRoutines(){const el=document.getElementById('lifeRoutineList');if(!el)return;const today=localISODate();el.innerHTML=lifeRoutines.length?lifeRoutines.map(r=>`<div class="lifeos-list-item"><label style="display:flex;gap:8px;align-items:center;color:var(--text)"><input style="width:18px" type="checkbox" ${r.checks&&r.checks[today]?'checked':''} onchange="lifeToggleRoutine('${r.id}',this.checked)"><strong>${lifeEsc(r.name)}</strong></label><small>${lifeEsc(r.area)} · ${lifeEsc(r.cadence)} · ${r.checks&&r.checks[today]?'Completed today':'Not checked today'}</small><div class="lifeos-actions"><button class="btn btn-secondary" onclick="lifeDeleteRecord('routines','${r.id}')">Delete</button></div></div>`).join(''):'<div class="empty-state">No routines yet.</div>'}
function lifeAddReading(){const title=document.getElementById('lifeReadTitle').value.trim(),url=document.getElementById('lifeReadUrl').value.trim(),notes=document.getElementById('lifeReadNotes').value.trim();if(!title){alert('Enter a resource title.');return}if(url){try{const u=new URL(url);if(!['http:','https:'].includes(u.protocol))throw new Error()}catch(e){alert('Enter a valid http or https URL, or leave it blank.');return}}lifeReading.unshift({id:lifeId('b'),title:title.slice(0,180),url:url.slice(0,500),notes:notes.slice(0,1200),status:'to-read',created:new Date().toISOString()});if(!lifePersist(LIFEOS_KEYS.reading,lifeReading))return;lifeLog('Saved resource',title);['lifeReadTitle','lifeReadUrl','lifeReadNotes'].forEach(id=>document.getElementById(id).value='');lifeRenderReading()}
function lifeToggleReading(id){const x=lifeReading.find(y=>y.id===id);if(!x)return;x.status=x.status==='done'?'to-read':'done';x.updated=new Date().toISOString();lifePersist(LIFEOS_KEYS.reading,lifeReading);lifeLog(x.status==='done'?'Completed resource':'Reopened resource',x.title);lifeRenderReading()}
function lifeRenderReading(){const el=document.getElementById('lifeReadingList');if(!el)return;el.innerHTML=lifeReading.length?lifeReading.slice(0,30).map(x=>`<div class="lifeos-list-item"><strong>${lifeEsc(x.title)}</strong><small>${x.status==='done'?'Completed':'To read / review'}${x.notes?' · '+lifeEsc(x.notes):''}</small>${x.url?`<small><a href="${lifeEsc(x.url)}" target="_blank" rel="noopener noreferrer">Open resource ↗</a></small>`:''}<div class="lifeos-actions"><button class="btn btn-secondary" onclick="lifeToggleReading('${x.id}')">${x.status==='done'?'Mark to read':'Mark completed'}</button><button class="btn btn-secondary" onclick="lifeDeleteRecord('reading','${x.id}')">Delete</button></div></div>`).join(''):'<div class="empty-state">No resources saved.</div>'}
function lifeAddDecision(){const title=document.getElementById('lifeDecisionTitle').value.trim();if(!title){alert('Enter a decision title.');return}lifeDecisions.unshift({id:lifeId('d'),title:title.slice(0,180),reason:document.getElementById('lifeDecisionReason').value.trim().slice(0,1500),expectation:document.getElementById('lifeDecisionExpectation').value.trim().slice(0,500),review:document.getElementById('lifeDecisionReview').value,created:new Date().toISOString()});if(!lifePersist(LIFEOS_KEYS.decisions,lifeDecisions))return;lifeLog('Recorded decision',title);['lifeDecisionTitle','lifeDecisionReason','lifeDecisionExpectation','lifeDecisionReview'].forEach(id=>document.getElementById(id).value='');lifeRenderDecisions()}
function lifeRenderDecisions(){const el=document.getElementById('lifeDecisionList');if(!el)return;el.innerHTML=lifeDecisions.length?lifeDecisions.slice(0,20).map(x=>`<div class="lifeos-list-item"><strong>${lifeEsc(x.title)}</strong><small>Recorded ${new Date(x.created).toLocaleDateString()}${x.review?' · review '+lifeEsc(x.review):''}${x.expectation?' · expected: '+lifeEsc(x.expectation):''}</small>${x.reason?`<p>${lifeEsc(x.reason)}</p>`:''}<div class="lifeos-actions"><button class="btn btn-secondary" onclick="lifeDeleteRecord('decisions','${x.id}')">Delete</button></div></div>`).join(''):'<div class="empty-state">No decisions recorded.</div>'}
function lifeRenderAnalytics(){const el=document.getElementById('lifeAnalytics');if(!el)return;const today=localISODate(),weekStart=localISODate(new Date(Date.now()-6*86400000)),open=tasks.filter(taskIsOpen),done=tasks.filter(t=>t.status==='done'&&(t.updated||'').slice(0,10)>=weekStart),wk=workoutLog.filter(w=>w.date>=weekStart&&w.date<=today),money=lifeMoney.filter(x=>(x.date||'').startsWith(today.slice(0,7))),expenses=money.filter(x=>x.type==='expense').reduce((a,x)=>a+x.amount,0),meals=lifeMeals.filter(x=>x.date===today),cal=meals.reduce((a,x)=>a+x.calories,0),prot=meals.reduce((a,x)=>a+x.protein,0),tonnage=wk.reduce((sum,w)=>{const load=Number(w.load),sets=Number(w.sets),reps=Number.parseInt(w.reps,10);return sum+(Number.isFinite(load)&&load>0&&Number.isFinite(sets)&&sets>0&&Number.isInteger(reps)&&reps>0&&reps<=100?load*sets*reps:0)},0);let best=null;for(const w of workoutLog){const load=Number(w.load),reps=Number.parseInt(w.reps,10);if(Number.isFinite(load)&&load>0&&Number.isInteger(reps)&&reps>0&&reps<=12){const e=load*(1+reps/30);if(!best||e>best.value)best={exercise:w.exercise,value:e}}}el.innerHTML=`<div class="lifeos-stat-grid"><div class="lifeos-stat"><strong>${done.length}</strong><span>Tasks completed · 7d</span></div><div class="lifeos-stat"><strong>${open.length}</strong><span>Open tasks</span></div><div class="lifeos-stat"><strong>${wk.length}</strong><span>Training entries · 7d</span></div><div class="lifeos-stat"><strong>${Math.round(tonnage).toLocaleString('en-GB')} kg</strong><span>Logged volume · 7d*</span></div><div class="lifeos-stat"><strong>${lifeFmtGBP(expenses)}</strong><span>Expenses · month</span></div><div class="lifeos-stat"><strong>${cal}</strong><span>Logged kcal · today</span></div><div class="lifeos-stat"><strong>${prot.toFixed(1)} g</strong><span>Logged protein · today</span></div><div class="lifeos-stat"><strong>${lifeReading.filter(x=>x.status==='done').length}/${lifeReading.length}</strong><span>Resources completed</span></div><div class="lifeos-stat"><strong>${best?Math.round(best.value)+' kg':'—'}</strong><span>Highest estimated 1RM</span></div></div><div class="lifeos-note">${best?'Highest logged Epley estimate: '+lifeEsc(best.exercise)+' at about '+Math.round(best.value)+' kg. This may not be comparable across exercises.':'Log a numeric load and reps (1–12) in Training Lab to calculate an estimated 1RM.'} *Logged volume sums load × sets × parsed reps only where entries are numeric and comparable; bodyweight work and boxing drills may be excluded. Trends are descriptive; missing logs do not mean no activity occurred.</div>`}
function lifeRenderHistory(){const el=document.getElementById('lifeChangeList');if(!el)return;el.innerHTML=lifeHistory.length?lifeHistory.slice(0,30).map(x=>`<div class="lifeos-list-item"><strong>${lifeEsc(x.action)}</strong><small>${new Date(x.at).toLocaleString()} · ${lifeEsc(x.detail)}</small>${x.undo?`<div class="lifeos-actions"><button class="btn btn-secondary" onclick="lifeUndoChange('${x.id}')">Undo due-date change</button></div>`:''}</div>`).join(''):'<div class="empty-state">No changes recorded yet.</div>'}
function lifeUndoChange(historyId){const entry=lifeHistory.find(x=>x.id===historyId&&x.undo&&x.undo.type==='taskDue');if(!entry)return;const t=tasks.find(x=>x.id===entry.undo.taskId);if(!t){alert('The original task no longer exists; this change cannot be undone safely.');return}if((t.due||'')!==entry.undo.after){alert('The task due date has changed since this entry. No changes were made.');return}if(!confirm(`Undo approved due-date change for \"${t.title}\"?\n\n${entry.undo.after} → ${entry.undo.before||'no due date'}`))return;const after=entry.undo.after,before=entry.undo.before;t.due=before;t.updated=new Date().toISOString();persistTasks();entry.undo=null;lifePersist(LIFEOS_KEYS.history,lifeHistory);lifeLog('Undid task reschedule',`${t.title}: ${after} → ${before||'none'}`);renderTasks();renderCommandCentre();lifeRenderCapacity();lifeRenderHistory();lifeRenderOverview()}
function lifeClearHistory(){if(!confirm('Clear the Life OS change history? This will not delete tasks, finances, routines or other records.'))return;lifeHistory=[];lifePersist(LIFEOS_KEYS.history,lifeHistory);lifeRenderHistory()}
function lifeRenderDiagnostics(){const el=document.getElementById('lifeDiagnostics');if(!el)return;let bytes=0,keys=0;try{for(let i=0;i<localStorage.length;i++){const k=localStorage.key(i);if(k&&k.startsWith('bp_')){keys++;bytes+=(localStorage.getItem(k)||'').length*2}}}catch(e){}const sw=('serviceWorker' in navigator)?'Service worker API supported':'Service worker API unavailable';el.innerHTML=`<div class="lifeos-list-item"><strong>${navigator.onLine?'Browser reports online':'Browser reports offline'}</strong><small>Connectivity is only a browser signal; an online connection does not prove a remote resource is reachable.</small></div><div class="lifeos-list-item"><strong>${sw}</strong><small>Registered worker: ${('serviceWorker' in navigator)&&!!navigator.serviceWorker.controller?'controlling this page':'not currently controlling this page'}.</small></div><div class="lifeos-list-item"><strong>${keys} local data keys · ${(bytes/1024).toFixed(1)} KB estimated</strong><small>Estimate counts UTF-16 string storage only and is not the browser's actual quota.</small></div><div class="lifeos-list-item"><strong>Backup / restore</strong><small>Use System → Export backup before major updates. Full automatic cache integrity testing is not available from this panel.</small></div>`}
function lifeDeleteRecord(type,id){const map={inbox:['lifeInbox',LIFEOS_KEYS.inbox],money:['lifeMoney',LIFEOS_KEYS.money],meals:['lifeMeals',LIFEOS_KEYS.meals],routines:['lifeRoutines',LIFEOS_KEYS.routines],reading:['lifeReading',LIFEOS_KEYS.reading],decisions:['lifeDecisions',LIFEOS_KEYS.decisions]},item=map[type];if(!item)return;if(!confirm('Delete this record?'))return;const varName=item[0],arr=({lifeInbox,lifeMoney,lifeMeals,lifeRoutines,lifeReading,lifeDecisions})[varName];const found=arr.find(x=>x.id===id);const next=arr.filter(x=>x.id!==id);if(varName==='lifeInbox')lifeInbox=next;if(varName==='lifeMoney')lifeMoney=next;if(varName==='lifeMeals')lifeMeals=next;if(varName==='lifeRoutines')lifeRoutines=next;if(varName==='lifeReading')lifeReading=next;if(varName==='lifeDecisions')lifeDecisions=next;if(!lifePersist(item[1],next))return;lifeLog('Deleted '+type+' record',found?(found.title||found.name||found.text||found.exercise||found.category||'record'):'record');lifeRenderAll()}
// Update live previews when the relevant inputs change.
document.addEventListener('change',e=>{if(e.target&&['lifeRescheduleTask','lifeRescheduleDate'].includes(e.target.id))lifeUpdateReschedulePreview();if(e.target&&e.target.id==='lifeMealDate')lifeRenderMeals()});
window.addEventListener('online',()=>{if(document.getElementById('view-lifeos')&&!document.getElementById('view-lifeos').classList.contains('hidden'))lifeRenderDiagnostics()});

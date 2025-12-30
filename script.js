// v12.1 (felfri) – basrader återställda, robust knappar, deletable custom rows, nattläge
// Storage keys
const CTX_KEY='budget_ctx'; const PREFS_KEY='budget_prefs'; const BUDGET_KEY='budget_rows'; const HIDDEN_KEY='budget_hidden'; const SHARED_KEY='budget_shared'; const VIEWPREFS_KEY='budget_viewPrefs'; const ROWPAID_KEY='budget_rowPaid'; const SNAPSHOT_KEY='budget_snapshot';
const keyNeutral=(y,m)=>`budget_${y}-${m}`; const key112=(y,m)=>`budgetV112_${y}-${m}`; const key113=(y,m)=>`budgetV113_${y}-${m}`;
let currentMonth='01';

// Utils
const fmtKr=new Intl.NumberFormat('sv-SE',{style:'currency',currency:'SEK',maximumFractionDigits:0}); const kr=n=>fmtKr.format(Math.round(n||0));
const parseDec=s=>{ if(s==null) return 0; const v=String(s).trim().replace(',','.'); const n=parseFloat(v); return isNaN(n)?0:n };
const $=sel=>document.querySelector(sel); function Y(){return document.getElementById('year').value}
function toast(msg){ const t=$('#toast'); if(!t) return; t.textContent=msg; t.classList.add('show'); setTimeout(()=> t.classList.remove('show'), 4000) }

// Global stores
const getPrefs=()=>{ try{ return JSON.parse(localStorage.getItem(PREFS_KEY)||'{}') }catch{ return {} } };
const setPrefs=p=> localStorage.setItem(PREFS_KEY, JSON.stringify(p||{}));
const getBudget=()=>{ try{ return JSON.parse(localStorage.getItem(BUDGET_KEY)||'{}') }catch{ return {} } };
const setBudget=b=> localStorage.setItem(BUDGET_KEY, JSON.stringify(b||{}));
const getHidden=()=>{ try{ return JSON.parse(localStorage.getItem(HIDDEN_KEY)||'[]') }catch{ return [] } };
const setHidden=arr=>localStorage.setItem(HIDDEN_KEY, JSON.stringify(arr||[]));
const getShared=()=>{ try{ return JSON.parse(localStorage.getItem(SHARED_KEY)||'[]') }catch{ return [] } };
const setShared=arr=>localStorage.setItem(SHARED_KEY, JSON.stringify(arr||[]));
const getViewPrefs=()=>{ try{ return JSON.parse(localStorage.getItem(VIEWPREFS_KEY)||'{}') }catch{ return {} } };
const setViewPrefs=vp=> localStorage.setItem(VIEWPREFS_KEY, JSON.stringify(vp||{}));
const getRowPaid=()=>{ try{ return JSON.parse(localStorage.getItem(ROWPAID_KEY)||'{}') }catch{ return {} } };
const setRowPaid=obj=> localStorage.setItem(ROWPAID_KEY, JSON.stringify(obj||{}));
const getSnapshot=()=>{ try{ return JSON.parse(localStorage.getItem(SNAPSHOT_KEY)||'null') }catch{ return null } };
const setSnapshot=s=>{ if(s==null) localStorage.removeItem(SNAPSHOT_KEY); else localStorage.setItem(SNAPSHOT_KEY, JSON.stringify(s)) };

// Defaults: Global budget ON, per-row OFF
function ensureDefaults(){ const p=getPrefs(); if(p.budgetMode===undefined){ p.budgetMode=true; setPrefs(p); }
  const b=getBudget(); b.rows=b.rows||{}; b.rowsMode=b.rowsMode||{};
  document.querySelectorAll('label.cat, label.custom').forEach(l=>{ const id=l.dataset.id; if(!(id in b.rowsMode)) b.rowsMode[id]=false; }); setBudget(b); }

// Month storage – best source
function readBestMonth(y,m){ const keys=[keyNeutral(y,m),key113(y,m),key112(y,m)]; let best=null; keys.forEach(k=>{ const raw=localStorage.getItem(k); if(!raw) return; try{ const d=JSON.parse(raw); const richness = JSON.stringify(d).length + Object.keys(d||{}).length*10; if(!best || richness>(best.richness||0)){ best={key:k,data:d,richness} } }catch{} }); return best }

// People + focus-clear
function defaultPersons(){ return [{name:'', salary:''}] }
function readPersons(){ return [...document.querySelectorAll('.person-card')].map(card=>({ name: card.querySelector('.name')?.value||'', salary: parseDec(card.querySelector('.salary')?.value||'') })) }
function renderPersons(list){ const grid=document.getElementById('personGrid'); grid.innerHTML=''; (list&&list.length? list: defaultPersons()).forEach((p,i)=> addPersonCard(p.name,p.salary, i===0)); updateSharesUI(true); }
function addPersonCard(name='', salary='', isPrimary=false){ const grid=document.getElementById('personGrid'); const card=document.createElement('div'); card.className='person-card'; card.innerHTML=`<div class="head"><span class="ico">${isPrimary?'🧑':'👤'}</span><input class="name focus-clear" data-placeholder="Namn" type="text" placeholder="Namn" value="${name}"></div><input class="salary focus-clear" data-placeholder="Lön" type="text" inputmode="decimal" placeholder="Lön" value="${salary}"><button class="del" ${isPrimary?'disabled':''} title="Ta bort">🗑️</button>`; const nameEl=card.querySelector('.name'); const salEl=card.querySelector('.salary'); [nameEl,salEl].forEach(el=>{ el.addEventListener('focus', focusClearOnFocus); el.addEventListener('blur', focusClearOnBlur); }); nameEl.addEventListener('input',()=>{ calc(); scheduleSave(); updateSharesUI(true); }); salEl.addEventListener('input',()=>{ calc(); scheduleSave(); updateSharesUI(true); }); card.querySelector('.del').addEventListener('click',()=>{ if(!isPrimary){ card.remove(); calc(); scheduleSave(); updateSharesUI(true); }}); grid.appendChild(card); }
function focusClearOnFocus(e){ const el=e.target; const ph=el.getAttribute('data-placeholder')||''; if(el.value===ph || el.value==='') { el.value=''; el.setSelectionRange?.(0,0); } }
function focusClearOnBlur(e){ /* keep empty if user leaves it blank */ }

// Budget toggles
function isRowBudgetOn(id){ const b=getBudget(); return !!((b.rowsMode||{})[id]) }
function setRowBudget(id, on){ const b=getBudget(); b.rowsMode=b.rowsMode||{}; b.rowsMode[id]=!!on; setBudget(b) }
function toggleRowBudget(label){ const id=label.dataset.id; setRowBudget(id, !isRowBudgetOn(id)); applyBudgetVisibilityFor(label); renderAudit(); scheduleSave(); }
function applyBudgetVisibility(){ const on=!!getPrefs().budgetMode; const hdrBtn=document.getElementById('budgetModeToggle'); if(hdrBtn) hdrBtn.textContent=`🎯 Budgetläge: ${on?'ON':'OFF'}`; document.querySelectorAll('label.cat, label.custom').forEach(applyBudgetVisibilityFor); const auditSec=document.querySelector('.sec.audit'); if(auditSec) auditSec.style.display = on? 'block':'none'; }
function applyBudgetVisibilityFor(label){ const on=!!getPrefs().budgetMode; const id=label.dataset.id; const rowOn=isRowBudgetOn(id); const show = on && rowOn; const extra=label.querySelector('.row-extra'); if(extra) extra.style.display= show? 'flex':'none'; const btn=label.querySelector('.budgetCat'); if(btn){ btn.textContent='🎯'+(rowOn?' ON':' OFF'); btn.classList.toggle('active', rowOn); } updateRowBudgetUI(label); }

function readRowBudget(label){ const inp=label.querySelector('.budget'); return parseDec(inp?.value||'') }
function updateRowBudgetUI(label){ const on=!!getPrefs().budgetMode; const id=label.dataset.id; const rowOn=isRowBudgetOn(id); const show = on && rowOn; const box=label.querySelector('.row-budget'); if(!box) return; const budget=readRowBudget(label); const amountEl=document.getElementById(id) || label.querySelector('.c-val'); const val=parseDec(amountEl?.value||''); const bar=box.querySelector('.bar>div'); const txt=box.querySelector('.txt'); if(!show || !budget){ bar.style.width='0%'; box.classList.remove('over','near'); txt.textContent='—'; return } const pct = Math.min(150, Math.round(val*100/budget)); bar.style.width=pct+'%'; box.classList.remove('over','near'); if(pct>100) box.classList.add('over'); else if(pct>=90) box.classList.add('near'); const diff=val-budget; const pctDiff=budget>0? ((val/budget-1)*100):0; txt.textContent=`Utfallet: ${kr(val)} | Avvikelse: ${(diff>=0?'+':'−')}${kr(Math.abs(diff))} (${pctDiff.toFixed(1)}%)`; }
function updateAllRowBudgets(){ document.querySelectorAll('label.cat').forEach(updateRowBudgetUI); document.querySelectorAll('label.custom').forEach(updateRowBudgetUI); }

// Row buttons via event delegation, including delete for custom rows
addEventListener('click', (e)=>{
  const label = e.target.closest('label.cat, label.custom');
  if(!label) return;
  if(e.target.closest('.budgetCat')){ toggleRowBudget(label); return }
  if(e.target.closest('.hideCat')){ toggleHideCat(label); return }
  if(e.target.closest('.shareCat')){ toggleShareCat(label); return }
  if(e.target.closest('.payCat')){ togglePaymentsDrawer(label); return }
  if(e.target.closest('.delRow')){ if(label.classList.contains('custom')){ label.remove(); scheduleSave(); calc(); toast('Rad borttagen'); } return }
});
addEventListener('input',(e)=>{
  const label=e.target.closest('label.cat, label.custom'); if(!label) return;
  if(e.target.classList.contains('budget')){ updateRowBudgetUI(label); calc(); scheduleSave(); }
  if(e.target.classList.contains('c-val') || (e.target.id && e.target.closest('label.cat'))){ calc(); scheduleSave(); updateRowShare(label); updateAllRowBudgets(); }
});

// Hidden / Share
const toggleHideCat=(label)=>{ const id=label.dataset.id; const h=getHidden(); label.classList.toggle('hidden'); if(label.classList.contains('hidden')){ if(!h.includes(id)) h.push(id) } else { const i=h.indexOf(id); if(i>=0) h.splice(i,1) } setHidden(h); calc(); scheduleSave(); };
const toggleShareCat=(label)=>{ const id=label.dataset.id; const s=getShared(); label.classList.toggle('share'); if(label.classList.contains('share')){ if(!s.includes(id)) s.push(id) } else { const i=s.indexOf(id); if(i>=0) s.splice(i,1) } setShared(s); calc(); scheduleSave(); updateRowShare(label); };

// Share per person
function getHiddenPersons(){ return getViewPrefs().hiddenPersons||[] }
function ensureSplitRow(label){ let sr=label.querySelector('.split-row'); if(!sr){ sr=document.createElement('div'); sr.className='split-row'; label.appendChild(sr); } return sr }
function updateRowShare(label){ const hidden=getHidden(); const id=label.dataset.id; const shared=label.classList.contains('share'); let amount=0; if(label.classList.contains('custom')){ amount=parseDec(label.querySelector('.c-val')?.value||'') } else { amount= hidden.includes(id)?0: parseDec(document.getElementById(id)?.value||'') }
  const persons=readPersons(); const total=persons.reduce((s,p)=> s+(parseDec(p.salary)||0),0); const sr=ensureSplitRow(label); sr.innerHTML=''; if(!shared || amount<=0 || total<=0){ sr.style.display='none'; return } sr.style.display='flex'; const hiddenPersons=getHiddenPersons(); persons.filter(p=> !hiddenPersons.includes(p.name||''))?.forEach(p=>{ const share = amount * ( (parseDec(p.salary)||0) / total ); const pill=document.createElement('span'); pill.className='split-pill'; pill.textContent=`${p.name||'Person'}: ${kr(share)}`; sr.appendChild(pill); }) }
function updateAllRowShares(){ document.querySelectorAll('label.cat').forEach(updateRowShare); document.querySelectorAll('label.custom').forEach(updateRowShare); }

// Calc helpers & totals
function n(id){const el=document.getElementById(id); return parseDec(el?el.value:'') }
function sumSection(ids){ const hidden=getHidden(); return ids.reduce((s,id)=> s + (hidden.includes(id)?0:n(id)),0) }
function sumCustom(section){ const gridId=section==='fixed'?'fixedBaseGrid':section==='var'?'varBaseGrid':'saveBaseGrid'; return [...document.querySelectorAll(`#${gridId} label.custom`)].reduce((s,l)=> s+parseDec(l.querySelector('.c-val')?.value||''),0) }
function setText(id, txt){ const el=document.getElementById(id); if(el) el.textContent=txt }

function calc(){
  const persons=readPersons(); const salaries=persons.reduce((s,p)=> s+(parseDec(p.salary)||0),0);
  const income = salaries + n('formaner') + n('barnbidrag') + n('ink_ovrigt'); setText('sum_income', kr(income));
  const fors = sumSection(['personfors','barnfors','djurfors','hemfors','bilfors','fors_ovrigt']);
  const stream = sumSection(['stream_netflix','stream_spotify','stream_hbo','stream_ovrigt1','stream_ovrigt2']);
  const fixed = sumSection(['boende','bredband','telefoni','barnomsorg1','barnomsorg2','fackforbund']) + fors + stream + sumCustom('fixed'); setText('sum_fixed', kr(fixed));
  const fordon = sumSection(['bransle','service','skatt','parkering','fordon_ovrigt']);
  const vari = sumSection(['mat','hushall','klader','nojen','halsa','energi','ror_ovrigt']) + fordon + sumCustom('var'); setText('sum_var', kr(vari));
  const spar = sumSection(['spar1','spar2','spar3','spar4','spar5','spar6','skuld']) + sumCustom('save'); setText('sum_spar', kr(spar));
  const res = income - fixed - vari - spar; setText('resultat', kr(res));
  updateAllRowShares(); updateAllRowBudgets(); updateSharesUI(); renderAudit(); updateYearSummary(); }

// Year summary
function getMonthTotals(y,m){ const found=readBestMonth(y,m); if(!found) return {income:0,fixed:0,var:0,spar:0,res:0}; try{ const d=found.data; const dec=x=>parseDec(d[x]); const hidden=d['_hidden']||[]; const H=id=> hidden.includes(id)?0:dec(id); const persons=(d['_persons']||[{name:'',salary:0}]).reduce((s,p)=> s+(parseDec(p.salary)||0),0); const income = persons + dec('formaner') + dec('barnbidrag') + dec('ink_ovrigt'); const fixed = (H('boende')+H('bredband')+H('telefoni')+H('barnomsorg1')+H('barnomsorg2')+H('fackforbund')) + (H('personfors')+H('barnfors')+H('djurfors')+H('hemfors')+H('bilfors')+H('fors_ovrigt')) + (H('stream_netflix')+H('stream_spotify')+H('stream_hbo')+H('stream_ovrigt1')+H('stream_ovrigt2')) + (d['_fixedCustom']||[]).reduce((s,c)=> s+(parseDec(c.value)||0),0); const vari = (H('mat')+H('hushall')+H('klader')+H('nojen')+H('halsa')+H('energi')+H('ror_ovrigt')) + (H('bransle')+H('service')+H('skatt')+H('parkering')+H('fordon_ovrigt')) + (d['_varCustom']||[]).reduce((s,c)=> s+(parseDec(c.value)||0),0); const spar = (H('spar1')+H('spar2')+H('spar3')+H('spar4')+H('spar5')+H('spar6')+H('skuld')) + (d['_saveCustom']||[]).reduce((s,c)=> s+(parseDec(c.value)||0),0); const res = income - fixed - vari - spar; return {income,fixed,var:vari,spar,res}; }catch{ return {income:0,fixed:0,var:0,spar:0,res:0} } }
function updateYearSummary(){ const y=Y(); const ms=['01','02','03','04','05','06','07','08','09','10','11','12']; let yi=0,yf=0,yv=0,ys=0,yr=0; ms.forEach(m=>{ const t=getMonthTotals(y,m); yi+=t.income; yf+=t.fixed; yv+=t.var; ys+=t.spar; yr+=t.res; }); setText('y_income', kr(yi)); setText('y_fixed', kr(yf)); setText('y_var', kr(yv)); setText('y_spar', kr(ys)); setText('y_result', kr(yr)); }

// CSV/PDF
function exportMonthCSV(){ const rows=[["År",Y()],["Månad",currentMonth]]; const add=(a,b)=>rows.push([a,b]); const read=id=>document.getElementById(id)?.value||''; rows.push([]);
  rows.push(['Person','Lön']); readPersons().forEach(p=> rows.push([p.name,p.salary])); rows.push([]);
  add('Förmåner',read('formaner')); add('Barnbidrag',read('barnbidrag')); add('Övrig inkomst',read('ink_ovrigt')); add('Summa inkomster',document.getElementById('sum_income').textContent); rows.push([]);
  ['boende','bredband','telefoni','barnomsorg1','barnomsorg2','fackforbund','personfors','barnfors','djurfors','hemfors','bilfors','fors_ovrigt','stream_netflix','stream_spotify','stream_hbo','stream_ovrigt1','stream_ovrigt2','mat','hushall','klader','nojen','halsa','energi','ror_ovrigt','bransle','service','skatt','parkering','fordon_ovrigt','spar1','spar2','spar3','spar4','spar5','spar6','skuld'].forEach(id=> add(id, read(id)) ); rows.push([]);
  rows.push(['Egna rader','Belopp']); document.querySelectorAll('label.custom').forEach(l=>{ rows.push([l.querySelector('.c-name')?.value||'Egen', parseDec(l.querySelector('.c-val')?.value||'')]) }); rows.push([]);
  add('Summa fasta',document.getElementById('sum_fixed').textContent); add('Summa rörliga',document.getElementById('sum_var').textContent); add('Summa spar/skuld',document.getElementById('sum_spar').textContent); rows.push([]);
  add('Resultat',document.getElementById('resultat').textContent);
  const csv=rows.map(r=>r.join(';')).join('\n'); const blob=new Blob([csv],{type:'text/csv;charset=utf-8;'}); const url=URL.createObjectURL(blob); const a=document.createElement('a'); a.href=url; a.download=`budget_${Y()}-${currentMonth}.csv`; a.click(); URL.revokeObjectURL(url); }

async function exportPDF(){ const { jsPDF } = window.jspdf; const doc = new jsPDF({orientation:'p', unit:'pt'}); const m=40; let y=m; const T=(t,v='')=>{ doc.text(`${t} ${v}`, m, y); y+=18; };
  doc.setFontSize(16); doc.text('Hushållsbudget – Månad', m, y); y+=24; doc.setFontSize(12);
  T('Inkomster:', document.getElementById('sum_income').textContent); T('Fasta:', document.getElementById('sum_fixed').textContent); T('Rörliga:', document.getElementById('sum_var').textContent); T('Spar/Skuld:', document.getElementById('sum_spar').textContent); T('Resultat:', document.getElementById('resultat').textContent);
  doc.save(`budget_${Y()}-${currentMonth}.pdf`);
}

// Save/Load
let saveTimer=null; const scheduleSave=()=>{ clearTimeout(saveTimer); saveTimer=setTimeout(()=>{ saveMonth(); saveCtx(); },300) };
function saveMonth(){ const ids=['period','namn','formaner','barnbidrag','ink_ovrigt','boende','bredband','telefoni','barnomsorg1','barnomsorg2','fackforbund','personfors','barnfors','djurfors','hemfors','bilfors','fors_ovrigt','stream_netflix','stream_spotify','stream_hbo','stream_ovrigt1','stream_ovrigt2','mat','hushall','klader','nojen','halsa','energi','ror_ovrigt','bransle','service','skatt','parkering','fordon_ovrigt','spar1','spar2','spar3','spar4','spar5','spar6','skuld']; const d={}; ids.forEach(id=>{ const el=document.getElementById(id); if(el) d[id]=el.value }); d['_persons']=readPersons(); d['_fixedCustom']=readCustom('fixed'); d['_varCustom']=readCustom('var'); d['_saveCustom']=readCustom('save'); d['_hidden']=getHidden(); d['_shared']=getShared(); d['_viewPrefs']=getViewPrefs(); d['_rowPaid']=getRowPaid(); d['_budget']=getBudget(); d['_snapshot']=getSnapshot(); d['_prefs']=getPrefs(); localStorage.setItem(keyNeutral(Y(), currentMonth), JSON.stringify(d)); }
function saveCtx(){ localStorage.setItem(CTX_KEY, JSON.stringify({y:Y(), m:currentMonth})) }
function readCustom(section){ const gridId=section==='fixed'?'fixedBaseGrid':section==='var'?'varBaseGrid':'saveBaseGrid'; return [...document.querySelectorAll(`#${gridId} label.custom`)].map(l=>({ name:l.querySelector('.c-name')?.value||'', value: parseDec(l.querySelector('.c-val')?.value||''), share: l.classList.contains('share'), id:l.dataset.id, section })) }

function loadMonth(m){ currentMonth=m; document.querySelectorAll('.month-buttons button').forEach(b=>b.classList.toggle('active',b.dataset.month===m));
  const ids=['period','namn','formaner','barnbidrag','ink_ovrigt','boende','bredband','telefoni','barnomsorg1','barnomsorg2','fackforbund','personfors','barnfors','djurfors','hemfors','bilfors','fors_ovrigt','stream_netflix','stream_spotify','stream_hbo','stream_ovrigt1','stream_ovrigt2','mat','hushall','klader','nojen','halsa','energi','ror_ovrigt','bransle','service','skatt','parkering','fordon_ovrigt','spar1','spar2','spar3','spar4','spar5','spar6','skuld']; ids.forEach(id=>{ const el=document.getElementById(id); if(el) el.value='' }); ['fixedBaseGrid','varBaseGrid','saveBaseGrid'].forEach(g=>{ document.querySelectorAll(`#${g} label.custom`).forEach(n=>n.remove()); });
  const found=readBestMonth(Y(), m);
  if(found){ try{ const d=found.data; ids.forEach(id=>{ const el=document.getElementById(id); if(el && d[id]!==undefined) el.value=d[id] }); renderPersons(d['_persons']&&d['_persons'].length? d['_persons']: defaultPersons()); (d['_fixedCustom']||[]).forEach(c=>{ const l=makeCustomLabel('fixed', c.name, c.value, !!c.share); document.getElementById('fixedBaseGrid').appendChild(l); }); (d['_varCustom']||[]).forEach(c=>{ const l=makeCustomLabel('var', c.name, c.value, !!c.share); document.getElementById('varBaseGrid').appendChild(l); }); (d['_saveCustom']||[]).forEach(c=>{ const l=makeCustomLabel('save', c.name, c.value, !!c.share); document.getElementById('saveBaseGrid').appendChild(l); }); if(d['_hidden']) setHidden(d['_hidden']); if(d['_shared']) setShared(d['_shared']); if(d['_viewPrefs']) setViewPrefs(d['_viewPrefs']); if(d['_rowPaid']) setRowPaid(d['_rowPaid']); if(d['_budget']) setBudget(d['_budget']); if(d['_snapshot']) setSnapshot(d['_snapshot']); if(d['_prefs']) setPrefs(d['_prefs']); toast('Data lästes'); }catch{}
  } else { renderPersons(defaultPersons()); }
  ensureDefaults(); applyBudgetVisibility(); calc(); updatePeriod(); updateYearSummary(); drawPie(); updateSharesUI(true); updateAllRowShares(); updateAllRowBudgets(); renderAudit(); saveCtx(); }

function resetMonth(){ ['fixedBaseGrid','varBaseGrid','saveBaseGrid'].forEach(g=>{ document.querySelectorAll(`#${g} label.custom`).forEach(n=>n.remove()); }); renderPersons(defaultPersons()); setViewPrefs({hiddenPersons:[]}); setRowPaid({}); setSnapshot(null); saveMonth(); calc(); drawPie(); updateSharesUI(true); updateAllRowShares(); applyBudgetVisibility(); updateAllRowBudgets(); renderAudit(); }
function copyPrev(){ const n=parseInt(currentMonth,10); const pm=n>1? String(n-1).padStart(2,'0'):null; if(!pm) return alert('Ingen föregående månad'); const found=readBestMonth(Y(), pm); if(!found) return alert('Föregående månad saknar data'); try{ const d=found.data; ['fixedBaseGrid','varBaseGrid','saveBaseGrid'].forEach(g=>{ document.querySelectorAll(`#${g} label.custom`).forEach(n=>n.remove()); }); renderPersons(defaultPersons()); Object.keys(d).forEach(id=>{ const el=document.getElementById(id); if(el) el.value=d[id]||'' }); renderPersons(d['_persons']&&d['_persons'].length? d['_persons']: defaultPersons()); (d['_fixedCustom']||[]).forEach(c=>{ const l=makeCustomLabel('fixed', c.name, c.value, !!c.share); document.getElementById('fixedBaseGrid').appendChild(l); }); (d['_varCustom']||[]).forEach(c=>{ const l=makeCustomLabel('var', c.name, c.value, !!c.share); document.getElementById('varBaseGrid').appendChild(l); }); (d['_saveCustom']||[]).forEach(c=>{ const l=makeCustomLabel('save', c.name, c.value, !!c.share); document.getElementById('saveBaseGrid').appendChild(l); }); if(d['_hidden']) setHidden(d['_hidden']); if(d['_shared']) setShared(d['_shared']); if(d['_viewPrefs']) setViewPrefs(d['_viewPrefs']); if(d['_rowPaid']) setRowPaid(d['_rowPaid']); if(d['_budget']) setBudget(d['_budget']); if(d['_snapshot']) setSnapshot(d['_snapshot']); if(d['_prefs']) setPrefs(d['_prefs']); ensureDefaults(); calc(); scheduleSave(); updateSharesUI(true); applyBudgetVisibility(); updateAllRowShares(); updateAllRowBudgets(); renderAudit(); toast(`Kopierade från ${pm}`); }catch{} }

// Chart
let pie; function drawPie(){ try{ const ctx=document.getElementById('pie'); if(!ctx) return; const data={ labels:['Fasta','Rörliga','Spar/Skuld'], datasets:[{ data:[ parseInt(document.getElementById('sum_fixed').textContent.replace(/[^0-9\-]/g,''))||0, parseInt(document.getElementById('sum_var').textContent.replace(/[^0-9\-]/g,''))||0, parseInt(document.getElementById('sum_spar').textContent.replace(/[^0-9\-]/g,''))||0 ], backgroundColor:['#f59e0b','#ef4444','#22c55e']}]}; if(pie) pie.destroy(); pie=new Chart(ctx,{type:'pie', data, options:{plugins:{legend:{position:'bottom'}}}});}catch{}}

function updatePeriod(){ const names={'01':'Jan','02':'Feb','03':'Mar','04':'Apr','05':'Maj','06':'Jun','07':'Jul','08':'Aug','09':'Sep','10':'Okt','11':'Nov','12':'Dec'}; const el=document.getElementById('period'); if(el) el.value=`${names[currentMonth]} ${Y()}` }

// Custom labels with delete button
let customIdSeq=0;
function makeCustomLabel(section, name='', value='', share=false){ const label=document.createElement('label'); label.className='cat custom'; const id=`c_${section}_${++customIdSeq}`; label.dataset.id=id; label.dataset.section=section; if(share) label.classList.add('share'); const ico='🧩';
  label.innerHTML=`<div class="cat-header"><span class="ico">${ico}</span><input class="c-name focus-clear" data-placeholder="Kategori" type="text" placeholder="Kategori" value="${name}"></div>
  <input class="c-val focus-clear" data-placeholder="Belopp" type="text" inputmode="decimal" placeholder="Belopp" value="${value}">
  <div class="row-ctl"><button class="hideCat" title="Dölj">👁️</button><button class="shareCat" title="Delas">🔗</button><button class="payCat" title="Betalningar">💳</button><button class="budgetCat" title="Budget ON/OFF">🎯</button><button class="delRow" title="Ta bort">🗑️</button></div>
  <div class="row-extra"><span class="budget-wrap">🎯 Budget <input class="budget" type="text" inputmode="decimal" placeholder="kr"></span><div class="row-budget"><div class="bar"><div></div></div><small class="txt">—</small></div></div>`;
  label.querySelectorAll('.focus-clear').forEach(el=>{ el.addEventListener('focus', focusClearOnFocus); el.addEventListener('blur', focusClearOnBlur); });
  return label }

function addCustomTo(section){ const gridId=section==='fixed'?'fixedBaseGrid':section==='var'?'varBaseGrid':'saveBaseGrid'; const grid=document.getElementById(gridId); const label=makeCustomLabel(section,'','', false); grid.appendChild(label); ensureDefaults(); applyBudgetVisibilityFor(label); calc(); scheduleSave(); }

// Theme (dark mode)
function applyTheme(){ const t=localStorage.getItem('budget_theme')||'light'; const d=$('#darkToggle'); if(t==='dark'){ document.documentElement.setAttribute('data-theme','dark'); if(d) d.textContent='☀️'; } else { document.documentElement.removeAttribute('data-theme'); if(d) d.textContent='🌙'; } }
function toggleTheme(){ const dark=document.documentElement.getAttribute('data-theme')==='dark'; localStorage.setItem('budget_theme', dark?'light':'dark'); applyTheme() }

// Init
window.addEventListener('DOMContentLoaded',()=>{
  applyTheme();
  document.getElementById('darkToggle').addEventListener('click',toggleTheme);
  document.getElementById('budgetModeToggle').addEventListener('click',()=>{ const p=getPrefs(); p.budgetMode= !(p.budgetMode); setPrefs(p); applyBudgetVisibility(); updateAllRowBudgets(); renderAudit(); scheduleSave(); });
  document.getElementById('addPersonBtn').addEventListener('click',()=>{ addPersonCard('', '', false); calc(); scheduleSave(); updateSharesUI(true); });
  document.getElementById('addFixedCustom').addEventListener('click',()=> addCustomTo('fixed'));
  document.getElementById('addVarCustom').addEventListener('click',()=> addCustomTo('var'));
  document.getElementById('addSaveCustom').addEventListener('click',()=> addCustomTo('save'));
  document.getElementById('copyPrevBtn').addEventListener('click',copyPrev);
  document.getElementById('resetMonthBtn').addEventListener('click',()=>{ if(confirm('Rensa alla fält för aktuell månad?')) resetMonth(); });
  document.getElementById('csvBtn').addEventListener('click',exportMonthCSV);
  document.getElementById('yearCsvBtn').addEventListener('click',exportYearCSV);
  document.getElementById('pdfBtn').addEventListener('click',exportPDF);
  document.getElementById('year').addEventListener('change',()=>{ loadMonth(currentMonth); scheduleSave(); });
  document.querySelectorAll('.month-buttons button').forEach(btn=> btn.addEventListener('click',()=>{ loadMonth(btn.dataset.month); scheduleSave(); }));

  try{ const ctx=JSON.parse(localStorage.getItem(CTX_KEY)||'null'); if(ctx && [...document.getElementById('year').options].some(o=>o.value==ctx.y)){ document.getElementById('year').value=ctx.y; loadMonth(ctx.m); return; } }catch{}
  const m=String(new Date().getMonth()+1).padStart(2,'0'); loadMonth(m);
});

// Service worker
if('serviceWorker' in navigator){ window.addEventListener('load',()=>{ navigator.serviceWorker.register('sw.js?v=12.1'); }); }

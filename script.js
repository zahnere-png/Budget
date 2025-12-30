// v11.2.1 (hotfix) – enhetliga månadsnycklar + migrering från v11.2/v11.3
// ---- Namespaces & keys ----
const CTX_KEY='budget_ctx'; // neutral
const PREFS_KEY='budget_prefs'; // { budgetMode }
const BUDGET_KEY='budget_rows'; // { rows:{}, rowsMode:{ id:true/false } }
const HIDDEN_KEY='budget_hidden';
const SHARED_KEY='budget_shared';
const VIEWPREFS_KEY='budget_viewPrefs';
const ROWPAID_KEY='budget_rowPaid';
const SNAPSHOT_KEY='budget_snapshot';

// Neutral per‑månadnyckel
const keyNeutral=(y,m)=>`budget_${y}-${m}`;
// Gamla varianter
const key112=(y,m)=>`budgetV112_${y}-${m}`;
const key113=(y,m)=>`budgetV113_${y}-${m}`;

// ---- Utils ----
const fmtKr=new Intl.NumberFormat('sv-SE',{style:'currency',currency:'SEK',maximumFractionDigits:0});
const kr=n=>fmtKr.format(Math.round(n||0));
const parseDec=s=>{ if(s==null) return 0; const v=String(s).trim().replace(',','.'); const n=parseFloat(v); return isNaN(n)?0:n };
function Y(){return document.getElementById('year').value}
let currentMonth='01';

// ---- Persistence helpers ----
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

// ---- Defaults ----
function ensureDefaults(){ const p=getPrefs(); if(p.budgetMode===undefined){ p.budgetMode=false; setPrefs(p); } const b=getBudget(); b.rows=b.rows||{}; b.rowsMode=b.rowsMode||{}; // v11.2: per-rad default ON
  document.querySelectorAll('label.cat, label.custom').forEach(l=>{ const id=l.dataset.id; if(!(id in b.rowsMode)) b.rowsMode[id]=true; }); setBudget(b); }

// ---- Month storage: read & migrate ----
function readMonthRaw(y,m){ // tries neutral -> v11.3 -> v11.2
  const kN=keyNeutral(y,m), k113=key113(y,m), k112=key112(y,m);
  const rawN=localStorage.getItem(kN);
  if(rawN) return {raw:rawN, source:'neutral', key:kN};
  const raw113=localStorage.getItem(k113);
  if(raw113) return {raw:raw113, source:'v113', key:k113};
  const raw112=localStorage.getItem(k112);
  if(raw112) return {raw:raw112, source:'v112', key:k112};
  return null;
}
function migrateMonth(y,m){ const found=readMonthRaw(y,m); if(!found) return false; try{ const d=JSON.parse(found.raw); localStorage.setItem(keyNeutral(y,m), JSON.stringify(d)); return true }catch{ return false } }
function migrateYear(y){ const months=['01','02','03','04','05','06','07','08','09','10','11','12']; let moved=0; months.forEach(m=>{ if(migrateMonth(y,m)) moved++; }); return moved }

// ---- People ----
function defaultPersons(){ return [{name:'Du', salary:0}] }
function readPersons(){ return [...document.querySelectorAll('.person-card')].map(card=>({ name: card.querySelector('.name')?.value||'Du', salary: parseDec(card.querySelector('.salary')?.value||'') })) }
function renderPersons(list){ const grid=document.getElementById('personGrid'); if(!grid) return; grid.innerHTML=''; (list||defaultPersons()).forEach((p,i)=> addPersonCard(p.name,p.salary, i===0)); updateSharesUI(true); }
function addPersonCard(name='Du', salary='', isPrimary=false){ const grid=document.getElementById('personGrid'); if(!grid) return; const card=document.createElement('div'); card.className='person-card'; card.innerHTML=`<div class="head"><span class="ico">${isPrimary?'🧑':'👤'}</span><input class="name" type="text" placeholder="Namn" value="${name}"></div><input class="salary" type="text" inputmode="decimal" placeholder="Lön" value="${salary}"><button class="del" ${isPrimary?'disabled':''} title="Ta bort">🗑️</button>`; const nameEl=card.querySelector('.name'); const salEl=card.querySelector('.salary'); nameEl.addEventListener('input',()=>{ calc(); scheduleSave(); updateSharesUI(true); }); salEl.addEventListener('input',()=>{ calc(); scheduleSave(); updateSharesUI(true); }); card.querySelector('.del').addEventListener('click',()=>{ if(!isPrimary){ card.remove(); calc(); scheduleSave(); updateSharesUI(true); }}); grid.appendChild(card); }

// ---- Budget ON/OFF per rad ----
function isRowBudgetOn(id){ const b=getBudget(); return !!((b.rowsMode||{})[id]) }
function setRowBudget(id, on){ const b=getBudget(); b.rowsMode=b.rowsMode||{}; b.rowsMode[id]=!!on; setBudget(b) }
function toggleRowBudget(label){ const id=label.dataset.id; setRowBudget(id, !isRowBudgetOn(id)); applyBudgetVisibilityFor(label); renderAudit(); scheduleSave(); }

function applyBudgetVisibility(){ const p=getPrefs(); const on=!!p.budgetMode; const hdrBtn=document.getElementById('budgetModeToggle'); if(hdrBtn) hdrBtn.textContent=`🎯 Budgetläge: ${on?'ON':'OFF'}`; document.querySelectorAll('label.cat, label.custom').forEach(applyBudgetVisibilityFor); const auditSec=document.querySelector('.sec.audit'); if(auditSec) auditSec.style.display = on? 'block':'none'; }
function applyBudgetVisibilityFor(label){ const p=getPrefs(); const on=!!p.budgetMode; const id=label.dataset.id; const rowOn=isRowBudgetOn(id); const show = on && rowOn; const extra=label.querySelector('.row-extra'); if(extra) extra.style.display= show? 'flex':'none'; const btn=label.querySelector('.budgetCat'); if(btn){ btn.textContent='🎯'+(rowOn?' ON':' OFF'); btn.classList.toggle('active', rowOn); } updateRowBudgetUI(label); }

function readRowBudget(label){ const inp=label.querySelector('.budget'); return parseDec(inp?.value||'') }
function updateRowBudgetUI(label){ const p=getPrefs(); const on=!!p.budgetMode; const id=label.dataset.id; const rowOn=isRowBudgetOn(id); const show = on && rowOn; const box=label.querySelector('.row-budget'); if(!box) return; const budget=readRowBudget(label); const amountEl=document.getElementById(id) || label.querySelector('.c-val'); const val=parseDec(amountEl?.value||''); const bar=box.querySelector('.bar>div'); const txt=box.querySelector('.txt'); if(!show || !budget){ bar.style.width='0%'; box.classList.remove('over','near'); txt.textContent='—'; return } const pct = Math.min(150, Math.round(val*100/budget)); bar.style.width=pct+'%'; box.classList.remove('over','near'); if(pct>100) box.classList.add('over'); else if(pct>=90) box.classList.add('near'); const diff=val-budget; const pctDiff=budget>0? ((val/budget-1)*100):0; txt.textContent=`Utfallet: ${kr(val)} | Avvikelse: ${(diff>=0?'+':'−')}${kr(Math.abs(diff))} (${pctDiff.toFixed(1)}%)`; }
function updateAllRowBudgets(){ document.querySelectorAll('label.cat').forEach(updateRowBudgetUI); document.querySelectorAll('label.custom').forEach(updateRowBudgetUI); }

// ---- Event delegation för radknappar ----
document.addEventListener('click', (e)=>{
  const budgetBtn = e.target.closest('.budgetCat');
  if(budgetBtn){ const label = budgetBtn.closest('label.cat, label.custom'); if(label) toggleRowBudget(label); }
  const hideBtn = e.target.closest('.hideCat'); if(hideBtn){ const label=hideBtn.closest('label.cat, label.custom'); toggleHideCat(label); }
  const shareBtn = e.target.closest('.shareCat'); if(shareBtn){ const label=shareBtn.closest('label.cat, label.custom'); toggleShareCat(label); }
  const payBtn = e.target.closest('.payCat'); if(payBtn){ const label=payBtn.closest('label.cat, label.custom'); togglePaymentsDrawer(label); }
});

document.addEventListener('input',(e)=>{
  if(e.target.classList.contains('budget')){ const label=e.target.closest('label.cat, label.custom'); updateRowBudgetUI(label); calc(); scheduleSave(); }
  if(e.target.classList.contains('c-val') || (e.target.id && e.target.closest('label.cat'))){ calc(); scheduleSave(); updateRowShare(e.target.closest('label.cat, label.custom')); updateAllRowBudgets(); }
});

// ---- Hidden/Shared ----
const toggleHideCat=(label)=>{ const id=label.dataset.id; const h=getHidden(); label.classList.toggle('hidden'); if(label.classList.contains('hidden')){ if(!h.includes(id)) h.push(id) } else { const i=h.indexOf(id); if(i>=0) h.splice(i,1) } setHidden(h); calc(); scheduleSave(); };
const toggleShareCat=(label)=>{ const id=label.dataset.id; const s=getShared(); label.classList.toggle('share'); if(label.classList.contains('share')){ if(!s.includes(id)) s.push(id) } else { const i=s.indexOf(id); if(i>=0) s.splice(i,1) } setShared(s); calc(); scheduleSave(); updateRowShare(label); };

// ---- Share per person (light) ----
function updateRowShare(label){ /* simplified in hotfix */ }
function updateSharesUI(){ /* NOP in hotfix */ }

// ---- Calc helpers ----
function n(id){const el=document.getElementById(id); return parseDec(el?el.value:'') }
function setText(id, txt){ const el=document.getElementById(id); if(el) el.textContent=txt }

// ---- Calc ----
function calc(){
  const income = n('formaner') + n('barnbidrag') + n('ink_ovrigt');
  setText('sum_income', kr(income));
  const fixed = n('boende') + n('bredband') + n('telefoni') + n('fackforbund');
  const vari = n('mat') + n('energi');
  const res = income - fixed - vari;
  setText('sum_fixed', kr(fixed));
  setText('sum_var', kr(vari));
  setText('resultat', kr(res));
  updateAllRowBudgets();
  renderAudit();
}

// ---- Snapshot & audit ----
function buildCurrentTotals(){ const income = n('formaner') + n('barnbidrag') + n('ink_ovrigt'); const fixed = n('boende') + n('bredband') + n('telefoni') + n('fackforbund'); const vari = n('mat') + n('energi'); const rows={}; ['boende','bredband','telefoni','fackforbund','mat','energi'].forEach(id=> rows[id]= n(id)); return {income,fixed,var:vari,spar:0,res: income-fixed-vari, rows} }
function closeMonth(){ const totals=buildCurrentTotals(); setSnapshot({ closedAt: new Date().toISOString(), totals }); saveMonth(); renderAudit(); }
function openMonth(){ setSnapshot(null); saveMonth(); renderAudit(); }

function renderAudit(){ const wrap=document.getElementById('auditTable'); if(!wrap) return; const prefs=getPrefs(); wrap.innerHTML=''; if(!prefs.budgetMode){ wrap.innerHTML='<p>Budgetläge är AV. Tänd Budgetläge för att visa avstämning.</p>'; return } const snap=getSnapshot(); const b=getBudget(); const budgetRows=(b.rows)||{}; const rowsMode=(b.rowsMode)||{}; if(!snap){ wrap.innerHTML='<p>Ingen snapshot ännu. Stäng månaden för att låsa utfallet.</p>'; return } const t=snap.totals;
  const table=document.createElement('table'); const thead=document.createElement('thead'); const tbody=document.createElement('tbody'); thead.innerHTML='<tr><th>Del</th><th>Budget</th><th>Utfallet</th><th>Avvikelse</th><th>Avvikelse %</th></tr>'; const addRow=(name,b,actual)=>{ const diff=actual-(b||0); const pct=b>0? ((actual/b-1)*100): null; const tr=document.createElement('tr'); tr.innerHTML=`<td>${name}</td><td>${kr(b||0)}</td><td>${kr(actual)}</td><td>${diff>=0?'+':'−'}${kr(Math.abs(diff))}</td><td>${pct==null?'—': pct.toFixed(1)+'%'}</td>`; tbody.appendChild(tr) };
  const bFixed=sumBudgetOfSection('fixed', budgetRows, rowsMode); const bVar=sumBudgetOfSection('var', budgetRows, rowsMode); const bSave=0; const bTotal=(bFixed+bVar+bSave); addRow('Fasta', bFixed, t.fixed); addRow('Rörliga', bVar, t.var); addRow('Spar/Skuld', bSave, t.spar); addRow('TOTAL', bTotal, t.fixed+t.var+t.spar);
  table.appendChild(thead); table.appendChild(tbody); wrap.appendChild(table);
}
function sumBudgetOfSection(section, budgetRows, rowsMode){ const base = section==='fixed' ? ['boende','bredband','telefoni','fackforbund'] : ['mat','energi']; let s=0; base.forEach(id=>{ if(rowsMode[id]===false) return; if(budgetRows[id]) s+= parseDec(budgetRows[id]) }); return s }

// ---- Save / Load with neutral keys ----
function saveMonth(){ const ids=['period','namn','formaner','barnbidrag','ink_ovrigt','boende','bredband','telefoni','fackforbund','mat','energi']; const d={}; ids.forEach(id=>{ const el=document.getElementById(id); if(el) d[id]=el.value }); d['_budget']=getBudget(); d['_prefs']=getPrefs(); d['_snapshot']=getSnapshot(); localStorage.setItem(keyNeutral(Y(), currentMonth), JSON.stringify(d)); }
function saveCtx(){ localStorage.setItem(CTX_KEY, JSON.stringify({y:Y(), m:currentMonth})) }
function loadMonth(m){ currentMonth=m; document.querySelectorAll('.month-buttons button').forEach(b=>b.classList.toggle('active',b.dataset.month===m));
  // Töm fält
  const ids=['period','namn','formaner','barnbidrag','ink_ovrigt','boende','bredband','telefoni','fackforbund','mat','energi']; ids.forEach(id=>{ const el=document.getElementById(id); if(el) el.value='' });
  // Läs från neutral/v11.3/v11.2 och migrera
  const found=readMonthRaw(Y(), m);
  if(found){ try{ const d=JSON.parse(found.raw); ids.forEach(id=>{ const el=document.getElementById(id); if(el && d[id]!==undefined) el.value=d[id] }); if(d['_budget']) setBudget(d['_budget']); if(d['_prefs']) setPrefs(d['_prefs']); if(d['_snapshot']) setSnapshot(d['_snapshot']); // skriv till neutral om källa ej neutral
      if(found.source!=='neutral'){ localStorage.setItem(keyNeutral(Y(), m), JSON.stringify(d)); }
    }catch{}
  }
  ensureDefaults(); applyBudgetVisibility(); calc(); updatePeriod(); saveCtx(); }

// ---- Helpers ----
function updatePeriod(){ const names={'01':'Jan','02':'Feb','03':'Mar','04':'Apr','05':'Maj','06':'Jun','07':'Jul','08':'Aug','09':'Sep','10':'Okt','11':'Nov','12':'Dec'}; const el=document.getElementById('period'); if(el) el.value=`${names[currentMonth]} ${Y()}` }

// ---- UI binds ----
function toggleTheme(){ const dark=document.documentElement.getAttribute('data-theme')==='dark'; if(dark) document.documentElement.removeAttribute('data-theme'); else document.documentElement.setAttribute('data-theme','dark'); }

window.addEventListener('DOMContentLoaded',()=>{
  document.getElementById('darkToggle').addEventListener('click',toggleTheme);
  document.getElementById('budgetModeToggle').addEventListener('click',()=>{ const p=getPrefs(); p.budgetMode= !(p.budgetMode); setPrefs(p); applyBudgetVisibility(); updateAllRowBudgets(); renderAudit(); scheduleSave(); });
  document.querySelectorAll('.month-buttons button').forEach(btn=> btn.addEventListener('click',()=>{ loadMonth(btn.dataset.month); scheduleSave(); }));
  document.getElementById('year').addEventListener('change',()=>{ loadMonth(currentMonth); scheduleSave(); });
  document.getElementById('csvBtn').addEventListener('click',exportMonthCSV);
  document.getElementById('pdfBtn').addEventListener('click',exportPDF);
  document.getElementById('closeMonthBtn').addEventListener('click',closeMonth);
  document.getElementById('openMonthBtn').addEventListener('click',openMonth);
  document.getElementById('migrateYearBtn').addEventListener('click',()=>{ const moved=migrateYear(Y()); alert(`Migrering klar: flyttade ${moved} månadsfiler till neutral nyckel.`); });

  try{ const ctx=JSON.parse(localStorage.getItem(CTX_KEY)||'null'); if(ctx && [...document.getElementById('year').options].some(o=>o.value==ctx.y)){ document.getElementById('year').value=ctx.y; loadMonth(ctx.m); return; } }catch{}
  const m=String(new Date().getMonth()+1).padStart(2,'0'); loadMonth(m);
});

let saveTimer=null; const scheduleSave=()=>{ clearTimeout(saveTimer); saveTimer=setTimeout(()=>{ saveMonth(); saveCtx(); },300) };

// ---- Exports ----
function exportMonthCSV(){ const rows=[["År",Y()],["Månad",currentMonth]]; const add=(a,b)=>rows.push([a,b]); const read=id=>document.getElementById(id)?.value||''; rows.push([]);
  add('Förmåner',read('formaner')); add('Barnbidrag',read('barnbidrag')); add('Övrig inkomst',read('ink_ovrigt'));
  add('Hyra/Bolån',read('boende')); add('Bredband',read('bredband')); add('Telefoni',read('telefoni')); add('Fackförbund',read('fackforbund'));
  add('Mat',read('mat')); add('El/Värme',read('energi')); rows.push([]);
  add('Summa fasta',document.getElementById('sum_fixed').textContent); add('Summa rörliga',document.getElementById('sum_var').textContent); add('Resultat',document.getElementById('resultat').textContent);
  const csv=rows.map(r=>r.join(';')).join('\n'); const blob=new Blob([csv],{type:'text/csv;charset=utf-8;'}); const url=URL.createObjectURL(blob); const a=document.createElement('a'); a.href=url; a.download=`budget_${Y()}-${currentMonth}.csv`; a.click(); URL.revokeObjectURL(url); }

async function exportPDF(){ const { jsPDF } = window.jspdf; const doc = new jsPDF({orientation:'p', unit:'pt'}); const m=40; let y=m; const T=(t,v='')=>{ doc.text(`${t} ${v}`, m, y); y+=18; };
  doc.setFontSize(16); doc.text('Hushållsbudget – Månad', m, y); y+=24; doc.setFontSize(12);
  T('Inkomster:', document.getElementById('sum_income').textContent); T('Fasta:', document.getElementById('sum_fixed').textContent); T('Rörliga:', document.getElementById('sum_var').textContent); T('Resultat:', document.getElementById('resultat').textContent);
  doc.save(`budget_${Y()}-${currentMonth}.pdf`);
}

// ---- SW registration with cache-bust ----
if('serviceWorker' in navigator){ window.addEventListener('load',()=>{ navigator.serviceWorker.register('sw.js?v=1121'); }); }

// v11.3 – Defaults: global budgetMode = ON, per-row rowsMode = OFF
const CTX_KEY='budgetV113_ctx';
const PREFS_KEY='budgetV113_prefs'; // { budgetMode: true }
const BUDGET_KEY='budgetV113_budget'; // { rows:{}, rowsMode:{ id:false } }

const parseDec=s=>{ if(s==null) return 0; const v=String(s).trim().replace(',','.'); const n=parseFloat(v); return isNaN(n)?0:n };
const kr=n=> new Intl.NumberFormat('sv-SE',{style:'currency',currency:'SEK',maximumFractionDigits:0}).format(Math.round(n||0));

// Prefs (global budget)
const getPrefs=()=>{ try{ return JSON.parse(localStorage.getItem(PREFS_KEY)||'{}') }catch{ return {} } };
const setPrefs=p=> localStorage.setItem(PREFS_KEY, JSON.stringify(p||{}));

// Budget
const getBudget=()=>{ try{ return JSON.parse(localStorage.getItem(BUDGET_KEY)||'{}') }catch{ return {} } };
const setBudget=b=> localStorage.setItem(BUDGET_KEY, JSON.stringify(b||{}));

// Init defaults
function ensureDefaults(){ const p=getPrefs(); if(p.budgetMode===undefined){ p.budgetMode=true; setPrefs(p); } const b=getBudget(); b.rows=b.rows||{}; b.rowsMode=b.rowsMode||{}; // Default per‑rad OFF: sätt bara default=false när ej satt
  document.querySelectorAll('label.cat, label.custom').forEach(l=>{ const id=l.dataset.id; if(!(id in b.rowsMode)) b.rowsMode[id]=false; }); setBudget(b); }

// Helpers
function isRowBudgetOn(id){ const b=getBudget(); return !!((b.rowsMode||{})[id]) }
function toggleRowBudget(label){ const id=label.dataset.id; const b=getBudget(); b.rowsMode=b.rowsMode||{}; b.rowsMode[id]= !isRowBudgetOn(id); setBudget(b); applyBudgetVisibilityFor(label); }

function applyBudgetVisibility(){ const p=getPrefs(); const on=!!p.budgetMode; const hdrBtn=document.getElementById('budgetModeToggle'); if(hdrBtn) hdrBtn.textContent=`🎯 Budgetläge: ${on?'ON':'OFF'}`; document.querySelectorAll('label.cat, label.custom').forEach(applyBudgetVisibilityFor); }
function applyBudgetVisibilityFor(label){ const p=getPrefs(); const on=!!p.budgetMode; const id=label.dataset.id; const rowOn=isRowBudgetOn(id); const show = on && rowOn; const extra=label.querySelector('.row-extra'); if(extra) extra.style.display= show? 'flex':'none'; const btn=label.querySelector('.budgetCat'); if(btn){ btn.textContent='🎯'+(rowOn?' ON':' OFF'); btn.classList.toggle('active', rowOn); } updateRowBudgetUI(label); }

function updateRowBudgetUI(label){ const p=getPrefs(); const on=!!p.budgetMode; const id=label.dataset.id; const rowOn=isRowBudgetOn(id); const show = on && rowOn; const box=label.querySelector('.row-budget'); if(!box) return; const budget=parseDec(label.querySelector('.budget')?.value||''); const amountEl=document.getElementById(id) || label.querySelector('.c-val'); const val=parseDec(amountEl?.value||''); const bar=box.querySelector('.bar>div'); const txt=box.querySelector('.txt'); if(!show || !budget){ bar.style.width='0%'; box.classList.remove('over','near'); txt.textContent='—'; return } const pct = Math.min(150, Math.round(val*100/budget)); bar.style.width=pct+'%'; box.classList.remove('over','near'); if(pct>100) box.classList.add('over'); else if(pct>=90) box.classList.add('near'); const diff=val-budget; const pctDiff=budget>0? ((val/budget-1)*100):0; txt.textContent=`Utfallet: ${kr(val)} | Avvikelse: ${(diff>=0?'+':'−')}${kr(Math.abs(diff))} (${pctDiff.toFixed(1)}%)`; }

function bindBase(){ document.querySelectorAll('label.cat').forEach(l=>{ const budgetBtn=l.querySelector('.budgetCat'); const budget=l.querySelector('.budget'); const amount=document.getElementById(l.dataset.id); budgetBtn&&budgetBtn.addEventListener('click',()=> toggleRowBudget(l)); budget&&budget.addEventListener('input',()=> updateRowBudgetUI(l)); amount&&amount.addEventListener('input',()=> updateRowBudgetUI(l)); }); }

// Header actions
function bindHeader(){ document.getElementById('budgetModeToggle').addEventListener('click',()=>{ const p=getPrefs(); p.budgetMode=!p.budgetMode; setPrefs(p); applyBudgetVisibility(); }); const darkBtn=document.getElementById('darkToggle'); darkBtn&&darkBtn.addEventListener('click',()=>{ const dark=document.documentElement.getAttribute('data-theme')==='dark'; if(dark) document.documentElement.removeAttribute('data-theme'); else document.documentElement.setAttribute('data-theme','dark'); }); }

// Init
window.addEventListener('DOMContentLoaded',()=>{ ensureDefaults(); bindHeader(); bindBase(); applyBudgetVisibility(); });

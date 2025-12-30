
// Minimal v11.2.1 patch: make row budget button work even when global mode is OFF
const PREFS_KEY='budgetV112_prefs';
const BUDGET_KEY='budgetV112_budget';
const parseDec=s=>{ if(s==null) return 0; const v=String(s).trim().replace(',','.'); const n=parseFloat(v); return isNaN(n)?0:n };
const kr=n=> new Intl.NumberFormat('sv-SE',{style:'currency',currency:'SEK',maximumFractionDigits:0}).format(Math.round(n||0));
const getPrefs=()=>{ try{ return JSON.parse(localStorage.getItem(PREFS_KEY)||'{}') }catch{ return {} } };
const setPrefs=p=>localStorage.setItem(PREFS_KEY, JSON.stringify(p||{}));
const getBudget=()=>{ try{ return JSON.parse(localStorage.getItem(BUDGET_KEY)||'{}') }catch{ return {} } };
const setBudget=b=>localStorage.setItem(BUDGET_KEY, JSON.stringify(b||{}));
function isRowBudgetOn(id){ const b=getBudget(); return (b.rowsMode||{})[id]!==false }
function toggleRowBudget(label){ const id=label.dataset.id; const b=getBudget(); b.rows=b.rows||{}; b.rowsMode=b.rowsMode||{}; const cur=isRowBudgetOn(id); const next=!cur; b.rowsMode[id]=next; setBudget(b);
  // NEW: If global budget mode is OFF and user turns a row ON, auto‑enable global mode
  const prefs=getPrefs(); if(next && !prefs.budgetMode){ prefs.budgetMode=true; setPrefs(prefs); }
  applyBudgetVisibility(); updateRowBudgetUI(label); }
function applyBudgetVisibility(){ const prefs=getPrefs(); const on=!!prefs.budgetMode; const hdrBtn=document.getElementById('budgetModeToggle'); if(hdrBtn) hdrBtn.textContent=`🎯 Budgetläge: ${on?'ON':'OFF'}`;
  document.querySelectorAll('label.cat').forEach(l=>{ const id=l.dataset.id; const rowOn=isRowBudgetOn(id); const show= on && rowOn; const extra=l.querySelector('.row-extra'); if(extra) extra.style.display= show? 'block':'none'; const btn=l.querySelector('.budgetCat'); if(btn){ btn.textContent='🎯'+(rowOn?' ON':' OFF') } }); }
function updateRowBudgetUI(label){ const id=label.dataset.id; const show = !!getPrefs().budgetMode && isRowBudgetOn(id); const box=label.querySelector('.row-budget'); const budget=parseDec(label.querySelector('.budget')?.value||''); const val=parseDec(document.getElementById(id)?.value||''); const bar=box.querySelector('.bar>div'); const txt=box.querySelector('.txt'); if(!show || !budget){ bar.style.width='0%'; txt.textContent='—'; return } const pct = Math.min(150, Math.round(val*100/budget)); bar.style.width=pct+'%'; const diff=val-budget; txt.textContent=`Utfallet: ${kr(val)} | Avvikelse: ${(diff>=0?'+':'−')}${kr(Math.abs(diff))}`; }

function init(){ const grid=document.getElementById('fixedBaseGrid'); const label=grid.querySelector('label.cat'); const budgetBtn=label.querySelector('.budgetCat'); const budgetInp=label.querySelector('.budget'); const amountInp=document.getElementById('boende');
  budgetBtn.addEventListener('click',()=> toggleRowBudget(label));
  budgetInp.addEventListener('input',()=> updateRowBudgetUI(label));
  amountInp.addEventListener('input',()=> updateRowBudgetUI(label));
  const prefs=getPrefs(); if(prefs.budgetMode===undefined){ setPrefs({budgetMode:false}) }
  document.getElementById('budgetModeToggle').addEventListener('click',()=>{ const p=getPrefs(); p.budgetMode=!p.budgetMode; setPrefs(p); applyBudgetVisibility(); updateRowBudgetUI(label); });
  applyBudgetVisibility(); updateRowBudgetUI(label);
}
window.addEventListener('DOMContentLoaded',init);

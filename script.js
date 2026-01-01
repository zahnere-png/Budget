// v12.4.1 – delning fokus‑clear + budget default OFF
const CTX_KEY='budget_ctx'; const PREFS_KEY='budget_prefs'; const SHAREMANUAL_KEY='budget_shareManual';
let currentMonth='01';

const fmtKr=new Intl.NumberFormat('sv-SE',{style:'currency',currency:'SEK',maximumFractionDigits:0}); const kr=n=>fmtKr.format(Math.round(n||0));
const parseDec=s=>{ if(s==null) return 0; const v=String(s).trim().replace(',','.'); const n=parseFloat(v); return isNaN(n)?0:n };
const $=sel=>document.querySelector(sel); function Y(){return document.getElementById('year')?.value||String(new Date().getFullYear())}

const getPrefs=()=>{ try{ return JSON.parse(localStorage.getItem(PREFS_KEY)||'{}') }catch{ return {} } };
const setPrefs=p=> localStorage.setItem(PREFS_KEY, JSON.stringify(p||{}));
const getShareManual=()=>{ try{ return JSON.parse(localStorage.getItem(SHAREMANUAL_KEY)||'{}') }catch{ return {} } };
const setShareManual=o=> localStorage.setItem(SHAREMANUAL_KEY, JSON.stringify(o||{}));

// === Defaults: Budget MODE default OFF ===
function ensureDefaults(){ const p=getPrefs(); if(p.budgetMode===undefined){ p.budgetMode=false; setPrefs(p); } applyBudgetHeaderLabel(); }
function applyBudgetHeaderLabel(){ const hdrBtn=document.getElementById('budgetModeToggle'); const on=getPrefs().budgetMode; if(hdrBtn) hdrBtn.textContent=`🎯 Budgetläge: ${on?'ON':'OFF'}`; }

// === Manual share helpers ===
function manualKey(y,m,id,name){ return `${y}-${m}::${id}::${name||''}` }
function readManualShare(y,m,id,name){ const o=getShareManual(); const k=manualKey(y,m,id,name); return o[k] }
function writeManualShare(y,m,id,name,val){ const o=getShareManual(); const k=manualKey(y,m,id,name); if(val==null || val===''){ delete o[k] } else { o[k]=parseDec(val) } setShareManual(o); }

// === Focus‑clear for share input ===
function attachShareFocusClear(input, placeholderAmount){ try{ input.placeholder = String(Math.round(placeholderAmount||0)); input.addEventListener('focus', ()=>{ input.value=''; }); }catch{} }

// === Render share pills (API) ===
function renderRowShare(label, persons, amount){ const y=Y(); const m=currentMonth; const sr=label.querySelector('.split-row')||label.appendChild(Object.assign(document.createElement('div'),{className:'split-row'})); sr.innerHTML=''; if(amount<=0){ const hint=document.createElement('span'); hint.className='split-pill hint'; hint.textContent='Fyll i belopp för raden'; sr.appendChild(hint); return } const totalSalary = persons.reduce((s,p)=> s+(parseDec(p.salary)||0),0); if(totalSalary<=0){ const hint=document.createElement('span'); hint.className='split-pill hint'; hint.textContent='Fyll i löner för delning'; sr.appendChild(hint); return } persons.forEach(p=>{ const sal=parseDec(p.salary)||0; const recShareAmt = amount * (totalSalary>0? sal/totalSalary:0); const manual = readManualShare(y,m,label.dataset.id,p.name); const useVal = manual!=null ? manual : recShareAmt; const pctNow = amount>0? Math.round(useVal*100/amount):0; const pctRec = totalSalary>0? Math.round(sal*100/totalSalary):0; const pill=document.createElement('span'); pill.className='split-pill'; pill.innerHTML = `<span class="nm">${p.name||'Person'}</span>
      <input class="p-share" type="text" inputmode="decimal" value="${Math.round(useVal)}" />
      <span class="pct">nu: ${pctNow}%</span>
      <small class="hint">borde: ${pctRec}%</small>`; const inp=pill.querySelector('.p-share'); inp.dataset.personName = p.name||''; attachShareFocusClear(inp, recShareAmt); sr.appendChild(pill); }); }

// === Minimal stubs/hooks (to integrate with existing v12.4 code) ===
function updatePeriodTop(){ const names={'01':'Jan','02':'Feb','03':'Mar','04':'Apr','05':'Maj','06':'Jun','07':'Jul','08':'Aug','09':'Sep','10':'Okt','11':'Nov','12':'Dec'}; const el=document.getElementById('periodTop'); if(el) el.textContent=`${names[currentMonth]} ${Y()}` }

// === Init listeners (header buttons only for this patch file) ===
window.addEventListener('DOMContentLoaded',()=>{
  ensureDefaults(); applyBudgetHeaderLabel(); updatePeriodTop();
  document.getElementById('budgetModeToggle')?.addEventListener('click',()=>{ const p=getPrefs(); p.budgetMode= !(p.budgetMode); setPrefs(p); applyBudgetHeaderLabel(); });
});

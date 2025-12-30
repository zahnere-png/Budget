// ===== Format & utils =====
const fmtKr=new Intl.NumberFormat('sv-SE',{style:'currency',currency:'SEK',maximumFractionDigits:0});
const kr=n=>fmtKr.format(Math.round(n||0));
const parseDec=s=>{ if(s==null) return 0; const v=String(s).trim().replace(',','.'); const n=parseFloat(v); return isNaN(n)?0:n };

function Y(){return document.getElementById('year').value}
let currentMonth='01'; const CTX_KEY='budgetV11LastContext';
const HIDDEN_KEY='budgetV11_hidden';
const SHARED_KEY='budgetV11_shared';
const VIEWPREFS_KEY='budgetV11_viewPrefs';
const ROWPAID_KEY='budgetV11_rowPaid';

// ===== Icon mapping =====
function iconForName(name){ const n=(name||'').toLowerCase(); const M=[ [/hyra|bolån|boende|hus|lägenhet/,'🏠'], [/el|värme|energi|ström/,'⚡'], [/internet|bredband|wifi|fiber/,'🌐'], [/telefon|mobil|telef/,'📞'], [/mat|livs|ica|coop|handla/,'🛒'], [/kläder|skor|jacka|byxor/,'👟'], [/nöje|bio|underhållning|spel|game/,'🎉'], [/halsa|hälsa|gym|träning/,'💪'], [/bil|fordon|service|verkstad/,'🚗'], [/bränsle|bensin|diesel|laddning/,'⛽'], [/parkering|p-bot|pavgift/,'🅿️'], [/skatt|besiktning/,'🧾'], [/försäkring|hemförsäkring|bilförsäkring|personförsäkring|barnförsäkring/,'🛡️'], [/netflix|viaplay|hbo|max|disney|prime|stream/,'🎬'], [/spotify|musik|tidal|apple music/,'🎵'], [/barn|förskola|dagis|skola/,'👶'], [/fack|fackförbund|unionen|byggnads/,'🧰'], [/djur|hund|katt|veterinär/,'🐾'], [/spar|buffert|målspar|amortering/,'🐷'], [/skuld|lån/,'📉'], [/hushåll|toapapper|städ|förbrukning/,'🧼'] ]; for(const [re,ico] of M){ if(re.test(n)) return ico } return '🧩' }

// ===== Hidden / Shared / ViewPrefs =====
const getHidden=()=>{ try{ return JSON.parse(localStorage.getItem(HIDDEN_KEY)||'[]') }catch{ return [] } };
const setHidden=arr=>localStorage.setItem(HIDDEN_KEY, JSON.stringify(arr||[]));
const getShared=()=>{ try{ return JSON.parse(localStorage.getItem(SHARED_KEY)||'[]') }catch{ return [] } };
const setShared=arr=>localStorage.setItem(SHARED_KEY, JSON.stringify(arr||[]));
const getViewPrefs=()=>{ try{ return JSON.parse(localStorage.getItem(VIEWPREFS_KEY)||'{}') }catch{ return {} } };
const setViewPrefs=vp=> localStorage.setItem(VIEWPREFS_KEY, JSON.stringify(vp||{}));

const toggleHideCat=(label)=>{ const id=label.dataset.id; const h=getHidden(); label.classList.toggle('hidden'); if(label.classList.contains('hidden')){ if(!h.includes(id)) h.push(id) } else { const i=h.indexOf(id); if(i>=0) h.splice(i,1) } setHidden(h); calc(); scheduleSave(); };
const toggleShareCat=(label)=>{ const id=label.dataset.id; const s=getShared(); label.classList.toggle('share'); if(label.classList.contains('share')){ if(!s.includes(id)) s.push(id) } else { const i=s.indexOf(id); if(i>=0) s.splice(i,1) } setShared(s); calc(); scheduleSave(); updateRowShare(label); };

// ===== Persons =====
function defaultPersons(){ return [{name:'Du', salary:0}] }
function readPersons(){ return [...document.querySelectorAll('.person-card')].map(card=>({ name: card.querySelector('.name').value||'Du', salary: parseDec(card.querySelector('.salary').value||'') })) }
function renderPersons(list){ const grid=document.getElementById('personGrid'); grid.innerHTML=''; (list||defaultPersons()).forEach((p,i)=> addPersonCard(p.name,p.salary, i===0)); rebuildPaidRows(); updateSharesUI(true); }
function addPersonCard(name='Du', salary='', isPrimary=false){ const grid=document.getElementById('personGrid'); const card=document.createElement('div'); card.className='person-card'; card.innerHTML=`<div class="head"><span class="ico">${isPrimary?'🧑':'👤'}</span><input class="name" type="text" placeholder="Namn" value="${name}"></div><input class="salary" type="text" inputmode="decimal" placeholder="Lön" value="${salary}"><button class="del" ${isPrimary?'disabled':''} title="Ta bort">🗑️</button>`; const nameEl=card.querySelector('.name'); const salEl=card.querySelector('.salary'); nameEl.addEventListener('input',()=>{ calc(); scheduleSave(); updateSharesUI(true); rebuildPaidRows(); }); salEl.addEventListener('input',()=>{ calc(); scheduleSave(); updateSharesUI(true); }); card.querySelector('.del').addEventListener('click',()=>{ if(!isPrimary){ card.remove(); calc(); scheduleSave(); updateSharesUI(true); rebuildPaidRows(); }}); grid.appendChild(card); }

// ===== Budget per rad =====
function getBudget(){ try{ return JSON.parse(localStorage.getItem('budgetV11_budget')||'{}') }catch{ return {} } }
function setBudget(b){ localStorage.setItem('budgetV11_budget', JSON.stringify(b||{})) }
function readRowBudget(label){ const inp=label.querySelector('.budget'); return parseDec(inp?.value||'') }
function applyRowBudgetUI(label){ const budget=readRowBudget(label); const hidden=getHidden(); const id=label.dataset.id; const val = hidden.includes(id)?0: parseDec(document.getElementById(id)?.value|| label.querySelector('.c-val')?.value || ''); const box=label.querySelector('.row-budget'); if(!box) return; const bar=box.querySelector('.bar>div'); const txt=box.querySelector('.txt'); if(!budget){ bar.style.width='0%'; box.classList.remove('over','near'); txt.textContent='—'; return } const pct = budget>0? Math.min(150, Math.round(val*100/budget)):0; bar.style.width=pct+'%'; box.classList.remove('over','near'); if(pct>100) box.classList.add('over'); else if(pct>=90) box.classList.add('near'); const diff=val-budget; const sign= diff>=0? '+':'−'; const diffAbs=Math.abs(diff); const pctDiff = budget>0? ((val/budget-1)*100):0; txt.textContent=`Utfallet: ${kr(val)} | Avvikelse: ${sign}${kr(diffAbs)} (${pctDiff.toFixed(1)}%)`; }
function updateAllRowBudgets(){ document.querySelectorAll('label.cat').forEach(applyRowBudgetUI); document.querySelectorAll('label.custom').forEach(applyRowBudgetUI); }

// ===== Custom labels =====
let customIdSeq=0;
function makeCustomLabel(section, name='', value='', share=false){ const label=document.createElement('label'); label.className='cat custom'; const id=`c_${section}_${++customIdSeq}`; label.dataset.id=id; label.dataset.section=section; if(share) label.classList.add('share'); const ico=iconForName(name);
  label.innerHTML=`<div class="cat-header"><span class="ico">${ico}</span><input class="c-name" type="text" placeholder="Kategori" value="${name}"></div>
  <input class="c-val" type="text" inputmode="decimal" placeholder="Belopp" value="${value}">
  <div class="row-ctl"><button class="hideCat" title="Dölj">👁️</button><button class="shareCat" title="Delas">🔗</button><button class="payCat" title="Betalningar">💳</button></div>
  <div class="row-extra"><span class="budget-wrap">🎯 Budget <input class="budget" type="text" inputmode="decimal" placeholder="kr"></span><div class="row-budget"><div class="bar"><div></div></div><small class="txt">—</small></div></div>`;
  label.querySelector('.c-name').addEventListener('input',(e)=>{ label.querySelector('.ico').textContent=iconForName(e.target.value); calc(); scheduleSave(); updateRowShare(label); });
  label.querySelector('.c-val').addEventListener('input',()=>{ calc(); scheduleSave(); updateRowShare(label); updateAllRowBudgets(); });
  label.querySelector('.hideCat').addEventListener('click',()=> toggleHideCat(label));
  label.querySelector('.shareCat').addEventListener('click',()=> toggleShareCat(label));
  label.querySelector('.payCat').addEventListener('click',()=> togglePaymentsDrawer(label));
  label.querySelector('.budget').addEventListener('input',()=>{ calc(); scheduleSave(); updateAllRowBudgets(); });
  return label }
function addCustomTo(section){ const gridId=section==='fixed'?'fixedBaseGrid':section==='var'?'varBaseGrid':'saveBaseGrid'; const grid=document.getElementById(gridId); const label=makeCustomLabel(section,'','', false); grid.appendChild(label); calc(); scheduleSave(); }

// ===== Payments per row =====
function getRowPaid(){ try{ return JSON.parse(localStorage.getItem(ROWPAID_KEY)||'{}') }catch{ return {} } }
function setRowPaid(obj){ localStorage.setItem(ROWPAID_KEY, JSON.stringify(obj||{})) }
function togglePaymentsDrawer(label){ let d=label.querySelector('.drawer'); if(d){ d.remove(); return } d=document.createElement('div'); d.className='drawer'; const id=label.dataset.id; const amount = label.classList.contains('custom')? parseDec(label.querySelector('.c-val')?.value||''): parseDec(document.getElementById(id)?.value||''); const persons=readPersons(); const paidData=getRowPaid()[id]||{}; const mustSum=(getRowPaid()[id]?.__mustSum)||false; let sumPaid=0; persons.forEach(p=>{ sumPaid+= parseDec(paidData[p.name]||0) }); const warn = (mustSum && Math.round(sumPaid)!==Math.round(amount));
  const form=document.createElement('div'); form.innerHTML=`<div class="hdr">Radbelopp: <strong>${kr(amount)}</strong> | 🔗 Delas: ${label.classList.contains('share')? 'JA':'NEJ'}</div>`;
  const grid=document.createElement('div'); grid.className='pay-grid'; persons.forEach(p=>{ const row=document.createElement('div'); row.innerHTML=`<span>${p.name}</span><input class="p-paid" data-name="${p.name}" type="text" inputmode="decimal" value="${paidData[p.name]||''}">`; grid.appendChild(row); }); form.appendChild(grid);
  const actions=document.createElement('div'); actions.className='actions'; const dist=document.createElement('button'); dist.textContent='🔁 Fördela enligt löner'; dist.className='secondary'; dist.addEventListener('click',()=>{ const total=persons.reduce((s,x)=> s+(x.salary||0),0); persons.forEach(p=>{ const share= total>0? amount*(p.salary/total):0; const inp=grid.querySelector(`input[data-name="${p.name}"]`); inp.value= Math.round(share); }); scheduleSaveRowPaid(label); calc(); updateSharesUI(); }); const reset=document.createElement('button'); reset.textContent='↺ Nollställ'; reset.className='secondary'; reset.addEventListener('click',()=>{ grid.querySelectorAll('input').forEach(inp=> inp.value=''); scheduleSaveRowPaid(label); calc(); updateSharesUI(); }); const must=document.createElement('button'); must.textContent= mustSum? '✔ Måste summera: ON':'✖ Måste summera: OFF'; must.className='secondary'; must.addEventListener('click',()=>{ const rp=getRowPaid(); rp[id]=rp[id]||{}; rp[id].__mustSum= !rp[id].__mustSum; setRowPaid(rp); must.textContent= rp[id].__mustSum? '✔ Måste summera: ON':'✖ Måste summera: OFF'; updatePaymentsWarn(); }); actions.appendChild(dist); actions.appendChild(reset); actions.appendChild(must);
  d.appendChild(form); d.appendChild(actions);
  const warnEl=document.createElement('div'); warnEl.className='warn'; d.appendChild(warnEl);
  function updatePaymentsWarn(){ const amountNow = label.classList.contains('custom')? parseDec(label.querySelector('.c-val')?.value||''): parseDec(document.getElementById(id)?.value||''); const curSum=[...grid.querySelectorAll('input')].reduce((s,i)=> s+parseDec(i.value||''),0); const rp=getRowPaid()[id]||{}; const must= !!rp.__mustSum; warnEl.textContent = (must && Math.round(curSum)!==Math.round(amountNow))? `⚠ Summan (${kr(curSum)}) matchar inte radbeloppet (${kr(amountNow)}).` : ''; }
  grid.querySelectorAll('input').forEach(inp=> inp.addEventListener('input',()=>{ scheduleSaveRowPaid(label); updatePaymentsWarn(); calc(); updateSharesUI(); }));
  label.appendChild(d);
  updatePaymentsWarn(); }
function scheduleSaveRowPaid(label){ const id=label.dataset.id; const grid=label.querySelector('.drawer .pay-grid'); if(!grid) return; const rp=getRowPaid(); rp[id]=rp[id]||{}; grid.querySelectorAll('input').forEach(inp=>{ rp[id][inp.dataset.name]= parseDec(inp.value||'') }); setRowPaid(rp); scheduleSave(); }

// ===== Save / Load =====
let saveTimer=null; const scheduleSave=()=>{ clearTimeout(saveTimer); saveTimer=setTimeout(()=>{ saveMonth(); saveCtx(); },300) };
const key=m=>`budgetV11_${Y()}-${m}`;
function saveMonth(){ const ids=['period','namn','formaner','barnbidrag','ink_ovrigt','boende','bredband','telefoni','barnomsorg1','barnomsorg2','fackforbund','personfors','barnfors','djurfors','hemfors','bilfors','fors_ovrigt','stream_netflix','stream_spotify','stream_hbo','stream_ovrigt1','stream_ovrigt2','mat','hushall','klader','nojen','halsa','energi','ror_ovrigt','bransle','service','skatt','parkering','fordon_ovrigt','spar1','spar2','spar3','spar4','spar5','spar6','skuld']; const d={}; ids.forEach(id=>{ const el=document.getElementById(id); if(el) d[id]=el.value }); d['_persons']=readPersons(); d['_fixedCustom']=readCustom('fixed'); d['_varCustom']=readCustom('var'); d['_saveCustom']=readCustom('save'); d['_hidden']=getHidden(); d['_shared']=getShared(); d['_viewPrefs']=getViewPrefs(); d['_rowPaid']=getRowPaid(); // budget per rad
  const B={}; document.querySelectorAll('label.cat').forEach(l=>{ const b=readRowBudget(l); if(b>0) B[l.dataset.id]=b }); document.querySelectorAll('label.custom').forEach(l=>{ const b=readRowBudget(l); if(b>0) B[l.dataset.id]=b }); d['_budget']={ rows:B };
  d['_snapshot']=getSnapshot(); d['_monthClosed']=!!getSnapshot()?.closedAt;
  localStorage.setItem(key(currentMonth), JSON.stringify(d)); }
function saveCtx(){ localStorage.setItem(CTX_KEY, JSON.stringify({y:Y(), m:currentMonth})) }
function loadMonth(m){ currentMonth=m; document.querySelectorAll('.month-buttons button').forEach(b=>b.classList.toggle('active',b.dataset.month===m)); const ids=['period','namn','formaner','barnbidrag','ink_ovrigt','boende','bredband','telefoni','barnomsorg1','barnomsorg2','fackforbund','personfors','barnfors','djurfors','hemfors','bilfors','fors_ovrigt','stream_netflix','stream_spotify','stream_hbo','stream_ovrigt1','stream_ovrigt2','mat','hushall','klader','nojen','halsa','energi','ror_ovrigt','bransle','service','skatt','parkering','fordon_ovrigt','spar1','spar2','spar3','spar4','spar5','spar6','skuld']; ids.forEach(id=>{ const el=document.getElementById(id); if(el) el.value='' }); ['fixedBaseGrid','varBaseGrid','saveBaseGrid'].forEach(g=>{ document.querySelectorAll(`#${g} label.custom`).forEach(n=>n.remove()); });
  document.querySelectorAll('label.cat').forEach(l=>{ // reset classes and bind buttons
    l.classList.remove('hidden','share'); if(isHidden(l.dataset.id)) l.classList.add('hidden'); if(isShared(l.dataset.id)) l.classList.add('share'); const hide=l.querySelector('.hideCat'); const share=l.querySelector('.shareCat'); const pay=l.querySelector('.payCat'); const budget=l.querySelector('.budget'); hide&&hide.addEventListener('click',()=> toggleHideCat(l)); share&&share.addEventListener('click',()=> toggleShareCat(l)); pay&&pay.addEventListener('click',()=> togglePaymentsDrawer(l)); budget&&budget.addEventListener('input',()=>{ calc(); scheduleSave(); updateAllRowBudgets(); }); });
  renderPersons(defaultPersons()); setViewPrefs({hiddenPersons:[]}); setRowPaid({}); setSnapshot(null);
  const raw=localStorage.getItem(key(m)); if(raw){ try{ const d=JSON.parse(raw); ids.forEach(id=>{ const el=document.getElementById(id); if(el && d[id]!==undefined) el.value=d[id] }); renderPersons(d['_persons']&&d['_persons'].length? d['_persons']: defaultPersons()); (d['_fixedCustom']||[]).forEach(c=>{ const l=makeCustomLabel('fixed', c.name, c.value, !!c.share); document.getElementById('fixedBaseGrid').appendChild(l); }); (d['_varCustom']||[]).forEach(c=>{ const l=makeCustomLabel('var', c.name, c.value, !!c.share); document.getElementById('varBaseGrid').appendChild(l); }); (d['_saveCustom']||[]).forEach(c=>{ const l=makeCustomLabel('save', c.name, c.value, !!c.share); document.getElementById('saveBaseGrid').appendChild(l); }); setHidden(d['_hidden']||getHidden()); setShared(d['_shared']||getShared()); setViewPrefs(d['_viewPrefs']||getViewPrefs()); setRowPaid(d['_rowPaid']||getRowPaid()); const B=(d['_budget']?.rows)||{}; // apply budgets
    document.querySelectorAll('label.cat').forEach(l=>{ const b=B[l.dataset.id]; if(b!==undefined) l.querySelector('.budget').value=b }); document.querySelectorAll('label.custom').forEach(l=>{ const b=B[l.dataset.id]; if(b!==undefined) l.querySelector('.budget').value=b }); setSnapshot(d['_snapshot']||null); }catch{} }
  calc(); updatePeriod(); updateYearSummary(); drawPie(); updateGamify(); updateSharesUI(true); updateAllRowShares(); updateAllRowBudgets(); renderAudit(); }
function resetMonth(){ ['fixedBaseGrid','varBaseGrid','saveBaseGrid'].forEach(g=>{ document.querySelectorAll(`#${g} label.custom`).forEach(n=>n.remove()); }); renderPersons(defaultPersons()); setViewPrefs({hiddenPersons:[]}); setRowPaid({}); setSnapshot(null); saveMonth(); calc(); drawPie(); updateGamify(); updateSharesUI(true); updateAllRowShares(); updateAllRowBudgets(); renderAudit(); }
function copyPrev(){ const n=parseInt(currentMonth,10); const pm=n>1? String(n-1).padStart(2,'0'):null; if(!pm) return alert('Ingen föregående månad'); const raw=localStorage.getItem(key(pm)); if(!raw) return alert('Föregående månad saknar data'); try{ const d=JSON.parse(raw); ['fixedBaseGrid','varBaseGrid','saveBaseGrid'].forEach(g=>{ document.querySelectorAll(`#${g} label.custom`).forEach(n=>n.remove()); }); renderPersons(defaultPersons()); Object.keys(d).forEach(id=>{ const el=document.getElementById(id); if(el) el.value=d[id]||'' }); renderPersons(d['_persons']&&d['_persons'].length? d['_persons']: defaultPersons()); (d['_fixedCustom']||[]).forEach(c=>{ const l=makeCustomLabel('fixed', c.name, c.value, !!c.share); document.getElementById('fixedBaseGrid').appendChild(l); }); (d['_varCustom']||[]).forEach(c=>{ const l=makeCustomLabel('var', c.name, c.value, !!c.share); document.getElementById('varBaseGrid').appendChild(l); }); (d['_saveCustom']||[]).forEach(c=>{ const l=makeCustomLabel('save', c.name, c.value, !!c.share); document.getElementById('saveBaseGrid').appendChild(l); }); setHidden(d['_hidden']||getHidden()); setShared(d['_shared']||getShared()); setViewPrefs(d['_viewPrefs']||getViewPrefs()); setRowPaid(d['_rowPaid']||getRowPaid()); const B=(d['_budget']?.rows)||{}; document.querySelectorAll('label.cat').forEach(l=>{ const b=B[l.dataset.id]; if(b!==undefined) l.querySelector('.budget').value=b }); document.querySelectorAll('label.custom').forEach(l=>{ const b=B[l.dataset.id]; if(b!==undefined) l.querySelector('.budget').value=b }); setSnapshot(d['_snapshot']||null); calc(); scheduleSave(); updateSharesUI(true); updateAllRowShares(); updateAllRowBudgets(); renderAudit(); }catch{} }

// ===== Row share display =====
function getHiddenPersons(){ return getViewPrefs().hiddenPersons||[] }
function setHiddenPersons(arr){ const vp=getViewPrefs(); vp.hiddenPersons=arr||[]; setViewPrefs(vp); scheduleSave(); }
function ensureSplitRow(label){ let sr=label.querySelector('.split-row'); if(!sr){ sr=document.createElement('div'); sr.className='split-row'; label.appendChild(sr); } return sr }
function updateRowShare(label){ const hidden=getHidden(); const id=label.dataset.id; const shared=label.classList.contains('share'); let amount=0; if(label.classList.contains('custom')){ amount=parseDec(label.querySelector('.c-val')?.value||'') } else { amount= hidden.includes(id)?0: parseDec(document.getElementById(id)?.value||'') }
  const persons=readPersons(); const total=persons.reduce((s,p)=> s+(p.salary||0),0); const sr=ensureSplitRow(label); sr.innerHTML=''; if(!shared || amount<=0 || total<=0){ sr.style.display='none'; return } sr.style.display='flex'; const hiddenPersons=getHiddenPersons(); persons.filter(p=> !hiddenPersons.includes(p.name)).forEach(p=>{ const share = amount * ( (p.salary||0) / total ); const pill=document.createElement('span'); pill.className='split-pill'; pill.textContent=`${p.name}: ${kr(share)}`; sr.appendChild(pill); }) }
function updateAllRowShares(){ document.querySelectorAll('label.cat').forEach(updateRowShare); document.querySelectorAll('label.custom').forEach(updateRowShare); }

// ===== Sums & helpers =====
function n(id){const el=document.getElementById(id); return parseDec(el?el.value:'') }
function sumSection(ids){ const hidden=getHidden(); return ids.reduce((s,id)=> s + (hidden.includes(id)?0:n(id)),0) }
function sumCustom(section, onlyShared=false){ const gridId=section==='fixed'?'fixedBaseGrid':section==='var'?'varBaseGrid':'saveBaseGrid'; return [...document.querySelectorAll(`#${gridId} label.custom`)].reduce((s,l)=>{ const val=parseDec(l.querySelector('.c-val')?.value||''); const share=l.classList.contains('share'); return s + ((onlyShared? share: true)? val:0) },0) }

// ===== Paid totals from per‑rad =====
function getPaidTotals(){ const rp=getRowPaid(); const persons=readPersons(); const totals=Object.fromEntries(persons.map(p=>[p.name,0])); Object.keys(rp).forEach(rowId=>{ const data=rp[rowId]; Object.keys(data||{}).forEach(name=>{ if(name==='__mustSum') return; if(totals[name]===undefined) totals[name]=0; totals[name]+= parseDec(data[name]||0); }) }); return totals }

// ===== Calc & distribution =====
function setText(id, txt){ const el=document.getElementById(id); if(el) el.textContent=txt }
function calc(){
  const persons=readPersons(); const salaries=persons.reduce((s,p)=> s+(p.salary||0),0);
  const income = salaries + n('formaner') + n('barnbidrag') + n('ink_ovrigt');
  setText('sum_income', kr(income)); setText('kpiIncome', kr(income));
  const fors = sumSection(['personfors','barnfors','djurfors','hemfors','bilfors','fors_ovrigt']); setText('sum_fors', kr(fors));
  const stream = sumSection(['stream_netflix','stream_spotify','stream_hbo','stream_ovrigt1','stream_ovrigt2']); setText('sum_streaming', kr(stream));
  const fixed = sumSection(['boende','bredband','telefoni','barnomsorg1','barnomsorg2','fackforbund']) + fors + stream + sumCustom('fixed'); setText('sum_fixed', kr(fixed)); setText('kpiFixed', kr(fixed));
  const fordon = sumSection(['bransle','service','skatt','parkering','fordon_ovrigt']); setText('sum_fordon', kr(fordon));
  const vari = sumSection(['mat','hushall','klader','nojen','halsa','energi','ror_ovrigt']) + fordon + sumCustom('var'); setText('sum_var', kr(vari)); setText('kpiVar', kr(vari));
  const spar = sumSection(['spar1','spar2','spar3','spar4','spar5','spar6','skuld']) + sumCustom('save'); setText('sum_spar', kr(spar)); setText('kpiSave', kr(spar));
  const res = income - fixed - vari - spar; setText('resultat', kr(res)); setText('kpiRes', kr(res));
  const spent=fixed+vari; const left=Math.max(0, income-spent); const pct= income>0? Math.round(left*100/income):0; setText('leftPct', pct+'%'); const bar=document.getElementById('leftBar'); if(bar) bar.style.width=pct+'%';
  updateAllRowShares(); updateAllRowBudgets(); updateSharesUI(); renderAudit(); }

function updateSharesUI(forceRebuild=false){
  const persons=readPersons(); const total=persons.reduce((s,p)=> s+(p.salary||0),0); const list=document.getElementById('sharePeople'); if(!list) return;
  const sharedBaseIds=[ 'boende','bredband','telefoni','barnomsorg1','barnomsorg2','fackforbund','personfors','barnfors','djurfors','hemfors','bilfors','fors_ovrigt','stream_netflix','stream_spotify','stream_hbo','stream_ovrigt1','stream_ovrigt2','mat','hushall','klader','nojen','halsa','energi','ror_ovrigt','bransle','service','skatt','parkering','fordon_ovrigt' ]; const hidden=getHidden(); const sharedSet=getShared(); const sharedBaseSum = sharedBaseIds.reduce((s,id)=> s + (hidden.includes(id)?0: (sharedSet.includes(id)? n(id):0)), 0); const sharedCustomSum = sumCustom('fixed', true) + sumCustom('var', true); const sharedTotal = sharedBaseSum + sharedCustomSum; setText('sharedTotal', kr(sharedTotal)); setText('salaryTotal', kr(total)); const p = total>0? (sharedTotal / total): 0; setText('sharePct', (p*100).toFixed(1)+'%');
  // Build list if empty or persons changed
  if(forceRebuild || list.children.length!==persons.length){ list.innerHTML=''; const vp=getViewPrefs(); const hiddenPersons=vp.hiddenPersons||[]; persons.forEach(person=>{ const div=document.createElement('div'); div.className='person-share'; div.dataset.name=person.name; if(hiddenPersons.includes(person.name)) div.classList.add('dhidden'); const andelPct = total>0? (person.salary/total*100):0; const skall = sharedTotal * ( total>0? (person.salary/total): 0 ); const paidTotals=getPaidTotals(); const paid=paidTotals[person.name]||0; const progress = skall>0? Math.round(paid*100/skall): 0; const saldo = paid - skall; div.innerHTML=`<div class="row"><span><strong>${person.name}</strong> — Andel: ${andelPct.toFixed(1)}%</span><span>Skall: <strong class="skall">${kr(skall)}</strong></span><span>Betalat: <strong class="paid">${kr(paid)}</strong></span><span>Progress: <strong class="progress">${progress}%</strong></span><span>Saldo: <strong class="saldo">${kr(saldo)}</strong></span><button class="toggle">${ hiddenPersons.includes(person.name)? '👁 Visa':'👁 Dölj visning' }</button></div><div class="bar"><div style="width:${Math.min(100,Math.max(0,progress))}%"></div></div>`; div.querySelector('.toggle').addEventListener('click',()=>{ const vp2=getViewPrefs(); vp2.hiddenPersons=vp2.hiddenPersons||[]; const arr=vp2.hiddenPersons; const ix=arr.indexOf(person.name); if(ix>=0) arr.splice(ix,1); else arr.push(person.name); setViewPrefs(vp2); updateSharesUI(true); updateAllRowShares(); }); list.appendChild(div); }); return }
  // Update values
  const paidTotals=getPaidTotals(); [...document.querySelectorAll('.person-share')].forEach(div=>{ const name=div.dataset.name; const person=persons.find(x=> x.name===name ); const andelPct = total>0? ( (person?.salary||0)/total*100 ):0; const skall = sharedTotal * ( total>0? ((person?.salary||0)/total): 0 ); const paid=paidTotals[name]||0; const progress = skall>0? Math.round(paid*100/skall): 0; const saldo = paid - skall; div.querySelector('.skall').textContent=kr(skall); div.querySelector('.paid').textContent=kr(paid); div.querySelector('.progress').textContent=(progress)+'%'; div.querySelector('.saldo').textContent=kr(saldo); const bar=div.querySelector('.bar>div'); bar.style.width=(Math.min(100,Math.max(0,progress)))+'%'; const hiddenPersons=getHiddenPersons(); div.classList.toggle('dhidden', hiddenPersons.includes(name)); });
}

// ===== Snapshot (close month) & audit =====
function getSnapshot(){ try{ return JSON.parse(localStorage.getItem('budgetV11_snapshot')||'null') }catch{ return null } }
function setSnapshot(s){ if(s==null) localStorage.removeItem('budgetV11_snapshot'); else localStorage.setItem('budgetV11_snapshot', JSON.stringify(s)) }
function buildCurrentTotals(){ const persons=readPersons(); const salaries=persons.reduce((s,p)=> s+(p.salary||0),0); const income = salaries + n('formaner') + n('barnbidrag') + n('ink_ovrigt'); const fors = sumSection(['personfors','barnfors','djurfors','hemfors','bilfors','fors_ovrigt']); const stream = sumSection(['stream_netflix','stream_spotify','stream_hbo','stream_ovrigt1','stream_ovrigt2']); const fixed = sumSection(['boende','bredband','telefoni','barnomsorg1','barnomsorg2','fackforbund']) + fors + stream + sumCustom('fixed'); const fordon = sumSection(['bransle','service','skatt','parkering','fordon_ovrigt']); const vari = sumSection(['mat','hushall','klader','nojen','halsa','energi','ror_ovrigt']) + fordon + sumCustom('var'); const spar = sumSection(['spar1','spar2','spar3','spar4','spar5','spar6','skuld']) + sumCustom('save'); const res = income - fixed - vari - spar; const rows={}; // capture row outcomes (base + custom)
  const hidden=getHidden(); const baseIds=['boende','bredband','telefoni','barnomsorg1','barnomsorg2','fackforbund','personfors','barnfors','djurfors','hemfors','bilfors','fors_ovrigt','stream_netflix','stream_spotify','stream_hbo','stream_ovrigt1','stream_ovrigt2','mat','hushall','klader','nojen','halsa','energi','ror_ovrigt','bransle','service','skatt','parkering','fordon_ovrigt','spar1','spar2','spar3','spar4','spar5','spar6','skuld']; baseIds.forEach(id=>{ rows[id]= hidden.includes(id)?0: n(id) }); document.querySelectorAll('label.custom').forEach(l=>{ const id=l.dataset.id; const val=parseDec(l.querySelector('.c-val')?.value||''); rows[id]=val }); return {income,fixed,var:vari,spar,res, rows} }
function closeMonth(){ const totals=buildCurrentTotals(); setSnapshot({ closedAt: new Date().toISOString(), totals }); saveMonth(); renderAudit(); }
function openMonth(){ setSnapshot(null); saveMonth(); renderAudit(); }

function renderAudit(){ const wrap=document.getElementById('auditTable'); if(!wrap) return; const snap=getSnapshot(); const budgetRows=(getBudget().rows)||{}; wrap.innerHTML=''; if(!snap){ wrap.innerHTML='<p>Ingen snapshot ännu. Stäng månaden för att låsa utfallet.</p>'; return } const t=snap.totals; // sections
  const table=document.createElement('table'); const thead=document.createElement('thead'); const tbody=document.createElement('tbody'); thead.innerHTML='<tr><th>Del</th><th>Budget</th><th>Utfallet</th><th>Avvikelse</th><th>Avvikelse %</th></tr>'; const addRow=(name,b,actual)=>{ const diff=actual-(b||0); const pct=b>0? ((actual/b-1)*100): null; const tr=document.createElement('tr'); tr.innerHTML=`<td>${name}</td><td>${kr(b||0)}</td><td>${kr(actual)}</td><td>${diff>=0?'+':'−'}${kr(Math.abs(diff))}</td><td>${pct==null?'—': pct.toFixed(1)+'%'}</td>`; tbody.appendChild(tr) };
  const bFixed=sumBudgetOfSection('fixed', budgetRows); const bVar=sumBudgetOfSection('var', budgetRows); const bSave=sumBudgetOfSection('save', budgetRows); const bTotal=(bFixed+bVar+bSave); addRow('Fasta', bFixed, t.fixed); addRow('Rörliga', bVar, t.var); addRow('Spar/Skuld', bSave, t.spar); addRow('TOTAL', bTotal, t.fixed+t.var+t.spar);
  // Rows with budget
  table.appendChild(thead); table.appendChild(tbody); wrap.appendChild(table);
  const table2=document.createElement('table'); const thead2=document.createElement('thead'); const tbody2=document.createElement('tbody'); thead2.innerHTML='<tr><th>Rad</th><th>Budget</th><th>Utfallet</th><th>Avvikelse</th><th>Avvikelse %</th></tr>'; Object.keys(budgetRows).forEach(id=>{ const b=budgetRows[id]; const actual=t.rows[id]||0; const diff=actual-(b||0); const pct=b>0? ((actual/b-1)*100): null; const tr=document.createElement('tr'); const name=prettyNameForId(id); tr.innerHTML=`<td>${name}</td><td>${kr(b||0)}</td><td>${kr(actual)}</td><td>${diff>=0?'+':'−'}${kr(Math.abs(diff))}</td><td>${pct==null?'—': pct.toFixed(1)+'%'}</td>`; tbody2.appendChild(tr) }); table2.appendChild(thead2); table2.appendChild(tbody2); wrap.appendChild(document.createElement('br')); wrap.appendChild(table2); }

function sumBudgetOfSection(section, budgetRows){ const ids = section==='fixed' ? ['boende','bredband','telefoni','barnomsorg1','barnomsorg2','fackforbund','personfors','barnfors','djurfors','hemfors','bilfors','fors_ovrigt','stream_netflix','stream_spotify','stream_hbo','stream_ovrigt1','stream_ovrigt2'] : section==='var' ? ['mat','hushall','klader','nojen','halsa','energi','ror_ovrigt','bransle','service','skatt','parkering','fordon_ovrigt'] : ['spar1','spar2','spar3','spar4','spar5','spar6','skuld']; let s=0; ids.forEach(id=>{ if(budgetRows[id]) s+= parseDec(budgetRows[id]) }); document.querySelectorAll('label.custom').forEach(l=>{ const id=l.dataset.id; const sec=l.dataset.section; if(sec===section && budgetRows[id]) s+= parseDec(budgetRows[id]) }); return s }
function prettyNameForId(id){ const map={ boende:'Hyra/Bolån', bredband:'Bredband', telefoni:'Telefoni', barnomsorg1:'Barnomsorg 1', barnomsorg2:'Barnomsorg 2', fackforbund:'Fackförbund', personfors:'Personförsäkring', barnfors:'Barnförsäkring', djurfors:'Djurförsäkring', hemfors:'Hemförsäkring', bilfors:'Bilförsäkring', fors_ovrigt:'Övrig försäkring', stream_netflix:'Netflix', stream_spotify:'Spotify', stream_hbo:'HBO', stream_ovrigt1:'Streaming Övrigt 1', stream_ovrigt2:'Streaming Övrigt 2', mat:'Mat', hushall:'Hushåll', klader:'Kläder', nojen:'Nöjen', halsa:'Hälsa', energi:'El/Värme', ror_ovrigt:'Rörligt Övrigt', bransle:'Bränsle', service:'Service', skatt:'Skatt/Besiktning', parkering:'Parkering', fordon_ovrigt:'Övrigt fordon', spar1:'Sparande 1', spar2:'Sparande 2', spar3:'Sparande 3', spar4:'Sparande 4', spar5:'Sparande 5', spar6:'Sparande 6', skuld:'Skuld' }; return map[id]||'Egen rad' }

// ===== Year summary =====
function getMonthTotals(m){ const raw=localStorage.getItem(key(m)); if(!raw) return {income:0,fixed:0,var:0,spar:0,res:0}; try{ const d=JSON.parse(raw); const dec=x=>parseDec(d[x]); const hidden=d['_hidden']||[]; const H=id=> hidden.includes(id)?0:dec(id); const persons=(d['_persons']||[{name:'Du',salary:0}]).reduce((s,p)=> s+(parseDec(p.salary)||0),0); const income = persons + dec('formaner') + dec('barnbidrag') + dec('ink_ovrigt'); const fors = H('personfors')+H('barnfors')+H('djurfors')+H('hemfors')+H('bilfors')+H('fors_ovrigt'); const stream = H('stream_netflix')+H('stream_spotify')+H('stream_hbo')+H('stream_ovrigt1')+H('stream_ovrigt2'); const fixedCustom=(d['_fixedCustom']||[]).reduce((s,c)=> s+(parseDec(c.value)||0),0); const fixed = (H('boende')+H('bredband')+H('telefoni')+H('barnomsorg1')+H('barnomsorg2')+H('fackforbund')) + fors + stream + fixedCustom; const fordon = H('bransle')+H('service')+H('skatt')+H('parkering')+H('fordon_ovrigt'); const varCustom=(d['_varCustom']||[]).reduce((s,c)=> s+(parseDec(c.value)||0),0); const vari = (H('mat')+H('hushall')+H('klader')+H('nojen')+H('halsa')+H('energi')+H('ror_ovrigt')) + fordon + varCustom; const saveCustom=(d['_saveCustom']||[]).reduce((s,c)=> s+(parseDec(c.value)||0),0); const spar = (H('spar1')+H('spar2')+H('spar3')+H('spar4')+H('spar5')+H('spar6')+H('skuld')) + saveCustom; const res = income - fixed - vari - spar; return {income,fixed,var:vari,spar,res}; }catch{ return {income:0,fixed:0,var:0,spar:0,res:0} } }
function updateYearSummary(){ const ms=['01','02','03','04','05','06','07','08','09','10','11','12']; let yi=0,yf=0,yv=0,ys=0,yr=0; ms.forEach(m=>{ const t=getMonthTotals(m); yi+=t.income; yf+=t.fixed; yv+=t.var; ys+=t.spar; yr+=t.res; }); setText('y_income', kr(yi)); setText('y_fixed', kr(yf)); setText('y_var', kr(yv)); setText('y_spar', kr(ys)); setText('y_result', kr(yr)); }

// ===== CSV/PDF =====
function exportMonthCSV(){ const rows=[["År",Y()],["Månad",currentMonth]]; const add=(a,b)=>rows.push([a,b]); const read=id=>document.getElementById(id)?.value||''; rows.push([]);
  // Persons
  rows.push(['Person','Lön']); readPersons().forEach(p=> rows.push([p.name,p.salary])); rows.push([]);
  add('Förmåner',read('formaner')); add('Barnbidrag',read('barnbidrag')); add('Övrig inkomst',read('ink_ovrigt')); add('Summa inkomster',document.getElementById('sum_income').textContent); rows.push([]);
  // Fixed/Var/Save base
  ['boende','bredband','telefoni','barnomsorg1','barnomsorg2','fackforbund','personfors','barnfors','djurfors','hemfors','bilfors','fors_ovrigt','stream_netflix','stream_spotify','stream_hbo','stream_ovrigt1','stream_ovrigt2','mat','hushall','klader','nojen','halsa','energi','ror_ovrigt','bransle','service','skatt','parkering','fordon_ovrigt','spar1','spar2','spar3','spar4','spar5','spar6','skuld'].forEach(id=> add(id, read(id)) ); rows.push([]);
  // Custom rows
  rows.push(['Egna rader','Belopp']); document.querySelectorAll('label.custom').forEach(l=>{ rows.push([l.querySelector('.c-name')?.value||'Egen', parseDec(l.querySelector('.c-val')?.value||'')]) }); rows.push([]);
  add('Summa streaming',document.getElementById('sum_streaming').textContent); add('Summa fordon',document.getElementById('sum_fordon').textContent); add('Summa fasta',document.getElementById('sum_fixed').textContent); add('Summa rörliga',document.getElementById('sum_var').textContent); add('Summa spar/skuld',document.getElementById('sum_spar').textContent); rows.push([]);
  add('Resultat',document.getElementById('resultat').textContent);
  rows.push([]);
  // Budgets per row
  rows.push(['Budget per rad']); const B=getBudget().rows||{}; Object.keys(B).forEach(id=>{ rows.push([id, B[id]]) }); rows.push([]);
  // Per-row payments
  rows.push(['Per‑rad betalningar','Person','Belopp']); const rp=getRowPaid(); Object.keys(rp).forEach(id=>{ const data=rp[id]; Object.keys(data||{}).forEach(name=>{ if(name==='__mustSum') return; rows.push([id, name, data[name]]) }) });
  const csv=rows.map(r=>r.join(';')).join('\n'); const blob=new Blob([csv],{type:'text/csv;charset=utf-8;'}); const url=URL.createObjectURL(blob); const a=document.createElement('a'); a.href=url; a.download=`budget_${Y()}-${currentMonth}.csv`; a.click(); URL.revokeObjectURL(url); }

function exportYearCSV(){ const rows=[["År",Y()]]; const ms=['01','02','03','04','05','06','07','08','09','10','11','12']; rows.push(["Månad","Inkomster","Fasta","Rörliga","Spar/Skuld","Resultat"]); ms.forEach(m=>{ const t=getMonthTotals(m); rows.push([m, Math.round(t.income), Math.round(t.fixed), Math.round(t.var), Math.round(t.spar), Math.round(t.res)]) }); const csv=rows.map(r=>r.join(';')).join('\n'); const blob=new Blob([csv],{type:'text/csv;charset=utf-8;'}); const url=URL.createObjectURL(blob); const a=document.createElement('a'); a.href=url; a.download=`budget_${Y()}_arsoversikt.csv`; a.click(); URL.revokeObjectURL(url); }

async function exportPDF(){ const { jsPDF } = window.jspdf; const doc = new jsPDF({orientation:'p', unit:'pt'}); const m=40; let y=m; const T=(t,v='')=>{ doc.text(`${t} ${v}`, m, y); y+=18; };
  doc.setFontSize(16); doc.text('Hushållsbudget – Månad', m, y); y+=24; doc.setFontSize(12);
  T('Inkomster:', document.getElementById('sum_income').textContent); T('Fasta:', document.getElementById('sum_fixed').textContent); T('Rörliga:', document.getElementById('sum_var').textContent); T('Spar/Skuld:', document.getElementById('sum_spar').textContent); T('Resultat:', document.getElementById('resultat').textContent); y+=10;
  const persons=readPersons(); if(persons.length){ doc.text('Huvudpersoner (lön):', m, y); y+=18; persons.forEach(p=>{ doc.text(`• ${p.name}: ${p.salary} kr`, m+16, y); y+=16; }); }
  const sharedTotal=document.getElementById('sharedTotal').textContent; const sharePct=document.getElementById('sharePct').textContent; doc.text(`Delad summa: ${sharedTotal} | Procent av lön: ${sharePct}`, m, y); y+=18;
  doc.save(`budget_${Y()}-${currentMonth}.pdf`);
}

// ===== Chart, tips, theme, gamify =====
let pie; function drawPie(){ try{ const ctx=document.getElementById('pie'); if(!ctx) return; const data={ labels:['Fasta','Rörliga','Spar/Skuld'], datasets:[{ data:[ val('sum_fixed'), val('sum_var'), val('sum_spar') ], backgroundColor:['#f59e0b','#ef4444','#22c55e']}]}; if(pie) pie.destroy(); pie=new Chart(ctx,{type:'pie', data, options:{plugins:{legend:{position:'bottom'}}}});}catch{}}
function val(id){ const txt=document.getElementById(id).textContent.replace(/[^0-9\-]/g,''); return parseInt(txt||'0',10) }
const TIPS=['Sätt autogiro för sparande direkt efter löning.','Jämför försäkringar vartannat år.','Planera veckans mat – minska spontanköp.','Förhandla bolåneräntan årligen.','Rensa onödiga prenumerationer varje kvartal.'];
const nextTip=()=>{ document.getElementById('tipText').textContent=TIPS[Math.floor(Math.random()*TIPS.length)] };
const getPoints=()=>parseInt(localStorage.getItem('budgetV11_points')||'0',10);
const setPoints=p=>{ localStorage.setItem('budgetV11_points', String(p)); document.getElementById('points').textContent=String(p) };
function addBadge(name){ const b=document.createElement('span'); b.className='badge'; b.textContent=name; document.getElementById('badges').appendChild(b) }
function updateGamify(){ const p0=getPoints(); let p=p0; document.getElementById('badges').innerHTML=''; const income=val('sum_income'); const res=val('kpiRes'); const save=val('sum_spar'); if(res>0) p+=1; if(income>0 && save>=0.1*income) p+=1; setPoints(p); if(p>=5) addBadge('Sparare 🌱'); if(p>=10) addBadge('Mästare 🏅'); if(p>=20) addBadge('Budget‑pro 👑'); }
const applyTheme=()=>{ const t=localStorage.getItem('budgetV11_theme')||'light'; if(t==='dark') document.documentElement.setAttribute('data-theme','dark'); else document.documentElement.removeAttribute('data-theme') };
const toggleTheme=()=>{ const dark=document.documentElement.getAttribute('data-theme')==='dark'; localStorage.setItem('budgetV11_theme', dark?'light':'dark'); applyTheme() };

// ===== Init =====
window.addEventListener('DOMContentLoaded',()=>{
  applyTheme();
  document.getElementById('darkToggle').addEventListener('click',toggleTheme);
  document.getElementById('addPersonBtn').addEventListener('click',()=>{ addPersonCard('Betalare', '', false); calc(); scheduleSave(); updateSharesUI(true); });
  document.getElementById('addFixedCustom').addEventListener('click',()=>{ addCustomTo('fixed'); });
  document.getElementById('addVarCustom').addEventListener('click',()=>{ addCustomTo('var'); });
  document.getElementById('addSaveCustom').addEventListener('click',()=>{ addCustomTo('save'); });
  document.querySelectorAll('input').forEach(el=>el.addEventListener('input',()=>{ calc(); scheduleSave(); drawPie(); updateGamify(); }));
  document.querySelectorAll('label.cat .hideCat').forEach(btn=> btn.addEventListener('click',(e)=>{ const label=e.target.closest('label.cat'); toggleHideCat(label); }));
  document.querySelectorAll('label.cat .shareCat').forEach(btn=> btn.addEventListener('click',(e)=>{ const label=e.target.closest('label.cat'); toggleShareCat(label); }));
  document.querySelectorAll('label.cat .payCat').forEach(btn=> btn.addEventListener('click',(e)=>{ const label=e.target.closest('label.cat'); togglePaymentsDrawer(label); }));
  document.querySelectorAll('label.cat .budget').forEach(inp=> inp.addEventListener('input',()=>{ calc(); scheduleSave(); updateAllRowBudgets(); }));
  document.getElementById('year').addEventListener('change',()=>{ loadMonth(currentMonth); scheduleSave(); });
  document.querySelectorAll('.month-buttons button').forEach(btn=>btn.addEventListener('click',()=>{ loadMonth(btn.dataset.month); scheduleSave(); }));
  document.getElementById('copyPrevBtn').addEventListener('click',copyPrev);
  document.getElementById('resetMonthBtn').addEventListener('click',()=>{ if(confirm('Rensa alla fält för aktuell månad?')) resetMonth(); });
  document.getElementById('csvBtn').addEventListener('click',exportMonthCSV);
  document.getElementById('yearCsvBtn').addEventListener('click',exportYearCSV);
  document.getElementById('pdfBtn').addEventListener('click',exportPDF);
  document.getElementById('closeMonthBtn').addEventListener('click',closeMonth);
  document.getElementById('openMonthBtn').addEventListener('click',openMonth);
  document.getElementById('tipText').textContent='—'; document.getElementById('nextTip').addEventListener('click',nextTip); nextTip();

  try{ const ctx=JSON.parse(localStorage.getItem(CTX_KEY)||'null'); if(ctx && [...document.getElementById('year').options].some(o=>o.value==ctx.y)){ document.getElementById('year').value=ctx.y; loadMonth(ctx.m); return; } }catch{}
  const m=String(new Date().getMonth()+1).padStart(2,'0'); loadMonth(m);
});

if('serviceWorker' in navigator){ window.addEventListener('load',()=>{ navigator.serviceWorker.register('sw.js'); }); }

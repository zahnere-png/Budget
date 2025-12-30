// ===== Format & utils =====
const fmtKr=new Intl.NumberFormat('sv-SE',{style:'currency',currency:'SEK',maximumFractionDigits:0});
const kr=n=>fmtKr.format(Math.round(n||0));
const parseDec=s=>{ if(s==null) return 0; const v=String(s).trim().replace(',','.'); const n=parseFloat(v); return isNaN(n)?0:n };

function Y(){return document.getElementById('year').value}
let currentMonth='01'; const CTX_KEY='budgetV101LastContext';
const HIDDEN_KEY='budgetV101_hidden';
const SHARED_KEY='budgetV101_shared';

// ===== Icon mapping for categories =====
function iconForName(name){ const n=(name||'').toLowerCase(); const M=[ [/hyra|bolån|boende|hus|lägenhet/,'🏠'], [/el|värme|energi|ström/,'⚡'], [/internet|bredband|wifi|fiber/,'🌐'], [/telefon|mobil|telef/,'📞'], [/mat|livs|ica|coop|handla/,'🛒'], [/kläder|skor|jacka|byxor/,'👟'], [/nöje|bio|underhållning|spel|game/,'🎉'], [/halsa|hälsa|gym|träning/,'💪'], [/bil|fordon|service|verkstad/,'🚗'], [/bränsle|bensin|diesel|laddning/,'⛽'], [/parkering|p-bot|pavgift/,'🅿️'], [/skatt|besiktning/,'🧾'], [/försäkring|hemförsäkring|bilförsäkring|personförsäkring|barnförsäkring/,'🛡️'], [/netflix|viaplay|hbo|max|disney|prime|stream/,'🎬'], [/spotify|musik|tidal|apple music/,'🎵'], [/barn|förskola|dagis|skola/,'👶'], [/fack|fackförbund|unionen|byggnads/,'🧰'], [/djur|hund|katt|veterinär/,'🐾'], [/spar|buffert|målspar|amortering/,'🐷'], [/skuld|lån/,'📉'], [/hushåll|toapapper|städ|förbrukning/,'🧼'] ]; for(const [re,ico] of M){ if(re.test(n)) return ico } return '🧩' }

// ===== Hidden / Shared helpers =====
const getHidden=()=>{ try{ return JSON.parse(localStorage.getItem(HIDDEN_KEY)||'[]') }catch{ return [] } };
const setHidden=arr=>localStorage.setItem(HIDDEN_KEY, JSON.stringify(arr||[]));
const isHidden=id=>getHidden().includes(id);
const getShared=()=>{ try{ return JSON.parse(localStorage.getItem(SHARED_KEY)||'[]') }catch{ return [] } };
const setShared=arr=>localStorage.setItem(SHARED_KEY, JSON.stringify(arr||[]));
const isShared=id=>getShared().includes(id);

const toggleHideCat=(label)=>{ const id=label.dataset.id; const h=getHidden(); label.classList.toggle('hidden'); if(label.classList.contains('hidden')){ if(!h.includes(id)) h.push(id) } else { const i=h.indexOf(id); if(i>=0) h.splice(i,1) } setHidden(h); calc(); scheduleSave(); };
const toggleShareCat=(label)=>{ const id=label.dataset.id; const s=getShared(); label.classList.toggle('share'); if(label.classList.contains('share')){ if(!s.includes(id)) s.push(id) } else { const i=s.indexOf(id); if(i>=0) s.splice(i,1) } setShared(s); calc(); scheduleSave(); updateRowShare(label); };

// ===== Persons (huvudpersoner) =====
function defaultPersons(){ return [{name:'Du', salary:0}] }
function readPersons(){ return [...document.querySelectorAll('.person-card')].map(card=>({ name: card.querySelector('.name').value||'Du', salary: parseDec(card.querySelector('.salary').value||'') })) }
function renderPersons(list){ const grid=document.getElementById('personGrid'); grid.innerHTML=''; (list||defaultPersons()).forEach((p,i)=> addPersonCard(p.name,p.salary, i===0)); rebuildPaidRows(); }
function addPersonCard(name='Du', salary='', isPrimary=false){ const grid=document.getElementById('personGrid'); const card=document.createElement('div'); card.className='person-card'; card.innerHTML=`<div class="head"><span class="ico">${isPrimary?'🧑':'👤'}</span><input class="name" type="text" placeholder="Namn" value="${name}"></div><input class="salary" type="text" inputmode="decimal" placeholder="Lön" value="${salary}"><button class="del" ${isPrimary?'disabled':''} title="Ta bort">🗑️</button>`; const nameEl=card.querySelector('.name'); const salEl=card.querySelector('.salary'); nameEl.addEventListener('input',()=>{ calc(); scheduleSave(); updateSharesUI(true); }); salEl.addEventListener('input',()=>{ calc(); scheduleSave(); updateSharesUI(true); }); card.querySelector('.del').addEventListener('click',()=>{ if(!isPrimary){ card.remove(); calc(); scheduleSave(); updateSharesUI(true); }}); grid.appendChild(card); }

// ===== Custom categories (same layout + auto‑icon) =====
let customIdSeq=0;
function makeCustomLabel(section, name='', value='', share=false){ const label=document.createElement('label'); label.className='cat custom'; const id=`c_${section}_${++customIdSeq}`; label.dataset.id=id; label.dataset.section=section; if(share) label.classList.add('share'); const ico=iconForName(name); label.innerHTML=`<div class="cat-header"><span class="ico">${ico}</span><input class="c-name" type="text" placeholder="Kategori" value="${name}"></div><input class="c-val" type="text" inputmode="decimal" placeholder="Belopp" value="${value}"><button class="delCat" title="Ta bort">🗑️</button><button class="shareCat" title="Delas">🔗</button>`; label.querySelector('.c-name').addEventListener('input',(e)=>{ label.querySelector('.ico').textContent=iconForName(e.target.value); calc(); scheduleSave(); updateRowShare(label); }); label.querySelector('.c-val').addEventListener('input',()=>{ calc(); scheduleSave(); updateRowShare(label); }); label.querySelector('.delCat').addEventListener('click',()=>{ label.remove(); calc(); scheduleSave(); }); label.querySelector('.shareCat').addEventListener('click',()=>{ toggleShareCat(label); }); return label }
function addCustomTo(section){ const gridId=section==='fixed'?'fixedBaseGrid':section==='var'?'varBaseGrid':'saveBaseGrid'; const grid=document.getElementById(gridId); const label=makeCustomLabel(section,'','', false); grid.appendChild(label); calc(); scheduleSave(); }
function readCustom(section){ const gridId=section==='fixed'?'fixedBaseGrid':section==='var'?'varBaseGrid':'saveBaseGrid'; return [...document.querySelectorAll(`#${gridId} label.custom`)].map(l=>({ name:l.querySelector('.c-name').value||'', value: parseDec(l.querySelector('.c-val').value||''), share: l.classList.contains('share') })) }

// ===== Save / Load =====
let saveTimer=null; const scheduleSave=()=>{ clearTimeout(saveTimer); saveTimer=setTimeout(()=>{ saveMonth(); saveCtx(); },300) };
const key=m=>`budgetV101_${Y()}-${m}`;
function saveMonth(){ const ids=['period','namn','formaner','barnbidrag','ink_ovrigt','boende','bredband','telefoni','barnomsorg1','barnomsorg2','fackforbund','personfors','barnfors','djurfors','hemfors','bilfors','fors_ovrigt','stream_netflix','stream_spotify','stream_hbo','stream_ovrigt1','stream_ovrigt2','mat','hushall','klader','nojen','halsa','energi','ror_ovrigt','bransle','service','skatt','parkering','fordon_ovrigt','spar1','spar2','spar3','spar4','spar5','spar6','skuld']; const d={}; ids.forEach(id=>{ const el=document.getElementById(id); if(el) d[id]=el.value }); d['_persons']=readPersons(); d['_fixedCustom']=readCustom('fixed'); d['_varCustom']=readCustom('var'); d['_saveCustom']=readCustom('save'); d['_hidden']=getHidden(); d['_shared']=getShared(); d['_paidShares']=readPaidShares(); localStorage.setItem(key(currentMonth), JSON.stringify(d)); }
function saveCtx(){ localStorage.setItem(CTX_KEY, JSON.stringify({y:Y(), m:currentMonth})) }
function loadMonth(m){ currentMonth=m; document.querySelectorAll('.month-buttons button').forEach(b=>b.classList.toggle('active',b.dataset.month===m)); const ids=['period','namn','formaner','barnbidrag','ink_ovrigt','boende','bredband','telefoni','barnomsorg1','barnomsorg2','fackforbund','personfors','barnfors','djurfors','hemfors','bilfors','fors_ovrigt','stream_netflix','stream_spotify','stream_hbo','stream_ovrigt1','stream_ovrigt2','mat','hushall','klader','nojen','halsa','energi','ror_ovrigt','bransle','service','skatt','parkering','fordon_ovrigt','spar1','spar2','spar3','spar4','spar5','spar6','skuld']; ids.forEach(id=>{ const el=document.getElementById(id); if(el) el.value='' }); ['fixedBaseGrid','varBaseGrid','saveBaseGrid'].forEach(g=>{ document.querySelectorAll(`#${g} label.custom`).forEach(n=>n.remove()); });
  // Reset hidden/shared visual
  document.querySelectorAll('label.cat').forEach(l=>{ l.classList.remove('hidden'); l.classList.remove('share'); if(isHidden(l.dataset.id)) l.classList.add('hidden'); if(isShared(l.dataset.id)) l.classList.add('share'); });
  // Persons
  renderPersons(defaultPersons());
  const raw=localStorage.getItem(key(m)); if(raw){ try{ const d=JSON.parse(raw); ids.forEach(id=>{ const el=document.getElementById(id); if(el && d[id]!==undefined) el.value=d[id] }); renderPersons(d['_persons']&&d['_persons'].length? d['_persons']: defaultPersons()); (d['_fixedCustom']||[]).forEach(c=>{ const l=makeCustomLabel('fixed', c.name, c.value, !!c.share); document.getElementById('fixedBaseGrid').appendChild(l); }); (d['_varCustom']||[]).forEach(c=>{ const l=makeCustomLabel('var', c.name, c.value, !!c.share); document.getElementById('varBaseGrid').appendChild(l); }); (d['_saveCustom']||[]).forEach(c=>{ const l=makeCustomLabel('save', c.name, c.value, !!c.share); document.getElementById('saveBaseGrid').appendChild(l); }); setHidden(d['_hidden']||getHidden()); setShared(d['_shared']||getShared()); setPaidShares(d['_paidShares']||[]); }catch{} }
  calc(); updatePeriod(); updateYearSummary(); drawPie(); updateGamify(); updateSharesUI(true); }
function resetMonth(){ ['fixedBaseGrid','varBaseGrid','saveBaseGrid'].forEach(g=>{ document.querySelectorAll(`#${g} label.custom`).forEach(n=>n.remove()); }); renderPersons(defaultPersons()); setPaidShares([]); saveMonth(); calc(); drawPie(); updateGamify(); updateSharesUI(true); }
function copyPrev(){ const n=parseInt(currentMonth,10); const pm=n>1? String(n-1).padStart(2,'0'):null; if(!pm) return alert('Ingen föregående månad'); const raw=localStorage.getItem(key(pm)); if(!raw) return alert('Föregående månad saknar data'); try{ const d=JSON.parse(raw); ['fixedBaseGrid','varBaseGrid','saveBaseGrid'].forEach(g=>{ document.querySelectorAll(`#${g} label.custom`).forEach(n=>n.remove()); }); renderPersons(defaultPersons()); Object.keys(d).forEach(id=>{ const el=document.getElementById(id); if(el) el.value=d[id]||'' }); renderPersons(d['_persons']&&d['_persons'].length? d['_persons']: defaultPersons()); (d['_fixedCustom']||[]).forEach(c=>{ const l=makeCustomLabel('fixed', c.name, c.value, !!c.share); document.getElementById('fixedBaseGrid').appendChild(l); }); (d['_varCustom']||[]).forEach(c=>{ const l=makeCustomLabel('var', c.name, c.value, !!c.share); document.getElementById('varBaseGrid').appendChild(l); }); (d['_saveCustom']||[]).forEach(c=>{ const l=makeCustomLabel('save', c.name, c.value, !!c.share); document.getElementById('saveBaseGrid').appendChild(l); }); setHidden(d['_hidden']||getHidden()); setShared(d['_shared']||getShared()); setPaidShares(d['_paidShares']||[]); calc(); scheduleSave(); updateSharesUI(true); }catch{} }

// ===== Paid shares =====
function readPaidShares(){ return [...document.querySelectorAll('.person-share')].map(div=>({ name:div.dataset.name, paid: parseDec(div.querySelector('.paid').value||'') })) }
function setPaidShares(arr){ const list=document.getElementById('sharePeople'); list.innerHTML=''; const persons=readPersons(); const map=new Map((arr||[]).map(x=>[x.name,x.paid])); persons.forEach(p=>{ const paid=map.get(p.name)||0; const row=document.createElement('div'); row.className='person-share'; row.dataset.name=p.name; const andel=salaryTotal()>0? (p.salary/salaryTotal()*100):0; row.innerHTML=`<div class="row"><span><strong>${p.name}</strong> — Andel: ${andel.toFixed(1)}%</span><span>Skall: <strong class="skall">0 kr</strong></span><span>Betalat: <input class="paid" type="text" inputmode="decimal" value="${paid}"></span><span>Progress: <strong class="progress">0%</strong></span><span>Saldo: <strong class="saldo">0 kr</strong></span></div><div class="bar"><div></div></div>`; row.querySelector('.paid').addEventListener('input',()=>{ calc(); scheduleSave(); updateSharesUI(); }); list.appendChild(row); }); }
function rebuildPaidRows(){ // Rebuild rows to match current persons, preserving entered amounts
  const prev=readPaidShares(); setPaidShares(prev); }

function salaryTotal(){ const persons=readPersons(); return persons.reduce((s,p)=> s+(p.salary||0),0) }

// ===== Sums & per-row chips =====
function n(id){const el=document.getElementById(id); return parseDec(el?el.value:'') }
function sumSection(ids){ const hidden=getHidden(); return ids.reduce((s,id)=> s + (hidden.includes(id)?0:n(id)),0) }
function sumCustom(section, onlyShared=false){ const gridId=section==='fixed'?'fixedBaseGrid':section==='var'?'varBaseGrid':'saveBaseGrid'; return [...document.querySelectorAll(`#${gridId} label.custom`)].reduce((s,l)=>{ const val=parseDec(l.querySelector('.c-val').value||''); const share=l.classList.contains('share'); return s + ((onlyShared? share: true)? val:0) },0) }

function ensureSplitRow(label){ let sr=label.querySelector('.split-row'); if(!sr){ sr=document.createElement('div'); sr.className='split-row'; label.appendChild(sr); } return sr }
function updateRowShare(label){ const hidden=getHidden(); const id=label.dataset.id; const shared=label.classList.contains('share'); let amount=0; if(label.classList.contains('custom')){ amount=parseDec(label.querySelector('.c-val').value||'') } else { amount= hidden.includes(id)?0:n(id) } const persons=readPersons(); const total=salaryTotal(); const sr=ensureSplitRow(label); sr.innerHTML=''; if(!shared || amount<=0 || total<=0){ sr.style.display='none'; return } sr.style.display='flex'; persons.forEach(p=>{ const share = amount * ((p.salary||0)/total); const pill=document.createElement('span'); pill.className='split-pill'; pill.textContent=`${p.name}: ${kr(share)}`; sr.appendChild(pill); }) }
function updateAllRowShares(){ document.querySelectorAll('label.cat').forEach(updateRowShare); document.querySelectorAll('label.custom').forEach(updateRowShare); }

// ===== Calc & UI updates =====
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
  updateAllRowShares(); updateSharesUI();
}

function updateSharesUI(forceRebuild=false){
  const persons=readPersons(); const total=salaryTotal(); const list=document.getElementById('sharePeople'); if(!list) return; const sharedBaseIds=[ 'boende','bredband','telefoni','barnomsorg1','barnomsorg2','fackforbund','personfors','barnfors','djurfors','hemfors','bilfors','fors_ovrigt','stream_netflix','stream_spotify','stream_hbo','stream_ovrigt1','stream_ovrigt2','mat','hushall','klader','nojen','halsa','energi','ror_ovrigt','bransle','service','skatt','parkering','fordon_ovrigt' ]; const hidden=getHidden(); const sharedSet=getShared(); const sharedBaseSum = sharedBaseIds.reduce((s,id)=> s + (hidden.includes(id)?0: (sharedSet.includes(id)? n(id):0)), 0); const sharedCustomSum = sumCustom('fixed', true) + sumCustom('var', true); const sharedTotal = sharedBaseSum + sharedCustomSum; setText('sharedTotal', kr(sharedTotal)); setText('salaryTotal', kr(total)); const p = total>0? (sharedTotal / total): 0; setText('sharePct', (p*100).toFixed(1)+'%');
  // Rebuild rows when persons changed
  if(forceRebuild || list.children.length!==persons.length){ rebuildPaidRows(); }
  [...document.querySelectorAll('.person-share')].forEach(div=>{ const name=div.dataset.name; const person=persons.find(x=> (x.name||'')===name ); const salary=person? (person.salary||0):0; const andel = total>0? (salary/total):0; const skall = sharedTotal * andel; const paid = parseDec(div.querySelector('.paid').value||''); const progress = skall>0? Math.round(paid*100/skall): 0; const saldo = paid - skall; div.querySelector('.skall').textContent=kr(skall); div.querySelector('.progress').textContent=(progress)+'%'; div.querySelector('.saldo').textContent=kr(saldo); const bar=div.querySelector('.bar>div'); bar.style.width=(Math.min(100,Math.max(0,progress)))+'%'; div.classList.remove('pos','neg'); div.classList.add(saldo>=0?'pos':'neg'); });
}

function updatePeriod(){ const names={'01':'Jan','02':'Feb','03':'Mar','04':'Apr','05':'Maj','06':'Jun','07':'Jul','08':'Aug','09':'Sep','10':'Okt','11':'Nov','12':'Dec'}; const el=document.getElementById('period'); if(el) el.value=`${names[currentMonth]} ${Y()}` }

function getMonthTotals(m){ const raw=localStorage.getItem(key(m)); if(!raw) return {income:0,fixed:0,var:0,spar:0,res:0}; try{ const d=JSON.parse(raw); const dec=x=>parseDec(d[x]); const hidden=d['_hidden']||[]; const H=id=> hidden.includes(id)?0:dec(id); const persons=(d['_persons']||[{name:'Du',salary:0}]).reduce((s,p)=> s+(parseDec(p.salary)||0),0); const income = persons + dec('formaner') + dec('barnbidrag') + dec('ink_ovrigt'); const fors = H('personfors')+H('barnfors')+H('djurfors')+H('hemfors')+H('bilfors')+H('fors_ovrigt'); const stream = H('stream_netflix')+H('stream_spotify')+H('stream_hbo')+H('stream_ovrigt1')+H('stream_ovrigt2'); const fixedCustom=(d['_fixedCustom']||[]).reduce((s,c)=> s+(parseDec(c.value)||0),0); const fixed = (H('boende')+H('bredband')+H('telefoni')+H('barnomsorg1')+H('barnomsorg2')+H('fackforbund')) + fors + stream + fixedCustom; const fordon = H('bransle')+H('service')+H('skatt')+H('parkering')+H('fordon_ovrigt'); const varCustom=(d['_varCustom']||[]).reduce((s,c)=> s+(parseDec(c.value)||0),0); const vari = (H('mat')+H('hushall')+H('klader')+H('nojen')+H('halsa')+H('energi')+H('ror_ovrigt')) + fordon + varCustom; const saveCustom=(d['_saveCustom']||[]).reduce((s,c)=> s+(parseDec(c.value)||0),0); const spar = (H('spar1')+H('spar2')+H('spar3')+H('spar4')+H('spar5')+H('spar6')+H('skuld')) + saveCustom; const res = income - fixed - vari - spar; return {income,fixed,var:vari,spar,res}; }catch{ return {income:0,fixed:0,var:0,spar:0,res:0} } }

function updateYearSummary(){ const ms=['01','02','03','04','05','06','07','08','09','10','11','12']; let yi=0,yf=0,yv=0,ys=0,yr=0; ms.forEach(m=>{ const t=getMonthTotals(m); yi+=t.income; yf+=t.fixed; yv+=t.var; ys+=t.spar; yr+=t.res; }); setText('y_income', kr(yi)); setText('y_fixed', kr(yf)); setText('y_var', kr(yv)); setText('y_spar', kr(ys)); setText('y_result', kr(yr)); }

// ===== CSV/PDF =====
function exportMonthCSV(){ const rows=[["År",Y()],["Månad",currentMonth]]; const add=(a,b)=>rows.push([a,b]); const read=id=>document.getElementById(id)?.value||''; rows.push([]);
  rows.push(['Person','Lön']); readPersons().forEach(p=> rows.push([p.name,p.salary])); rows.push([]);
  add('Förmåner',read('formaner')); add('Barnbidrag',read('barnbidrag')); add('Övrig inkomst',read('ink_ovrigt')); add('Summa inkomster',document.getElementById('sum_income').textContent); rows.push([]);
  ['boende','bredband','telefoni','barnomsorg1','barnomsorg2','fackforbund','personfors','barnfors','djurfors','hemfors','bilfors','fors_ovrigt','stream_netflix','stream_spotify','stream_hbo','stream_ovrigt1','stream_ovrigt2'].forEach(id=> add(id, read(id)) ); rows.push(['Egna fasta','Belopp']); readCustom('fixed').forEach(c=> rows.push([c.name, c.value])); add('Summa streaming',document.getElementById('sum_streaming').textContent); add('Summa fasta',document.getElementById('sum_fixed').textContent); rows.push([]);
  ['mat','hushall','klader','nojen','halsa','energi','ror_ovrigt','bransle','service','skatt','parkering','fordon_ovrigt'].forEach(id=> add(id, read(id)) ); rows.push(['Egna rörliga','Belopp']); readCustom('var').forEach(c=> rows.push([c.name, c.value])); add('Summa fordon',document.getElementById('sum_fordon').textContent); add('Summa rörliga',document.getElementById('sum_var').textContent); rows.push([]);
  ['spar1','spar2','spar3','spar4','spar5','spar6','skuld'].forEach(id=> add(id, read(id)) ); rows.push(['Egna spar/skuld','Belopp']); readCustom('save').forEach(c=> rows.push([c.name, c.value])); add('Summa spar/skuld',document.getElementById('sum_spar').textContent); rows.push([]);
  add('Resultat',document.getElementById('resultat').textContent);
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
const getPoints=()=>parseInt(localStorage.getItem('budgetV101_points')||'0',10);
const setPoints=p=>{ localStorage.setItem('budgetV101_points', String(p)); document.getElementById('points').textContent=String(p) };
function addBadge(name){ const b=document.createElement('span'); b.className='badge'; b.textContent=name; document.getElementById('badges').appendChild(b) }
function updateGamify(){ const p0=getPoints(); let p=p0; document.getElementById('badges').innerHTML=''; const income=val('sum_income'); const res=val('kpiRes'); const save=val('sum_spar'); if(res>0) p+=1; if(income>0 && save>=0.1*income) p+=1; setPoints(p); if(p>=5) addBadge('Sparare 🌱'); if(p>=10) addBadge('Mästare 🏅'); if(p>=20) addBadge('Budget‑pro 👑'); }
const applyTheme=()=>{ const t=localStorage.getItem('budgetV101_theme')||'light'; if(t==='dark') document.documentElement.setAttribute('data-theme','dark'); else document.documentElement.removeAttribute('data-theme') };
const toggleTheme=()=>{ const dark=document.documentElement.getAttribute('data-theme')==='dark'; localStorage.setItem('budgetV101_theme', dark?'light':'dark'); applyTheme() };

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
  document.getElementById('year').addEventListener('change',()=>{ loadMonth(currentMonth); scheduleSave(); });
  document.querySelectorAll('.month-buttons button').forEach(btn=>btn.addEventListener('click',()=>{ loadMonth(btn.dataset.month); scheduleSave(); }));
  document.getElementById('copyPrevBtn').addEventListener('click',copyPrev);
  document.getElementById('resetMonthBtn').addEventListener('click',()=>{ if(confirm('Rensa alla fält för aktuell månad?')) resetMonth(); });
  document.getElementById('csvBtn').addEventListener('click',exportMonthCSV);
  document.getElementById('yearCsvBtn').addEventListener('click',exportYearCSV);
  document.getElementById('pdfBtn').addEventListener('click',exportPDF);
  document.getElementById('tipText').textContent='—'; document.getElementById('nextTip').addEventListener('click',nextTip); nextTip();

  try{ const ctx=JSON.parse(localStorage.getItem(CTX_KEY)||'null'); if(ctx && [...document.getElementById('year').options].some(o=>o.value==ctx.y)){ document.getElementById('year').value=ctx.y; loadMonth(ctx.m); return; } }catch{}
  const m=String(new Date().getMonth()+1).padStart(2,'0'); loadMonth(m);
});

if('serviceWorker' in navigator){ window.addEventListener('load',()=>{ navigator.serviceWorker.register('sw.js'); }); }

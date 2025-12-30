// ===== Hjälp & formattering =====
const fmtKr=new Intl.NumberFormat('sv-SE',{style:'currency',currency:'SEK',maximumFractionDigits:0});
function kr(n){return fmtKr.format(Math.round(n||0))}
function parseDec(s){ if(s==null) return 0; const v=String(s).trim().replace(',','.'); const n=parseFloat(v); return isNaN(n)?0:n }

// Basfält
const STATIC_FIELDS=['period','namn','lon','formaner','barnbidrag','ink_ovrigt','boende','bredband','telefoni','barnomsorg1','barnomsorg2','fackforbund','personfors','barnfors','djurfors','hemfors','bilfors','fors_ovrigt','stream_netflix','stream_spotify','stream_hbo','stream_ovrigt1','stream_ovrigt2','mat','hushall','klader','nojen','halsa','energi','ror_ovrigt','bransle','service','skatt','parkering','fordon_ovrigt','spar1','spar2','spar3','spar4','spar5','spar6','skuld'];
let currentMonth='01'; const CTX_KEY='budgetV92LastContext';

function Y(){return document.getElementById('year').value}
function key(m){return `budgetV92_${Y()}-${m}`}

// ===== Dynamiska betalare =====
function readPayers(){ const rows=[...document.querySelectorAll('.payer-row')]; return rows.map(r=>({ name:r.querySelector('.p-name').value||'', salary: parseDec(r.querySelector('.p-salary').value||'') })) }
function renderPayers(list){ const wrap=document.getElementById('payersList'); wrap.innerHTML=''; (list||[]).forEach(p=> addPayerRow(p.name, p.salary)); }
function addPayerRow(name='', salary=''){ const wrap=document.getElementById('payersList'); const row=document.createElement('div'); row.className='payer-row'; row.innerHTML=`<input class="p-name" type="text" placeholder="Namn" value="${name}"><input class="p-salary" type="text" inputmode="decimal" placeholder="Lön" value="${salary}"><button class="del" title="Ta bort">🗑️</button>`; row.querySelector('.p-name').addEventListener('input',()=>{ calc(); scheduleSave(); }); row.querySelector('.p-salary').addEventListener('input',()=>{ calc(); scheduleSave(); }); row.querySelector('.del').addEventListener('click',()=>{ row.remove(); calc(); scheduleSave(); }); wrap.appendChild(row); }

// ===== Egna kategorier (custom) =====
function addCustomRow(containerId, name='', value=''){ const wrap=document.getElementById(containerId); const row=document.createElement('div'); row.className='custom-row'; row.innerHTML=`<input class="c-name" type="text" placeholder="Kategori" value="${name}"><input class="c-val" type="text" inputmode="decimal" placeholder="Belopp" value="${value}"><button class="del" title="Ta bort">🗑️</button>`; row.querySelector('.c-name').addEventListener('input',()=>{ calc(); scheduleSave(); }); row.querySelector('.c-val').addEventListener('input',()=>{ calc(); scheduleSave(); }); row.querySelector('.del').addEventListener('click',()=>{ row.remove(); calc(); scheduleSave(); }); wrap.appendChild(row); }
function readCustom(containerId){ return [...document.querySelectorAll(`#${containerId} .custom-row`)].map(r=>({ name:r.querySelector('.c-name').value||'', value: parseDec(r.querySelector('.c-val').value||'') })) }

// ===== Dölj bas-kategorier =====
function toggleHideCat(label){ const id=label.dataset.id; label.classList.toggle('hidden'); const hidden=getHidden(); if(label.classList.contains('hidden')){ if(!hidden.includes(id)) hidden.push(id); } else { const i=hidden.indexOf(id); if(i>=0) hidden.splice(i,1); } setHidden(hidden); calc(); scheduleSave(); }
function getHidden(){ try{ return JSON.parse(localStorage.getItem('budgetV92_hidden')||'[]'); }catch{ return [] } }
function setHidden(arr){ localStorage.setItem('budgetV92_hidden', JSON.stringify(arr||[])); }
function isHidden(id){ return getHidden().includes(id) }

// ===== Spara/ladda =====
let saveTimer=null; function scheduleSave(){ clearTimeout(saveTimer); saveTimer=setTimeout(()=>{ saveMonth(); saveCtx(); },300) }
function saveMonth(){ const d={}; STATIC_FIELDS.forEach(id=>{const el=document.getElementById(id); if(el) d[id]=el.value}); d['_payers']=readPayers(); d['_fixedCustom']=readCustom('fixedCustom'); d['_varCustom']=readCustom('varCustom'); d['_saveCustom']=readCustom('saveCustom'); d['_hidden']=getHidden(); localStorage.setItem(key(currentMonth), JSON.stringify(d)); }
function saveCtx(){ localStorage.setItem(CTX_KEY, JSON.stringify({y:Y(), m:currentMonth})) }
function loadMonth(m){ currentMonth=m; document.querySelectorAll('.month-buttons button').forEach(b=>b.classList.toggle('active',b.dataset.month===m)); const raw=localStorage.getItem(key(m)); STATIC_FIELDS.forEach(id=>{const el=document.getElementById(id); if(el) el.value='' }); renderPayers([]); ['fixedCustom','varCustom','saveCustom'].forEach(id=>document.getElementById(id).innerHTML='');
  // reset hidden visning enligt lagrad state
  document.querySelectorAll('label.cat').forEach(l=>{ l.classList.remove('hidden'); if(isHidden(l.dataset.id)) l.classList.add('hidden'); });
  if(raw){ try{ const d=JSON.parse(raw); STATIC_FIELDS.forEach(id=>{const el=document.getElementById(id); if(el && d[id]!==undefined) el.value=d[id] }); renderPayers(d['_payers']||[]); (d['_fixedCustom']||[]).forEach(c=>addCustomRow('fixedCustom',c.name,c.value)); (d['_varCustom']||[]).forEach(c=>addCustomRow('varCustom',c.name,c.value)); (d['_saveCustom']||[]).forEach(c=>addCustomRow('saveCustom',c.name,c.value)); setHidden(d['_hidden']||getHidden()); }catch{} }
  calc(); updatePeriod(); updateYearSummary(); drawPie(); updateGamify(); }
function resetMonth(){ STATIC_FIELDS.forEach(id=>{const el=document.getElementById(id); if(el) el.value='' }); renderPayers([]); ['fixedCustom','varCustom','saveCustom'].forEach(id=>document.getElementById(id).innerHTML=''); saveMonth(); calc(); drawPie(); updateGamify(); }
function copyPrev(){ const n=parseInt(currentMonth,10); const pm=n>1? String(n-1).padStart(2,'0'):null; if(!pm) return alert('Ingen föregående månad'); const raw=localStorage.getItem(key(pm)); if(!raw) return alert('Föregående månad saknar data'); try{ const d=JSON.parse(raw); STATIC_FIELDS.forEach(id=>{const el=document.getElementById(id); if(el) el.value=d[id]||'' }); renderPayers(d['_payers']||[]); ['fixedCustom','varCustom','saveCustom'].forEach(id=>document.getElementById(id).innerHTML=''); (d['_fixedCustom']||[]).forEach(c=>addCustomRow('fixedCustom',c.name,c.value)); (d['_varCustom']||[]).forEach(c=>addCustomRow('varCustom',c.name,c.value)); (d['_saveCustom']||[]).forEach(c=>addCustomRow('saveCustom',c.name,c.value)); setHidden(d['_hidden']||getHidden()); calc(); scheduleSave(); }catch{} }

// ===== Beräkningar =====
function n(id){const el=document.getElementById(id); return parseDec(el?el.value:'') }
function sumCustom(listId){ return readCustom(listId).reduce((s,c)=> s+(c.value||0),0) }
function sumSection(ids){ const hidden=getHidden(); return ids.reduce((s,id)=> s + (hidden.includes(id)?0:n(id)),0) }
function calc(){ const mySalary=n('lon'); const payers=readPayers(); const othersSalary=payers.reduce((s,p)=> s + (p.salary||0), 0);
  const income = mySalary + othersSalary + n('formaner') + n('barnbidrag') + n('ink_ovrigt');
  document.getElementById('sum_income').textContent=kr(income); document.getElementById('kpiIncome').textContent=kr(income);
  const fors = sumSection(['personfors','barnfors','djurfors','hemfors','bilfors','fors_ovrigt']); document.getElementById('sum_fors').textContent=kr(fors);
  const stream = sumSection(['stream_netflix','stream_spotify','stream_hbo','stream_ovrigt1','stream_ovrigt2']); document.getElementById('sum_streaming').textContent=kr(stream);
  const fixedBase = sumSection(['boende','bredband','telefoni','barnomsorg1','barnomsorg2','fackforbund']) + fors + stream;
  const fixedCustom = sumCustom('fixedCustom'); const fixed = fixedBase + fixedCustom; document.getElementById('kpiFixed').textContent=kr(fixed); document.getElementById('sum_fixed').textContent=kr(fixed);
  const fordon = sumSection(['bransle','service','skatt','parkering','fordon_ovrigt']); document.getElementById('sum_fordon').textContent=kr(fordon);
  const varBase = sumSection(['mat','hushall','klader','nojen','halsa','energi','ror_ovrigt']) + fordon; const varCustom=sumCustom('varCustom'); const vari = varBase + varCustom; document.getElementById('sum_var').textContent=kr(vari); document.getElementById('kpiVar').textContent=kr(vari);
  const sparBase = sumSection(['spar1','spar2','spar3','spar4','spar5','spar6','skuld']); const sparCustom=sumCustom('saveCustom'); const spar = sparBase + sparCustom; document.getElementById('sum_spar').textContent=kr(spar); document.getElementById('kpiSave').textContent=kr(spar);
  const res = income - fixed - vari - spar; document.getElementById('resultat').textContent=kr(res); document.getElementById('kpiRes').textContent=kr(res);
  const spent = fixed+vari; const left = Math.max(0, income - spent); const pct = income>0? Math.round(left*100/income):0; document.getElementById('leftPct').textContent=pct+"%"; document.getElementById('leftBar').style.width=pct+"%";
}

function updatePeriod(){ const names={'01':'Jan','02':'Feb','03':'Mar','04':'Apr','05':'Maj','06':'Jun','07':'Jul','08':'Aug','09':'Sep','10':'Okt','11':'Nov','12':'Dec'}; const el=document.getElementById('period'); if(el) el.value=`${names[currentMonth]} ${Y()}` }

function getMonthTotals(m){ const raw=localStorage.getItem(key(m)); if(!raw) return {income:0,fixed:0,var:0,spar:0,res:0}; try{ const d=JSON.parse(raw); const dec=(x)=>parseDec(d[x]); const payers=(d['_payers']||[]).reduce((s,p)=> s+(parseDec(p.salary)||0),0); const hidden=d['_hidden']||[]; const H=(id)=> hidden.includes(id)?0:dec(id);
  const income = dec('lon') + payers + dec('formaner') + dec('barnbidrag') + dec('ink_ovrigt');
  const fors = H('personfors')+H('barnfors')+H('djurfors')+H('hemfors')+H('bilfors')+H('fors_ovrigt');
  const stream = H('stream_netflix')+H('stream_spotify')+H('stream_hbo')+H('stream_ovrigt1')+H('stream_ovrigt2');
  const fixedBase = H('boende')+H('bredband')+H('telefoni')+H('barnomsorg1')+H('barnomsorg2')+H('fackforbund') + fors + stream; const fixedCustom = (d['_fixedCustom']||[]).reduce((s,c)=> s+(parseDec(c.value)||0),0); const fixed = fixedBase + fixedCustom;
  const fordon = H('bransle')+H('service')+H('skatt')+H('parkering')+H('fordon_ovrigt');
  const varBase = H('mat')+H('hushall')+H('klader')+H('nojen')+H('halsa')+H('energi')+H('ror_ovrigt') + fordon; const varCustom=(d['_varCustom']||[]).reduce((s,c)=> s+(parseDec(c.value)||0),0); const vari = varBase + varCustom;
  const sparBase = H('spar1')+H('spar2')+H('spar3')+H('spar4')+H('spar5')+H('spar6')+H('skuld'); const sparCustom=(d['_saveCustom']||[]).reduce((s,c)=> s+(parseDec(c.value)||0),0); const spar = sparBase + sparCustom;
  const res = income - fixed - vari - spar; return {income,fixed,var:vari,spar,res}; }catch{return {income:0,fixed:0,var:0,spar:0,res:0};} }

function updateYearSummary(){ const ms=['01','02','03','04','05','06','07','08','09','10','11','12']; let yi=0,yf=0,yv=0,ys=0,yr=0; ms.forEach(m=>{const t=getMonthTotals(m); yi+=t.income; yf+=t.fixed; yv+=t.var; ys+=t.spar; yr+=t.res;}); document.getElementById('y_income').textContent=kr(yi); document.getElementById('y_fixed').textContent=kr(yf); document.getElementById('y_var').textContent=kr(yv); document.getElementById('y_spar').textContent=kr(ys); document.getElementById('y_result').textContent=kr(yr); }

// ===== CSV =====
function exportMonthCSV(){ const rows=[["År",Y()],["Månad",currentMonth]]; const add=(a,b)=>rows.push([a,b]); const read=id=>{const el=document.getElementById(id); return el?el.value:''}; add('Period',read('period')); add('Namn',read('namn')); rows.push([]);
  // Inkomster
  add('Lön',read('lon')); add('Förmåner',read('formaner')); add('Barnbidrag',read('barnbidrag')); add('Övrig inkomst',read('ink_ovrigt')); add('Summa inkomster',document.getElementById('sum_income').textContent); rows.push(['Betalande i hushållet','Lön']); readPayers().forEach(p=> rows.push([p.name, p.salary])); rows.push([]);
  // Fasta
  ['boende','bredband','telefoni','barnomsorg1','barnomsorg2','fackforbund','personfors','barnfors','djurfors','hemfors','bilfors','fors_ovrigt','stream_netflix','stream_spotify','stream_hbo','stream_ovrigt1','stream_ovrigt2'].forEach(id=> add(id, read(id)) ); rows.push(['Egna fasta','Belopp']); readCustom('fixedCustom').forEach(c=> rows.push([c.name, c.value])); add('Summa fasta',document.getElementById('sum_fixed').textContent); rows.push([]);
  // Rörliga
  ['mat','hushall','klader','nojen','halsa','energi','ror_ovrigt','bransle','service','skatt','parkering','fordon_ovrigt'].forEach(id=> add(id, read(id)) ); rows.push(['Egna rörliga','Belopp']); readCustom('varCustom').forEach(c=> rows.push([c.name, c.value])); add('Summa rörliga',document.getElementById('sum_var').textContent); rows.push([]);
  // Spar/skuld
  ['spar1','spar2','spar3','spar4','spar5','spar6','skuld'].forEach(id=> add(id, read(id)) ); rows.push(['Egna spar/skuld','Belopp']); readCustom('saveCustom').forEach(c=> rows.push([c.name, c.value])); add('Summa spar/skuld',document.getElementById('sum_spar').textContent); rows.push([]);
  add('Resultat',document.getElementById('resultat').textContent);
  const csv=rows.map(r=>r.join(';')).join('\n'); const blob=new Blob([csv],{type:'text/csv;charset=utf-8;'}); const url=URL.createObjectURL(blob); const a=document.createElement('a'); a.href=url; a.download=`budget_${Y()}-${currentMonth}.csv`; a.click(); URL.revokeObjectURL(url); }
function exportYearCSV(){ const ms=['01','02','03','04','05','06','07','08','09','10','11','12']; const rows=[["År",Y()],[],['Månad','Inkomster','Fasta','Rörliga','Spar/Skuld','Resultat']]; ms.forEach(m=>{ const t=getMonthTotals(m); rows.push([m,t.income,t.fixed,t.var,t.spar,t.res]); }); const csv=rows.map(r=>r.join(';')).join('\n'); const blob=new Blob([csv],{type:'text/csv;charset=utf-8;'}); const url=URL.createObjectURL(blob); const a=document.createElement('a'); a.href=url; a.download=`budget_${Y()}_arsoversikt.csv`; a.click(); URL.revokeObjectURL(url); }

// ===== PDF =====
async function exportPDF(){ const { jsPDF } = window.jspdf; const doc = new jsPDF({orientation:'p', unit:'pt'});
 const margin=40; let y=margin; const T=(t,val='')=>{ doc.text(`${t} ${val}`, margin, y); y+=18; }
 doc.setFontSize(16); doc.text('Hushållsbudget – Månad', margin, y); y+=24; doc.setFontSize(12);
 T('Period:', document.getElementById('period').value); T('Namn:', document.getElementById('namn').value); y+=6;
 T('Inkomster:', document.getElementById('sum_income').textContent); T('Fasta:', document.getElementById('sum_fixed').textContent); T('Rörliga:', document.getElementById('sum_var').textContent); T('Spar/Skuld:', document.getElementById('sum_spar').textContent); T('Resultat:', document.getElementById('resultat').textContent); y+=12;
 const payers=readPayers(); if(payers.length){ doc.text('Betalande i hushållet:', margin, y); y+=18; payers.forEach(p=>{ doc.text(`• ${p.name}: ${p.salary} kr`, margin+16, y); y+=16; }); }
 doc.save(`budget_${Y()}-${currentMonth}.pdf`);
}

// ===== Diagram =====
let pie; function drawPie(){ try{ const ctx=document.getElementById('pie'); if(!ctx) return; const data={ labels:['Fasta','Rörliga','Spar/Skuld'], datasets:[{ data:[ val('sum_fixed'), val('sum_var'), val('sum_spar') ], backgroundColor:['#f59e0b','#ef4444','#22c55e']}]}; if(pie) pie.destroy(); pie=new Chart(ctx,{type:'pie', data, options:{plugins:{legend:{position:'bottom'}}}});}catch{}}
function val(id){ const txt=document.getElementById(id).textContent.replace(/[^0-9\-]/g,''); return parseInt(txt||'0',10) }

// ===== Tips =====
const TIPS=[ 'Sätt autogiro för sparande direkt efter löning.', 'Jämför försäkringar vartannat år.', 'Planera veckans mat – minska spontanköp.', 'Förhandla bolåneräntan årligen.', 'Rensa onödiga prenumerationer varje kvartal.' ];
function nextTip(){ const t=TIPS[Math.floor(Math.random()*TIPS.length)]; document.getElementById('tipText').textContent=t }

// ===== Gamification =====
function getPoints(){ return parseInt(localStorage.getItem('budgetV92_points')||'0',10) }
function setPoints(p){ localStorage.setItem('budgetV92_points', String(p)); document.getElementById('points').textContent=String(p) }
function addBadge(name){ const b=document.createElement('span'); b.className='badge'; b.textContent=name; document.getElementById('badges').appendChild(b) }
function updateGamify(){ const p0=getPoints(); let p=p0; document.getElementById('badges').innerHTML=''; const income=val('sum_income'); const res=val('kpiRes'); const save=val('sum_spar'); if(res>0) p+=1; if(income>0 && save>=0.1*income) p+=1; setPoints(p); if(p>=5) addBadge('Sparare 🌱'); if(p>=10) addBadge('Mästare 🏅'); if(p>=20) addBadge('Budget‑pro 👑'); }

// ===== Theme =====
function applyTheme(){ const t=localStorage.getItem('budgetV92_theme')||'light'; if(t==='dark') document.documentElement.setAttribute('data-theme','dark'); else document.documentElement.removeAttribute('data-theme') }
function toggleTheme(){ const dark=document.documentElement.getAttribute('data-theme')==='dark'; localStorage.setItem('budgetV92_theme', dark?'light':'dark'); applyTheme() }

// ===== Init & events =====
window.addEventListener('DOMContentLoaded',()=>{
  applyTheme();
  document.getElementById('darkToggle').addEventListener('click',toggleTheme);
  document.getElementById('addPayerBtn').addEventListener('click',()=>{ addPayerRow('', ''); calc(); scheduleSave(); });
  document.getElementById('addFixedCustom').addEventListener('click',()=>{ addCustomRow('fixedCustom','',''); calc(); scheduleSave(); });
  document.getElementById('addVarCustom').addEventListener('click',()=>{ addCustomRow('varCustom','',''); calc(); scheduleSave(); });
  document.getElementById('addSaveCustom').addEventListener('click',()=>{ addCustomRow('saveCustom','',''); calc(); scheduleSave(); });
  document.querySelectorAll('input').forEach(el=>el.addEventListener('input',()=>{ calc(); scheduleSave(); drawPie(); updateGamify(); }));
  document.querySelectorAll('label.cat .hideCat').forEach(btn=> btn.addEventListener('click',(e)=>{ const label=e.target.closest('label.cat'); toggleHideCat(label); }));
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

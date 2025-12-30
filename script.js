// ===== Hjälp & formattering =====
const fmtKr=new Intl.NumberFormat('sv-SE',{style:'currency',currency:'SEK',maximumFractionDigits:0});
const FIELDS=['period','namn','lon1','lon2','formaner','barnbidrag','ink_ovrigt','boende','bredband','telefoni','barnomsorg1','barnomsorg2','fackforbund','personfors','barnfors','djurfors','hemfors','bilfors','fors_ovrigt','stream_netflix','stream_spotify','stream_hbo','stream_ovrigt1','stream_ovrigt2','mat','hushall','klader','nojen','halsa','energi','ror_ovrigt','bransle','service','skatt','parkering','fordon_ovrigt','spar1','spar2','spar3','spar4','spar5','spar6','skuld'];
let currentMonth='01'; const CTX_KEY='budgetV9LastContext';

function num(id){const el=document.getElementById(id); if(!el) return 0; const v=parseFloat((el.value||'').replace(',','.')); return isNaN(v)?0:v}
function kr(n){return fmtKr.format(Math.round(n||0))}
let saveTimer=null; function scheduleSave(){ document.body.classList.add('saving'); clearTimeout(saveTimer); saveTimer=setTimeout(()=>{ document.body.classList.remove('saving'); saveMonth(); saveCtx(); },400)}

function Y(){return document.getElementById('year').value}
function key(m){return `budgetV9_${Y()}-${m}`}
function saveMonth(){ const d={}; FIELDS.forEach(id=>{const el=document.getElementById(id); if(el) d[id]=el.value}); localStorage.setItem(key(currentMonth), JSON.stringify(d));}
function saveCtx(){ localStorage.setItem(CTX_KEY, JSON.stringify({y:Y(), m:currentMonth}))}
function loadMonth(m){ currentMonth=m; document.querySelectorAll('.month-buttons button').forEach(b=>b.classList.toggle('active',b.dataset.month===m)); const raw=localStorage.getItem(key(m)); FIELDS.forEach(id=>{const el=document.getElementById(id); if(el) el.value=''})
  if(raw){ try{ const d=JSON.parse(raw); FIELDS.forEach(id=>{const el=document.getElementById(id); if(el&&d[id]!==undefined) el.value=d[id] }) }catch{}
  }
  calc(); updatePeriod(); updateYearSummary(); drawPie(); updateGamify();}
function resetMonth(){ FIELDS.forEach(id=>{const el=document.getElementById(id); if(el) el.value='' }); saveMonth(); calc(); drawPie(); updateGamify();}
function copyPrev(){ const n=parseInt(currentMonth,10); const pm=n>1? String(n-1).padStart(2,'0'):null; if(!pm) return alert('Ingen föregående månad'); const raw=localStorage.getItem(key(pm)); if(!raw) return alert('Föregående månad saknar data'); try{ const d=JSON.parse(raw); FIELDS.forEach(id=>{const el=document.getElementById(id); if(el) el.value=d[id]||''}); calc(); scheduleSave(); }catch{}}

function calc(){ const income=num('lon1')+num('lon2')+num('formaner')+num('barnbidrag')+num('ink_ovrigt');
 document.getElementById('sum_income').textContent=kr(income); document.getElementById('kpiIncome').textContent=kr(income);
 const fors=num('personfors')+num('barnfors')+num('djurfors')+num('hemfors')+num('bilfors')+num('fors_ovrigt'); document.getElementById('sum_fors').textContent=kr(fors);
 const stream=num('stream_netflix')+num('stream_spotify')+num('stream_hbo')+num('stream_ovrigt1')+num('stream_ovrigt2'); document.getElementById('sum_streaming').textContent=kr(stream);
 const fixed=num('boende')+num('bredband')+num('telefoni')+num('barnomsorg1')+num('barnomsorg2')+num('fackforbund')+fors+stream; document.getElementById('sum_fixed').textContent=kr(fixed); document.getElementById('kpiFixed').textContent=kr(fixed);
 const fordon=num('bransle')+num('service')+num('skatt')+num('parkering')+num('fordon_ovrigt'); document.getElementById('sum_fordon').textContent=kr(fordon);
 const vari=num('mat')+num('hushall')+num('klader')+num('nojen')+num('halsa')+num('energi')+num('ror_ovrigt')+fordon; document.getElementById('sum_var').textContent=kr(vari); document.getElementById('kpiVar').textContent=kr(vari);
 const spar=num('spar1')+num('spar2')+num('spar3')+num('spar4')+num('spar5')+num('spar6')+num('skuld'); document.getElementById('sum_spar').textContent=kr(spar); document.getElementById('kpiSave').textContent=kr(spar);
 const res=income-fixed-vari-spar; document.getElementById('resultat').textContent=kr(res); document.getElementById('kpiRes').textContent=kr(res);
 // progressbar (kvar av inkomster efter utgifter exkl spar)
 const spent = fixed+vari; const left = Math.max(0, income - spent); const pct = income>0? Math.round(left*100/income):0; document.getElementById('leftPct').textContent=pct+"%"; document.getElementById('leftBar').style.width=pct+"%";
}

function updatePeriod(){ const names={'01':'Jan','02':'Feb','03':'Mar','04':'Apr','05':'Maj','06':'Jun','07':'Jul','08':'Aug','09':'Sep','10':'Okt','11':'Nov','12':'Dec'}; const el=document.getElementById('period'); if(el) el.value=`${names[currentMonth]} ${Y()}` }

function getMonthTotals(m){ const raw=localStorage.getItem(key(m)); if(!raw) return {income:0,fixed:0,var:0,spar:0,res:0}; try{ const d=JSON.parse(raw); const n=(k)=>{const v=parseFloat(((d[k]||'')+ '').replace(',','.')); return isNaN(v)?0:v}; const income=n('lon1')+n('lon2')+n('formaner')+n('barnbidrag')+n('ink_ovrigt'); const fors=n('personfors')+n('barnfors')+n('djurfors')+n('hemfors')+n('bilfors')+n('fors_ovrigt'); const stream=n('stream_netflix')+n('stream_spotify')+n('stream_hbo')+n('stream_ovrigt1')+n('stream_ovrigt2'); const fixed=n('boende')+n('bredband')+n('telefoni')+n('barnomsorg1')+n('barnomsorg2')+n('fackforbund')+fors+stream; const fordon=n('bransle')+n('service')+n('skatt')+n('parkering')+n('fordon_ovrigt'); const vari=n('mat')+n('hushall')+n('klader')+n('nojen')+n('halsa')+n('energi')+n('ror_ovrigt')+fordon; const spar=n('spar1')+n('spar2')+n('spar3')+n('spar4')+n('spar5')+n('spar6')+n('skuld'); const res=income-fixed-vari-spar; return {income,fixed,var:vari,spar,res}; }catch{return {income:0,fixed:0,var:0,spar:0,res:0};}}

function updateYearSummary(){ const ms=['01','02','03','04','05','06','07','08','09','10','11','12']; let yi=0,yf=0,yv=0,ys=0,yr=0; ms.forEach(m=>{const t=getMonthTotals(m); yi+=t.income; yf+=t.fixed; yv+=t.var; ys+=t.spar; yr+=t.res;}); document.getElementById('y_income').textContent=kr(yi); document.getElementById('y_fixed').textContent=kr(yf); document.getElementById('y_var').textContent=kr(yv); document.getElementById('y_spar').textContent=kr(ys); document.getElementById('y_result').textContent=kr(yr); }

// ===== CSV =====
function exportMonthCSV(){ const rows=[["År",Y()],["Månad",currentMonth]]; const add=(a,b)=>rows.push([a,b]); const read=id=>{const el=document.getElementById(id); return el?el.value:''}; add('Period',read('period')); add('Namn',read('namn')); rows.push([]);
 add('Lön 1',read('lon1')); add('Lön 2',read('lon2')); add('Förmåner',read('formaner')); add('Barnbidrag',read('barnbidrag')); add('Övrig inkomst',read('ink_ovrigt')); add('Summa inkomster',document.getElementById('sum_income').textContent); rows.push([]);
 add('Hyra/Bolån',read('boende')); add('Bredband',read('bredband')); add('Telefoni',read('telefoni')); add('Barnomsorg 1',read('barnomsorg1')); add('Barnomsorg 2',read('barnomsorg2')); add('Fackförbund',read('fackforbund'));
 add('Personförsäkring',read('personfors')); add('Barnförsäkring',read('barnfors')); add('Djurförsäkring',read('djurfors')); add('Hemförsäkring',read('hemfors')); add('Bilförsäkring',read('bilfors')); add('Övriga försäkringar',read('fors_ovrigt')); add('Summa försäkringar',document.getElementById('sum_fors').textContent);
 add('Streaming Netflix',read('stream_netflix')); add('Spotify',read('stream_spotify')); add('HBO',read('stream_hbo')); add('Streaming övrigt 1',read('stream_ovrigt1')); add('Streaming övrigt 2',read('stream_ovrigt2')); add('Summa streaming',document.getElementById('sum_streaming').textContent); add('Summa fasta',document.getElementById('sum_fixed').textContent); rows.push([]);
 add('Mat',read('mat')); add('Hushåll',read('hushall')); add('Kläder',read('klader')); add('Nöjen',read('nojen')); add('Hälsa',read('halsa')); add('El/Värme',read('energi')); add('Övrigt rörligt',read('ror_ovrigt'));
 add('Bränsle',read('bransle')); add('Service',read('service')); add('Skatt/Besiktning',read('skatt')); add('Parkering',read('parkering')); add('Övrigt fordon',read('fordon_ovrigt')); add('Summa fordon',document.getElementById('sum_fordon').textContent); add('Summa rörliga',document.getElementById('sum_var').textContent); rows.push([]);
 add('Spar 1',read('spar1')); add('Spar 2',read('spar2')); add('Spar 3',read('spar3')); add('Spar 4',read('spar4')); add('Spar 5',read('spar5')); add('Spar 6',read('spar6')); add('Skuldamortering',read('skuld')); add('Summa spar/skuld',document.getElementById('sum_spar').textContent); rows.push([]);
 add('Resultat',document.getElementById('resultat').textContent);
 const csv=rows.map(r=>r.join(';')).join('\n'); const blob=new Blob([csv],{type:'text/csv;charset=utf-8;'}); const url=URL.createObjectURL(blob); const a=document.createElement('a'); a.href=url; a.download=`budget_${Y()}-${currentMonth}.csv`; a.click(); URL.revokeObjectURL(url);}
function exportYearCSV(){ const ms=['01','02','03','04','05','06','07','08','09','10','11','12']; const rows=[["År",Y()],[],['Månad','Inkomster','Fasta','Rörliga','Spar/Skuld','Resultat']]; ms.forEach(m=>{ const t=getMonthTotals(m); rows.push([m,t.income,t.fixed,t.var,t.spar,t.res]); }); const csv=rows.map(r=>r.join(';')).join('\n'); const blob=new Blob([csv],{type:'text/csv;charset=utf-8;'}); const url=URL.createObjectURL(blob); const a=document.createElement('a'); a.href=url; a.download=`budget_${Y()}_arsoversikt.csv`; a.click(); URL.revokeObjectURL(url); }

// ===== PDF =====
async function exportPDF(){ const {{ jsPDF }} = window.jspdf; const doc = new jsPDF({orientation:'p', unit:'pt'});
 const margin=40; let y=margin; const line=(t,val='')=>{ doc.text(`${t} ${val}`, margin, y); y+=18; }
 doc.setFontSize(16); doc.text('Hushållsbudget – Månad', margin, y); y+=24; doc.setFontSize(12);
 line('Period:', document.getElementById('period').value); line('Namn:', document.getElementById('namn').value); y+=6;
 line('Inkomster:', document.getElementById('sum_income').textContent); line('Fasta:', document.getElementById('sum_fixed').textContent); line('Rörliga:', document.getElementById('sum_var').textContent); line('Spar/Skuld:', document.getElementById('sum_spar').textContent); line('Resultat:', document.getElementById('resultat').textContent); y+=12;
 doc.text('Detta är en sammanfattning. För detaljer, använd CSV-export.', margin, y); y+=24;
 doc.save(`budget_${Y()}-${currentMonth}.pdf`);
}

// ===== Diagram =====
let pie; function drawPie(){ try{ const ctx=document.getElementById('pie'); if(!ctx) return; const data={ labels:['Fasta','Rörliga','Spar/Skuld'], datasets:[{ data:[ val('sum_fixed'), val('sum_var'), val('sum_spar') ], backgroundColor:['#f59e0b','#ef4444','#22c55e']}]}; if(pie) pie.destroy(); pie=new Chart(ctx,{type:'pie', data, options:{plugins:{legend:{position:'bottom'}}}});}catch{}}
function val(id){ const txt=document.getElementById(id).textContent.replace(/[^0-9\-]/g,''); return parseInt(txt||'0',10) }

// ===== Tips =====
const TIPS=[
 'Sätt autogiro för sparande dagen efter löning – så blir det av.',
 'Jämför försäkringar vartannat år – många betalar för mycket.',
 'Planera veckans mat – minska spontanköp och svinn.',
 'Förhandla bolåneräntan årligen – lojalitet lönar sig sällan.',
 'Stäng av onödiga prenumerationer – gör en kvartalsrensning.'
];
function nextTip(){ const t=TIPS[Math.floor(Math.random()*TIPS.length)]; document.getElementById('tipText').textContent=t }

// ===== Gamification =====
function getPoints(){ return parseInt(localStorage.getItem('budgetV9_points')||'0',10) }
function setPoints(p){ localStorage.setItem('budgetV9_points', String(p)); document.getElementById('points').textContent=String(p) }
function addBadge(name){ const b=document.createElement('span'); b.className='badge'; b.textContent=name; document.getElementById('badges').appendChild(b) }
function updateGamify(){ // Poäng för överskott > 0 och sparande >= 10% av inkomst
 const income=valNum(num('lon1')+num('lon2')+num('formaner')+num('barnbidrag')+num('ink_ovrigt'));
 const res=valNum(num('lon1')+num('lon2')+num('formaner')+num('barnbidrag')+num('ink_ovrigt') - (num('boende')+num('bredband')+num('telefoni')+num('barnomsorg1')+num('barnomsorg2')+num('fackforbund')+ num('personfors')+num('barnfors')+num('djurfors')+num('hemfors')+num('bilfors')+num('fors_ovrigt')+ num('stream_netflix')+num('stream_spotify')+num('stream_hbo')+num('stream_ovrigt1')+num('stream_ovrigt2')+ num('mat')+num('hushall')+num('klader')+num('nojen')+num('halsa')+num('energi')+num('ror_ovrigt')+ num('bransle')+num('service')+num('skatt')+num('parkering')+num('fordon_ovrigt')) - (num('spar1')+num('spar2')+num('spar3')+num('spar4')+num('spar5')+num('spar6')+num('skuld')) );
 const spar=num('spar1')+num('spar2')+num('spar3')+num('spar4')+num('spar5')+num('spar6');
 const p0=getPoints(); let p=p0; const badgesEl=document.getElementById('badges'); badgesEl.innerHTML='';
 if(res>0) p+=1; if(income>0 && spar>=0.1*income) p+=1; setPoints(p);
 if(p>=5) addBadge('Sparare 🌱'); if(p>=10) addBadge('Mästare 🏅'); if(p>=20) addBadge('Budget‑pro 👑');
}
function valNum(n){return Math.round(n)}

// ===== Dark mode =====
function applyTheme(){ const t=localStorage.getItem('budgetV9_theme')||'light'; if(t==='dark') document.documentElement.setAttribute('data-theme','dark'); else document.documentElement.removeAttribute('data-theme') }
function toggleTheme(){ const dark=document.documentElement.getAttribute('data-theme')==='dark'; localStorage.setItem('budgetV9_theme', dark?'light':'dark'); applyTheme() }

// ===== Init & events =====
window.addEventListener('DOMContentLoaded',()=>{
  applyTheme();
  document.getElementById('darkToggle').addEventListener('click',toggleTheme);
  document.querySelectorAll('input').forEach(el=>el.addEventListener('input',()=>{ calc(); scheduleSave(); drawPie(); updateGamify(); }));
  document.getElementById('year').addEventListener('change',()=>{ loadMonth(currentMonth); scheduleSave(); });
  document.querySelectorAll('.month-buttons button').forEach(btn=>btn.addEventListener('click',()=>{ loadMonth(btn.dataset.month); scheduleSave(); }));
  document.getElementById('copyPrevBtn').addEventListener('click',copyPrev);
  document.getElementById('resetMonthBtn').addEventListener('click',()=>{ if(confirm('Rensa alla fält för aktuell månad?')) resetMonth(); });
  document.getElementById('csvBtn').addEventListener('click',exportMonthCSV);
  document.getElementById('yearCsvBtn').addEventListener('click',exportYearCSV);
  document.getElementById('pdfBtn').addEventListener('click',exportPDF);
  document.getElementById('tipText').textContent='—'; document.getElementById('nextTip').addEventListener('click',nextTip); nextTip();

  // Återställ kontext eller default till nuvarande månad
  try{ const ctx=JSON.parse(localStorage.getItem('budgetV9LastContext')||'null'); if(ctx && [...document.getElementById('year').options].some(o=>o.value==ctx.y)){ document.getElementById('year').value=ctx.y; loadMonth(ctx.m); return; } }catch{}
  const m=String(new Date().getMonth()+1).padStart(2,'0'); loadMonth(m);
});

// PWA SW
if('serviceWorker' in navigator){ window.addEventListener('load',()=>{ navigator.serviceWorker.register('sw.js'); }); }

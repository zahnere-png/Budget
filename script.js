
const fmt=new Intl.NumberFormat('sv-SE',{style:'currency',currency:'SEK',maximumFractionDigits:0});
function n(id){const el=document.getElementById(id); const v=parseFloat((el?.value||'').replace(',','.')); return isNaN(v)?0:v}
let t=null; function autosave(){clearTimeout(t); t=setTimeout(()=>save(),400)}
const fields=['period','namn','lon1','lon2','formaner','barnbidrag','ink_ovrigt','boende','bredband','telefoni','barnomsorg1','barnomsorg2','personfors','barnfors','djurfors','hemfors','bilfors','fors_ovrigt','mat','hushall','klader','nojen','halsa','energi','ror_ovrigt','bransle','service','skatt','parkering','fordon_ovrigt','stream_netflix','stream_spotify','stream_hbo','stream_ovrigt1','stream_ovrigt2','spar1','spar2','spar3','spar4','spar5','spar6','skuld'];
let curM='01'; const CTX='budgetLastContext';
function save(){const d={}; fields.forEach(id=>{const el=document.getElementById(id); if(el) d[id]=el.value}); localStorage.setItem(key(),JSON.stringify(d)); localStorage.setItem(CTX,JSON.stringify({y:Y(),m:curM}))}
function Y(){const sel=document.getElementById('year'); return sel?.value||String(new Date().getFullYear())}
function key(){return `budgetData_${Y()}-${curM}`}
function load(m){curM=m; const raw=localStorage.getItem(key()); fields.forEach(id=>{const el=document.getElementById(id); if(el) el.value=''}); if(raw){try{const d=JSON.parse(raw); fields.forEach(id=>{const el=document.getElementById(id); if(el&&d[id]!==undefined) el.value=d[id]})}catch{}} calc(); setPeriod()}
function calc(){const income=n('lon1')+n('lon2')+n('formaner')+n('barnbidrag')+n('ink_ovrigt');
 document.getElementById('sum_income')?.replaceChildren(fmt.format(Math.round(income)));
 const fors=n('personfors')+n('barnfors')+n('djurfors')+n('hemfors')+n('bilfors')+n('fors_ovrigt');
 document.getElementById('sum_fors')?.replaceChildren(fmt.format(Math.round(fors)));
 const stream=n('stream_netflix')+n('stream_spotify')+n('stream_hbo')+n('stream_ovrigt1')+n('stream_ovrigt2');
 document.getElementById('sum_streaming')?.replaceChildren(fmt.format(Math.round(stream)));
 const fordon=n('bransle')+n('service')+n('skatt')+n('parkering')+n('fordon_ovrigt');
 document.getElementById('sum_fordon')?.replaceChildren(fmt.format(Math.round(fordon)));
 const fixed=n('boende')+n('bredband')+n('telefoni')+n('barnomsorg1')+n('barnomsorg2')+fors+stream;
 const vari=n('mat')+n('hushall')+n('klader')+n('nojen')+n('halsa')+n('energi')+n('ror_ovrigt')+fordon;
 const spar=n('spar1')+n('spar2')+n('spar3')+n('spar4')+n('spar5')+n('spar6')+n('skuld');
 const res=income-fixed-vari-spar; document.getElementById('resultat')?.replaceChildren(fmt.format(Math.round(res)))}
function setPeriod(){const names={'01':'Jan','02':'Feb','03':'Mar','04':'Apr','05':'Maj','06':'Jun','07':'Jul','08':'Aug','09':'Sep','10':'Okt','11':'Nov','12':'Dec'}; document.getElementById('period').value=`${names[curM]} ${Y()}`}
window.addEventListener('DOMContentLoaded',()=>{
  const yearSel=document.getElementById('year'); if(yearSel){const now=new Date().getFullYear(); for(let y=now;y<=now+5;y++){const o=document.createElement('option'); o.value=String(y); o.textContent=String(y); yearSel.appendChild(o)} yearSel.value=String(now); yearSel.addEventListener('change',()=>{load(curM); autosave()})}
  document.querySelectorAll('input').forEach(el=>el.addEventListener('input',()=>{calc(); autosave()}));
  document.body.insertAdjacentHTML('afterbegin',`<nav class="tabs" aria-label="Månadsflikar"><div class="year-picker"><label for="year">År</label><select id="year"></select></div><div class="month-buttons">${['01','02','03','04','05','06','07','08','09','10','11','12'].map((m,i)=>`<button data-month="${m}" class="${i==0?'active':''}">${['Jan','Feb','Mar','Apr','Maj','Jun','Jul','Aug','Sep','Okt','Nov','Dec'][i]}</button>`).join('')}</div></nav>`);
  document.querySelectorAll('.month-buttons button').forEach(b=>b.addEventListener('click',()=>{document.querySelectorAll('.month-buttons button').forEach(x=>x.classList.remove('active')); b.classList.add('active'); load(b.dataset.month); autosave()}));
  const ctx=JSON.parse(localStorage.getItem(CTX)||'null'); const m=ctx?.m||String(new Date().getMonth()+1).padStart(2,'0'); load(m)
});
if('serviceWorker' in navigator){ window.addEventListener('load',()=>navigator.serviceWorker.register('sw.js'))}

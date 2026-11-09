/* CivicPulse – Community Complaint Reporting System (SDG 11)
   Storage: Firebase Firestore (cloud) if firebase-config.js is filled, otherwise browser localStorage (demo mode). */
(() => {
const $ = s => document.querySelector(s);
const SLA = { Pothole:5, Garbage:2, Streetlight:3, 'Water Leak':2, Drainage:4, Other:7 }; // days
const FLOW = ['Submitted','Assigned','InProgress','Resolved','Closed'];
const LABEL = { Submitted:'Submitted', Assigned:'Assigned', InProgress:'In Progress', Resolved:'Resolved – awaiting citizen', Closed:'Closed ✓ Verified', Escalated:'Escalated ⚠' };
const CENTER = [12.3052, 76.6552]; // Mysuru
const DAY = 864e5;
let data = [], db = null, pickMap, pickPin, bigMap, layer, chosen = null, photoData = '';

/* ---------- storage layer ---------- */
const local = {
  load(){ try { return JSON.parse(localStorage.getItem('cp_data')) || null; } catch { return null; } },
  save(){ try { localStorage.setItem('cp_data', JSON.stringify(data)); } catch {} }
};
function loadScript(src){ return new Promise((ok,no)=>{ const s=document.createElement('script'); s.src=src; s.onload=ok; s.onerror=no; document.head.appendChild(s); }); }
async function initCloud(){
  if (!window.FIREBASE_CONFIG) return false;
  try {
    await loadScript('https://www.gstatic.com/firebasejs/10.12.2/firebase-app-compat.js');
    await loadScript('https://www.gstatic.com/firebasejs/10.12.2/firebase-firestore-compat.js');
    firebase.initializeApp(window.FIREBASE_CONFIG);
    db = firebase.firestore();
    const snap = await db.collection('complaints').get();
    data = snap.docs.map(d => d.data());
    if (!data.length) { data = seed(); await Promise.all(data.map(saveOne)); }
    return true;
  } catch (e) { console.warn('Firebase unavailable, using demo mode', e); db = null; return false; }
}
async function saveOne(c){
  local.save();
  if (db) { try { await db.collection('complaints').doc(c.id).set(c); } catch(e){ console.warn(e); } }
}

/* ---------- seed demo data ---------- */
function seed(){
  const now = Date.now();
  const mk = (n,cat,area,desc,lat,lng,ageDays,status,votes) => {
    const created = now - ageDays*DAY;
    const hist = []; const idx = FLOW.indexOf(status);
    for (let i=0;i<=idx;i++) hist.push({ s:FLOW[i], t: created + i*(ageDays*DAY/(idx+1)) });
    return { id:'CP-'+n, cat, area, desc, lat, lng, name:'Citizen', photo:'', created, status, votes, history:hist, reopened:0 };
  };
  return [
    mk(1001,'Pothole','Kuvempunagar','Deep pothole near bus stop, two-wheelers skidding',12.2903,76.6292,9,'InProgress',23),
    mk(1002,'Garbage','Saraswathipuram','Garbage pile not cleared for a week',12.3080,76.6260,1,'Assigned',14),
    mk(1003,'Streetlight','Vijayanagar','3 streetlights off on main road, unsafe at night',12.3330,76.6200,6,'Submitted',9),
    mk(1004,'Water Leak','Jayalakshmipuram','Pipeline leaking water continuously',12.3240,76.6340,4,'Closed',18),
    mk(1005,'Drainage','Gokulam','Blocked drain overflowing during rain',12.3305,76.6380,2,'Resolved',7),
    mk(1006,'Pothole','VV Mohalla','Series of potholes near college gate',12.3195,76.6355,12,'Closed',31),
    mk(1007,'Garbage','Hebbal','Overflowing bin next to park',12.3460,76.6180,5,'Submitted',5),
    mk(1008,'Streetlight','Kuvempunagar','Flickering streetlight in 4th cross',12.2930,76.6330,1,'Submitted',2)
  ];
}

/* ---------- helpers ---------- */
const isOpen = c => c.status !== 'Closed' && c.status !== 'Resolved';
const deadline = c => c.created + (SLA[c.cat]||7)*DAY;
const isEsc = c => isOpen(c) && Date.now() > deadline(c);
const viewStatus = c => isEsc(c) ? 'Escalated' : c.status;
const fmt = t => new Date(t).toLocaleString([], { day:'numeric', month:'short', hour:'2-digit', minute:'2-digit' });
const esc = s => String(s ?? '').replace(/[&<>"']/g, m => ({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[m]));
function dist(a,b,c,d){ const R=6371e3,r=x=>x*Math.PI/180; const x=r(c-a),y=r(d-b); const h=Math.sin(x/2)**2+Math.cos(r(a))*Math.cos(r(c))*Math.sin(y/2)**2; return 2*R*Math.asin(Math.sqrt(h)); }
function toast(m){ const t=$('#toast'); t.textContent=m; t.classList.add('show'); clearTimeout(t._h); t._h=setTimeout(()=>t.classList.remove('show'),3200); }
const colorOf = s => ({Escalated:'#ef4444',Closed:'#22c55e',Resolved:'#0ea5e9',InProgress:'#f59e0b',Assigned:'#6d5dfc'}[s] || '#64748b');
function nextId(){ return 'CP-' + (Math.max(1000, ...data.map(c => +c.id.split('-')[1] || 0)) + 1); }

/* ---------- rendering ---------- */
function card(c, admin=false){
  const s = viewStatus(c);
  const left = Math.ceil((deadline(c)-Date.now())/DAY);
  const sla = isOpen(c) ? (left>=0 ? `⏱ ${left}d left (SLA ${SLA[c.cat]}d)` : `⚠ Overdue by ${-left}d`) : '';
  let acts = `<button class="btn ghost small" data-vote="${c.id}">👍 ${c.votes}</button><button class="btn ghost small" data-track="${c.id}">Timeline</button>`;
  if (admin) {
    const i = FLOW.indexOf(c.status);
    if (i < 3) acts += `<button class="btn primary small" data-adv="${c.id}">→ ${LABEL[FLOW[i+1]]}</button>`;
  }
  return `<div class="card glass">
    ${c.photo ? `<img src="${c.photo}" alt="${esc(c.cat)}">` : ''}
    <div class="top"><b>${c.id}</b><span class="badge b-${s}">${LABEL[s]}</span></div>
    <b>${esc(c.cat)} · ${esc(c.area)}</b>
    <p class="muted">${esc(c.desc)}</p>
    <small class="muted">${fmt(c.created)} ${sla ? '· '+sla : ''}${c.reopened ? ' · reopened '+c.reopened+'×' : ''}</small>
    <div class="acts">${acts}</div></div>`;
}
function renderList(){
  const sorted = [...data].sort((a,b)=>b.created-a.created);
  $('#list').innerHTML = sorted.map(c=>card(c)).join('') || '<p class="empty">No complaints yet.</p>';
  if (sessionStorage.getItem('cp_admin')) renderAdmin();
}
function renderAdmin(){
  $('#login').style.display='none';
  const pr = c => (isEsc(c)?1e6:0) + c.votes;
  const open = data.filter(c=>c.status!=='Closed').sort((a,b)=>pr(b)-pr(a));
  $('#adminList').innerHTML = '<p class="muted" style="grid-column:1/-1">Sorted by priority: escalated first, then most citizen votes. Officers can mark "Resolved" but only the citizen can close it.</p>' + open.map(c=>card(c,true)).join('');
}
function animateCount(el, to){
  const from = +el.textContent || 0, t0 = performance.now();
  const step = t => { const p=Math.min(1,(t-t0)/1200); el.textContent=Math.round(from+(to-from)*(1-(1-p)**3)); if(p<1) requestAnimationFrame(step); };
  requestAnimationFrame(step);
}
function renderStats(){
  animateCount($('#s-total'), data.length);
  animateCount($('#s-res'), data.filter(c=>c.status==='Closed').length);
  animateCount($('#s-esc'), data.filter(isEsc).length);
  animateCount($('#s-votes'), data.reduce((a,c)=>a+c.votes,0));
}
function renderDash(){
  const cats = Object.keys(SLA), max = Math.max(1,...cats.map(k=>data.filter(c=>c.cat===k).length));
  $('#bars').innerHTML = cats.map(k=>{ const n=data.filter(c=>c.cat===k).length; return `<div class="bar"><div><span>${k}</span><b>${n}</b></div><div class="track"><div class="fill" data-w="${n/max*100}"></div></div></div>`; }).join('');
  requestAnimationFrame(()=>document.querySelectorAll('.fill').forEach(f=>f.style.width=f.dataset.w+'%'));
  const groups = [['Closed','#22c55e'],['Resolved','#0ea5e9'],['InProgress','#f59e0b'],['Escalated','#ef4444'],['Pending','#64748b']];
  const count = g => data.filter(c=>{ const s=viewStatus(c); return g==='Pending' ? (s==='Submitted'||s==='Assigned') : s===g; }).length;
  let acc=0; const total=data.length||1;
  const stops = groups.map(([g,col])=>{ const p=count(g)/total*100; const s=`${col} ${acc}% ${acc+p}%`; acc+=p; return s; });
  $('#donut').style.background = `conic-gradient(${stops.join(',')})`;
  $('#donutPct').textContent = Math.round(count('Closed')/total*100)+'%';
  $('#donutLegend').innerHTML = groups.map(([g,col])=>`<div><i style="background:${col}"></i>${LABEL[g]||g}: <b>${count(g)}</b></div>`).join('');
  const wards = {}; data.filter(c=>c.status==='Closed').forEach(c=>wards[c.area]=(wards[c.area]||0)+1);
  $('#top').innerHTML = Object.entries(wards).sort((a,b)=>b[1]-a[1]).slice(0,5).map(([w,n])=>`<li>${esc(w)} — ${n} fixed</li>`).join('') || '<li class="muted">None yet</li>';
  $('#voted').innerHTML = [...data].filter(c=>c.status!=='Closed').sort((a,b)=>b.votes-a.votes).slice(0,5).map(c=>`<li>${esc(c.cat)}, ${esc(c.area)} — 👍 ${c.votes}</li>`).join('');
}
function renderMap(){
  if (!window.L) return;
  layer.clearLayers();
  data.forEach(c=>{
    const s=viewStatus(c);
    L.circleMarker([c.lat,c.lng],{radius:8+Math.min(c.votes,30)/3,color:'#fff',weight:2,fillColor:colorOf(s),fillOpacity:.9})
      .bindPopup(`<b>${c.id} · ${esc(c.cat)}</b><br>${esc(c.desc)}<br><i>${LABEL[s]}</i> · 👍 ${c.votes}`).addTo(layer);
  });
}
function renderAll(){ renderList(); renderStats(); renderDash(); renderMap(); }

/* ---------- tracking ---------- */
function track(id){
  id = id.trim().toUpperCase(); if (/^\d+$/.test(id)) id='CP-'+id;
  const c = data.find(x=>x.id===id);
  if (!c){ $('#tout').innerHTML='<p class="empty">❌ Ticket not found.</p>'; return; }
  const last = {}; c.history.forEach(h=>last[h.s]=h.t);
  const steps = FLOW.map(s=>`<li class="${last[s]?'done':''}"><b>${LABEL[s]}</b><small>${last[s]?fmt(last[s]):'Pending'}</small></li>`).join('');
  const verify = c.status==='Resolved' ? `<div class="dup" style="border-color:#0ea5e9;background:rgba(14,165,233,.1)"><span>The officer marked this as fixed. Is it really fixed?</span><span class="acts"><button class="btn primary small" data-ok="${c.id}">✅ Yes, fixed</button><button class="btn ghost small" data-no="${c.id}">❌ Not fixed</button></span></div>` : '';
  $('#tout').innerHTML = `<div style="margin-top:16px">${card(c)}</div>${verify}<ul class="timeline">${steps}</ul>${isEsc(c)?'<p style="color:#ef4444;font-weight:700">⚠ SLA deadline missed — escalated to senior officer.</p>':''}`;
}

/* ---------- actions ---------- */
async function setStatus(c, s){ c.status=s; c.history.push({s,t:Date.now()}); await saveOne(c); renderAll(); }
document.addEventListener('click', async e=>{
  const b = e.target.closest('button'); if(!b) return;
  const find = id => data.find(c=>c.id===id);
  if (b.dataset.vote){
    let voted=[]; try{ voted=JSON.parse(localStorage.getItem('cp_voted'))||[]; }catch{}
    if (voted.includes(b.dataset.vote)) return toast('You already supported this issue 👍');
    const c=find(b.dataset.vote); c.votes++; voted.push(c.id); try{localStorage.setItem('cp_voted',JSON.stringify(voted));}catch{}
    await saveOne(c); renderAll(); toast(`+1 added to ${c.id}. Priority raised!`);
    if (b.closest('#dups')) { $('#form').reset(); resetForm(); }
  }
  if (b.dataset.track){ $('#tid').value=b.dataset.track; track(b.dataset.track); $('#track').scrollIntoView(); }
  if (b.dataset.adv){ const c=find(b.dataset.adv); await setStatus(c, FLOW[FLOW.indexOf(c.status)+1]); toast(`${c.id} → ${LABEL[c.status]}`); }
  if (b.dataset.ok){ const c=find(b.dataset.ok); await setStatus(c,'Closed'); track(c.id); toast('🎉 Thanks! Complaint verified & closed.'); }
  if (b.dataset.no){ const c=find(b.dataset.no); c.reopened=(c.reopened||0)+1; await setStatus(c,'InProgress'); track(c.id); toast('🔁 Reopened. Officer has been notified.'); }
});

/* ---------- report form ---------- */
function setPin(lat,lng){ chosen={lat,lng}; if(pickPin) pickPin.setLatLng(chosen); else pickPin=L.marker(chosen).addTo(pickMap); pickMap.setView(chosen,16); checkDups(); step(3); }
function step(n){ document.querySelectorAll('.steps span').forEach((s,i)=>s.classList.toggle('on',i<n)); }
function checkDups(){
  const cat=$('#cat').value; if(!chosen||!cat){ $('#dups').innerHTML=''; return; }
  const near=data.filter(c=>c.cat===cat && c.status!=='Closed' && dist(chosen.lat,chosen.lng,c.lat,c.lng)<200);
  $('#dups').innerHTML = near.map(c=>`<div class="dup"><span>⚠ Similar issue already reported nearby: <b>${c.id}</b> – ${esc(c.desc)}</span><button type="button" class="btn primary small" data-vote="${c.id}">👍 Me too</button></div>`).join('');
}
function resetForm(){ chosen=null; photoData=''; $('#preview').classList.remove('show'); $('#dropText').style.display=''; $('#dups').innerHTML=''; if(pickPin){pickMap.removeLayer(pickPin);pickPin=null;} step(1); }
$('#photo').addEventListener('change', e=>{
  const f=e.target.files[0]; if(!f) return;
  const img=new Image(), r=new FileReader();
  r.onload=()=>{ img.onload=()=>{ const cv=document.createElement('canvas'), k=Math.min(1,640/img.width); cv.width=img.width*k; cv.height=img.height*k; cv.getContext('2d').drawImage(img,0,0,cv.width,cv.height); photoData=cv.toDataURL('image/jpeg',.6); $('#preview').src=photoData; $('#preview').classList.add('show'); $('#dropText').style.display='none'; step(2); }; img.src=r.result; };
  r.readAsDataURL(f);
});
$('#cat').addEventListener('change',()=>{ step(Math.max(2, chosen?3:2)); checkDups(); });
$('#gps').addEventListener('click',()=>{
  if(!navigator.geolocation) return toast('Location not supported — tap the map instead.');
  $('#gps').textContent='⏳ Locating…';
  navigator.geolocation.getCurrentPosition(p=>{ setPin(p.coords.latitude,p.coords.longitude); $('#gps').textContent='📍 Location set'; },
    ()=>{ $('#gps').textContent='📍 Use my location'; toast('Could not get location — tap the map to place the pin.'); },{timeout:8000});
});
$('#form').addEventListener('submit', async e=>{
  e.preventDefault();
  if(!chosen && !window.L) chosen={lat:CENTER[0],lng:CENTER[1]}; // map library blocked → fallback
  if(!chosen) return toast('📍 Please set the location (GPS or tap the map).');
  const c={ id:nextId(), cat:$('#cat').value, area:$('#area').value.trim(), desc:$('#desc').value.trim(), name:$('#name').value.trim()||'Citizen',
    lat:chosen.lat, lng:chosen.lng, photo:photoData, created:Date.now(), status:'Submitted', votes:1, history:[{s:'Submitted',t:Date.now()}], reopened:0 };
  data.push(c); await saveOne(c); renderAll();
  $('#form').reset(); resetForm();
  toast(`✅ Submitted! Your Ticket ID: ${c.id}`);
  $('#tid').value=c.id; track(c.id); setTimeout(()=>$('#track').scrollIntoView(),600);
});
$('#tbtn').addEventListener('click',()=>track($('#tid').value));
$('#tid').addEventListener('keydown',e=>{ if(e.key==='Enter') track($('#tid').value); });
$('#lbtn').addEventListener('click',()=>{ if($('#pin').value==='1234'){ sessionStorage.setItem('cp_admin',1); renderAdmin(); toast('Welcome, Officer 👮'); } else toast('Wrong PIN (demo PIN is 1234)'); });
$('#reset').addEventListener('click', async ()=>{ if(!confirm('Reset all demo data?')) return; data=seed(); try{localStorage.removeItem('cp_voted');}catch{} if(db) await Promise.all(data.map(saveOne)); else local.save(); renderAll(); toast('Demo data reset'); });

/* ---------- UI: theme, nav, scroll, i18n ---------- */
const T = {
  kn:{nav_home:'ಮುಖಪುಟ',nav_report:'ದೂರು',nav_track:'ಟ್ರ್ಯಾಕ್',nav_map:'ನಕ್ಷೆ',nav_dash:'ಡ್ಯಾಶ್‌ಬೋರ್ಡ್',nav_admin:'ಅಧಿಕಾರಿ',hero_title:'ದೂರು ನೀಡಿ. ಟ್ರ್ಯಾಕ್ ಮಾಡಿ. <span class="grad">ಸರಿಪಡಿಸಿ.</span>',hero_sub:'ಗುಂಡಿಗಳು, ಕಸ, ಬೀದಿ ದೀಪ, ನೀರಿನ ಸೋರಿಕೆ — 3 ಹಂತಗಳಲ್ಲಿ ದೂರು ನೀಡಿ. ನೀವು ದೃಢೀಕರಿಸಿದಾಗ ಮಾತ್ರ ದೂರು ಮುಚ್ಚಲಾಗುತ್ತದೆ.',btn_report:'📸 ದೂರು ನೀಡಿ',btn_track:'🔎 ಟಿಕೆಟ್ ಟ್ರ್ಯಾಕ್',st_total:'ಒಟ್ಟು ದೂರುಗಳು',st_res:'ಸರಿಪಡಿಸಲಾಗಿದೆ',st_esc:'ಏರಿಸಲಾಗಿದೆ',st_votes:'ನಾಗರಿಕ +1',why_title:'ನಮ್ಮ ಪರಿಹಾರ',rep_title:'ಸಮಸ್ಯೆ ವರದಿ ಮಾಡಿ',trk_title:'ನಿಮ್ಮ ಟಿಕೆಟ್ ಟ್ರ್ಯಾಕ್ ಮಾಡಿ',map_title:'ಲೈವ್ ನಕ್ಷೆ',dash_title:'ಸಾರ್ವಜನಿಕ ಡ್ಯಾಶ್‌ಬೋರ್ಡ್',adm_title:'ಅಧಿಕಾರಿ ಪ್ಯಾನಲ್'},
  hi:{nav_home:'होम',nav_report:'शिकायत',nav_track:'ट्रैक',nav_map:'नक्शा',nav_dash:'डैशबोर्ड',nav_admin:'अधिकारी',hero_title:'शिकायत करें। ट्रैक करें। <span class="grad">ठीक करवाएं।</span>',hero_sub:'गड्ढे, कचरा, स्ट्रीटलाइट, पानी का रिसाव — 3 कदमों में शिकायत करें। शिकायत तभी बंद होगी जब आप पुष्टि करेंगे।',btn_report:'📸 शिकायत करें',btn_track:'🔎 टिकट ट्रैक करें',st_total:'कुल शिकायतें',st_res:'सत्यापित ठीक',st_esc:'एस्केलेटेड',st_votes:'नागरिक +1',why_title:'हमारा समाधान',rep_title:'समस्या दर्ज करें',trk_title:'अपना टिकट ट्रैक करें',map_title:'लाइव नक्शा',dash_title:'सार्वजनिक डैशबोर्ड',adm_title:'अधिकारी पैनल'}
};
const EN = {}; document.querySelectorAll('[data-i18n]').forEach(el=>EN[el.dataset.i18n]=el.innerHTML); T.en=EN;
function setLang(l){ document.querySelectorAll('[data-i18n]').forEach(el=>{ const v=T[l]?.[el.dataset.i18n]; if(v) el.innerHTML=v; }); document.documentElement.lang=l; try{localStorage.setItem('cp_lang',l);}catch{} }
$('#lang').addEventListener('change',e=>setLang(e.target.value));
$('#theme').addEventListener('click',()=>{ const l=document.body.classList.toggle('light'); $('#theme').textContent=l?'☀️':'🌙'; try{localStorage.setItem('cp_theme',l?'light':'dark');}catch{} });
$('#burger').addEventListener('click',()=>$('#links').classList.toggle('open'));
document.querySelectorAll('.links a').forEach(a=>a.addEventListener('click',()=>$('#links').classList.remove('open')));
addEventListener('scroll',()=>{ const h=document.documentElement; $('#progress').style.width=(h.scrollTop/(h.scrollHeight-h.clientHeight)*100)+'%'; $('#nav').classList.toggle('scrolled',h.scrollTop>30); },{passive:true});
const io=new IntersectionObserver(es=>es.forEach(e=>{ if(e.isIntersecting){ e.target.classList.add('in'); io.unobserve(e.target);} }),{threshold:.12});
document.querySelectorAll('.reveal').forEach(el=>io.observe(el));

/* ---------- boot ---------- */
(async function(){
  try{ if(localStorage.getItem('cp_theme')==='light'){ document.body.classList.add('light'); $('#theme').textContent='☀️'; }
       const l=localStorage.getItem('cp_lang'); if(l){ $('#lang').value=l; setLang(l);} }catch{}
  if (window.L){
    pickMap=L.map('pickmap').setView(CENTER,13);
    L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png',{attribution:'© OpenStreetMap'}).addTo(pickMap);
    pickMap.on('click',e=>setPin(e.latlng.lat,e.latlng.lng));
    bigMap=L.map('bigmap',{scrollWheelZoom:false}).setView(CENTER,13);
    L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png',{attribution:'© OpenStreetMap'}).addTo(bigMap);
    layer=L.layerGroup().addTo(bigMap);
  }
  const cloud = await initCloud();
  if (!cloud){ data = local.load() || seed(); local.save(); }
  $('#mode').textContent = cloud ? '☁️ Connected to Firebase Firestore' : '🧪 Demo mode (browser storage)';
  renderAll();
  setInterval(renderList, 60000); // refresh SLA timers
})();
})();

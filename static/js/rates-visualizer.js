// static/js/rates-visualizer.js — Batch C: extracted from templates/rates_visualizer.html inline <script>. No logic change.

/* ── State ── */
let rt = 'actual', curAx = 'roll';
let ovr = {roll:true,pitch:true,yaw:true};
let ghost = null;

const profiles = {
  roll:  {rr:1.20,sr:0.70,er:0.15,br:1.00,bs:0.70,be:0.00,kr:60,ka:0.02},
  pitch: {rr:1.20,sr:0.70,er:0.15,br:1.00,bs:0.70,be:0.00,kr:60,ka:0.02},
  yaw:   {rr:0.80,sr:0.40,er:0.10,br:0.80,bs:0.40,be:0.00,kr:40,ka:0.01},
};

const COL = {roll:'#00e87a',pitch:'#4a9eff',yaw:'#ff9718'};
const GLW = {roll:'rgba(0,232,122,',pitch:'rgba(74,158,255,',yaw:'rgba(255,151,24,'};

/* ── Rate Math ── */
const clamp = (v, min, max) => Math.min(max, Math.max(min, v));

function expoBlend(x, expo){
  const t = clamp(x, 0, 1);
  const e = clamp(expo, 0, 1);
  const smooth = t * t * (3 - 2 * t);
  return e * smooth + (1 - e) * t;
}

function getAxisConfig(ax){ return profiles[ax] || profiles.roll; }

function actualCenterDeg(cfg){ return cfg.rr * 100; }
function actualMaxDeg(cfg){ return clamp(actualCenterDeg(cfg) * (1 + cfg.sr * 7.0), actualCenterDeg(cfg), 1998); }

function legacyCenterDeg(cfg){ return cfg.br * 100; }
function legacyMaxDeg(cfg){
  return clamp(legacyCenterDeg(cfg) * (1 + cfg.bs * 7.6 + cfg.br * 0.15), legacyCenterDeg(cfg), 1998);
}

function kissCenterDeg(cfg){ return cfg.kr; }
function kissMaxDeg(cfg){ return clamp(cfg.kr + cfg.ka * 2200, cfg.kr, 1998); }

function actualRateAt(s, cfg){
  const x = clamp(Math.abs(s), 0, 1);
  const center = actualCenterDeg(cfg);
  const max = actualMaxDeg(cfg);
  const shaped = expoBlend(x, cfg.er);
  const rate = center * x + (max - center) * Math.pow(shaped, 1.65);
  return Math.min(max, rate) * Math.sign(s || 1);
}

function legacyRateAt(s, cfg){
  const x = clamp(Math.abs(s), 0, 1);
  const center = legacyCenterDeg(cfg);
  const max = legacyMaxDeg(cfg);
  const shaped = expoBlend(x, cfg.be);
  const rate = center * x + (max - center) * Math.pow(shaped, 1.55);
  return Math.min(max, rate) * Math.sign(s || 1);
}

function kissRateAt(s, cfg){
  const x = clamp(Math.abs(s), 0, 1);
  const center = kissCenterDeg(cfg);
  const max = kissMaxDeg(cfg);
  const shaped = expoBlend(x, clamp(cfg.ka * 2.4, 0, 1));
  const rate = center * x + (max - center) * Math.pow(shaped, 1.45);
  return Math.min(max, rate) * Math.sign(s || 1);
}

function actRate(s, rr, sr, er){ return actualRateAt(s, { rr, sr, er }); }
function bfRate(s, br, bs, be){ return legacyRateAt(s, { br, bs, be }); }
function ksRate(s, kr, ka){ return kissRateAt(s, { kr, ka }); }

function getAxisRate(ax,s){
  const cfg = getAxisConfig(ax);
  if(rt==='actual') return actualRateAt(s,cfg);
  if(rt==='bf')     return legacyRateAt(s,cfg);
  return kissRateAt(s,cfg);
}
function getRate(s){return getAxisRate(curAx,s);}

function getAxisSnapshot(ax){
  const cfg = getAxisConfig(ax);
  const mode = rt;
  const centerDeg = mode==='actual' ? actualCenterDeg(cfg) : mode==='bf' ? legacyCenterDeg(cfg) : kissCenterDeg(cfg);
  const maxDeg = mode==='actual' ? actualMaxDeg(cfg) : mode==='bf' ? legacyMaxDeg(cfg) : kissMaxDeg(cfg);
  const mid = getAxisRate(ax, 0.5);
  const q1 = getAxisRate(ax, 0.25);
  const q3 = getAxisRate(ax, 0.75);
  const expoVal = mode==='kiss' ? cfg.ka : mode==='actual' ? cfg.er : cfg.be;
  return {cfg, centerDeg, maxDeg, mid, q1, q3, expoVal};
}

function classifyRate(snapshot){
  const { maxDeg, expoVal } = snapshot;
  let style = 'Balanced';
  if(maxDeg < 330) style = 'Cinematic';
  else if(maxDeg < 480) style = 'Smooth';
  else if(maxDeg < 720) style = 'Balanced';
  else if(maxDeg < 980) style = 'Freestyle';
  else style = 'Race';

  let curve = 'Comfort';
  if(expoVal <= 0.08) curve = 'Direct';
  else if(expoVal <= 0.22) curve = 'Comfort';
  else if(expoVal <= 0.38) curve = 'Soft center';
  else curve = 'Very soft';

  const target = style==='Cinematic' ? 280 : style==='Smooth' ? 420 : style==='Balanced' ? 600 : style==='Freestyle' ? 840 : 1100;
  const expoTarget = style==='Cinematic' ? 0.34 : style==='Smooth' ? 0.24 : style==='Balanced' ? 0.18 : style==='Freestyle' ? 0.12 : 0.06;
  const shapeScore = clamp(100 - Math.abs(maxDeg - target) / 12 - Math.abs(expoVal - expoTarget) * 70, 58, 99);
  let advice = 'ค่าโดยรวมสมดุล';
  if(maxDeg < target - 90) advice = 'เพิ่ม Super Rate ทีละ 0.05 เพื่อให้ปลาย stick มาไวขึ้น';
  else if(maxDeg > target + 120) advice = 'ลด Super Rate ทีละ 0.05 ถ้ารู้สึกว่าปลาย stick แรงเกินไป';
  else if(expoVal > 0.32) advice = 'Expo ค่อนข้างสูง ลองลดทีละ 0.05 ถ้าอยากได้คมขึ้น';
  else if(expoVal < 0.08) advice = 'Curve ค่อนข้างตรง เหมาะ race หรือผู้บินที่คุมละเอียด';
  return {style, curve, advice, score:Math.round(shapeScore)};
}

/* ── setAxis ── */
function setAxis(ax){
  saveSl(); curAx=ax; loadSl(ax);
  document.querySelectorAll('.atab').forEach(t=>{
    const active=t.dataset.a===ax;
    t.classList.toggle('on',active);
    t.setAttribute('aria-pressed', active ? 'true' : 'false');
  });
  const c=ax==='roll'?'rr':ax==='pitch'?'pr':'yr';
  document.querySelectorAll('input[type=range]').forEach(i=>{i.className=i.className.replace(/\b(rr|pr|yr)\b/,c);});
  document.querySelectorAll('.cval').forEach(v=>{v.className=v.className.replace(/\b(roll|pitch|yaw)\b/,ax);});
  document.querySelectorAll('.snum').forEach(v=>{v.className=v.className.replace(/\b(roll|pitch|yaw)\b/,ax);});
  update();
}

function setRT(t){
  rt=t;
  document.querySelectorAll('.rtab').forEach((el,i)=>{
    const active=['actual','bf','kiss'][i]===t;
    el.classList.toggle('on',active);
    el.setAttribute('aria-pressed', active ? 'true' : 'false');
  });
  document.getElementById('ca').style.display=t==='actual'?'':'none';
  document.getElementById('cb').style.display=t==='bf'?'':'none';
  document.getElementById('ck').style.display=t==='kiss'?'':'none';
  update();
}

function saveSl(){
  const p=profiles[curAx];
  const g=id=>parseFloat(document.getElementById(id).value);
  p.rr=g('rr');p.sr=g('sr');p.er=g('er');
  p.br=g('bfr');p.bs=g('bfs');p.be=g('bfe');
  p.kr=g('kr');p.ka=g('ka');
}
function loadSl(ax){
  const p=profiles[ax];
  const s=(id,v)=>{const el=document.getElementById(id);if(el)el.value=v;};
  s('rr',p.rr);s('sr',p.sr);s('er',p.er);
  s('bfr',p.br);s('bfs',p.bs);s('bfe',p.be);
  s('kr',p.kr);s('ka',p.ka);
}

function update(){
  saveSl();
  if(document.getElementById('lnk').checked){
    const r=profiles.roll;
    Object.assign(profiles.pitch,{rr:r.rr,sr:r.sr,er:r.er,br:r.br,bs:r.bs,be:r.be,kr:r.kr,ka:r.ka});
  }
  updateLabels();
  updateStats();
  updateIntelligence();
  updateCLI();
  draw();
}

function updateLabels(){
  const p=profiles[curAx];
  const f=(id,v,dp=2)=>{const el=document.getElementById(id);if(el)el.textContent=Number(v).toFixed(dp);};
  f('vr',p.rr);f('vs',p.sr);f('ve',p.er);
  f('vbr',p.br);f('vbs',p.bs);f('vbe',p.be);
  f('vkr',p.kr,0);f('vka',p.ka);
}

function updateStats(){
  const s=(id,v)=>{const el=document.getElementById(id);if(el)el.textContent=v;};
  s('smax',Math.round(getRate(1.0)));
  s('shalf',Math.round(getRate(0.5)));
  s('sctr',Math.round(getRate(0.08)));
}

function updateIntelligence(){
  const snap = getAxisSnapshot(curAx);
  const info = classifyRate(snap);
  const center = Math.round(snap.centerDeg);
  const max = Math.round(snap.maxDeg);
  const mid = Math.round(snap.mid);
  const q1 = Math.round(snap.q1);
  const q3 = Math.round(snap.q3);
  const needlePct = clamp((snap.maxDeg / 1200) * 100, 0, 100);
  document.getElementById('pneedle').style.left = needlePct + '%';
  document.getElementById('plabel').textContent = info.style;
  document.getElementById('intelScore').textContent = info.score + '%';
  document.getElementById('intelStyle').textContent = info.style;
  document.getElementById('intelShape').textContent = info.curve;
  document.getElementById('intelCenter').textContent = center + ' deg/s';
  document.getElementById('intelMax').textContent = max + ' deg/s';
  document.getElementById('intelDesc').innerHTML = `<strong>${curAx.toUpperCase()}</strong> · 25% ${q1} · 50% ${mid} · 75% ${q3}<br><span class="intel-pick">${info.advice}</span>`;
}

function updateCLI(){
  saveSl();
  const uiToCliCenter = v => String(Math.round(parseFloat(v) * 10));
  const uiToCliPercent = v => String(Math.round(parseFloat(v) * 100));
  const uiToCliInt = v => String(Math.round(parseFloat(v)));
  let lines=[];
  const snap = getAxisSnapshot(curAx);
  lines.push(`# OBIXConfig — ${rt.toUpperCase()} Rates`);
  lines.push(`# ${curAx.toUpperCase()} · center ${Math.round(snap.centerDeg)} deg/s · max ${Math.round(snap.maxDeg)} deg/s`);
  lines.push('');

  if(rt==='actual' || rt==='bf'){
    lines.push(`set rates_type = ${rt==='actual' ? 'ACTUAL' : 'BETAFLIGHT'}`);
    lines.push('');
    for(const ax of ['roll','pitch','yaw']){
      const p=profiles[ax];
      lines.push(`# ${ax.toUpperCase()}`);
      lines.push(`set ${ax}_rc_rate    = ${uiToCliCenter(rt==='actual' ? p.rr : p.br)}`);
      lines.push(`set ${ax}_super_rate = ${uiToCliPercent(rt==='actual' ? p.sr : p.bs)}`);
      lines.push(`set ${ax}_expo       = ${uiToCliPercent(rt==='actual' ? p.er : p.be)}`);
      lines.push('');
    }
  }else{
    lines.push('set rates_type = KISS');
    lines.push('');
    for(const ax of ['roll','pitch','yaw']){
      const p=profiles[ax];
      lines.push(`# ${ax.toUpperCase()}`);
      lines.push(`set ${ax}_rc_rate    = ${uiToCliInt(p.kr)}`);
      lines.push(`set ${ax}_super_rate = ${uiToCliPercent(p.ka)}`);
      lines.push('');
    }
  }
  lines.push('save');
  document.getElementById('cliout').textContent=lines.join('\n');
}

function copyCLI(){
  navigator.clipboard.writeText(document.getElementById('cliout').textContent)
    .then(()=>toast('✓ คัดลอก CLI แล้ว'));
}

/* ── Import ── */
function parseCLI(){
  const raw=document.getElementById('impta').value;
  if(!raw.trim()){toast('⚠️ ยังไม่ได้วาง CLI');return;}
  const g=k=>{
    const m=raw.match(new RegExp('set\\s+'+k+'\\s*=\\s*([\\d.]+)','i'));
    return m?parseFloat(m[1]):null;
  };
  const tm=raw.match(/set\s+rates_type\s*=\s*(\w+)/i);
  if(tm){
    const t=tm[1].toLowerCase();
    if(t.includes('act')) setRT('actual');
    else if(t.includes('kiss')) setRT('kiss');
    else setRT('bf');
  }
  for(const ax of['roll','pitch','yaw']){
    const p=profiles[ax];
    const rc=g(`${ax}_rc_rate`), sr=g(`${ax}_super_rate`) ?? g(`${ax}_srate`), ex=g(`${ax}_expo`);
    if(rc!==null){
      if(rt==='actual'){
        p.rr=rc/10; p.sr=(sr||0)/100; p.er=(ex||0)/100;
      }else if(rt==='bf'){
        p.br=rc/10; p.bs=(sr||0)/100; p.be=(ex||0)/100;
      }else{
        p.kr=rc; p.ka=(sr||0)/100;
      }
    }
  }
  loadSl(curAx);
  update();
  document.getElementById('impta').value='';
  toast('✅ โหลด Rates สำเร็จ');
}

/* ── Presets ── */
const PRESETS={
  beginner: {rr:0.80,sr:0.40,er:0.10},
  freestyle:{rr:1.20,sr:0.70,er:0.15},
  race:     {rr:1.80,sr:0.80,er:0.00},
  smooth:   {rr:0.70,sr:0.20,er:0.35},
  longrange:{rr:1.00,sr:0.45,er:0.20},
  locked:   {rr:1.50,sr:0.72,er:0.00},
};
function applyPreset(n){
  const pr=PRESETS[n];if(!pr)return;
  for(const ax of['roll','pitch']){
    Object.assign(profiles[ax],{rr:pr.rr,sr:pr.sr,er:pr.er,br:pr.rr,bs:pr.sr,be:pr.er});
  }
  profiles.yaw.rr=parseFloat((pr.rr*0.65).toFixed(2));
  profiles.yaw.sr=parseFloat((pr.sr*0.55).toFixed(2));
  profiles.yaw.er=pr.er;
  profiles.yaw.br=profiles.yaw.rr;profiles.yaw.bs=profiles.yaw.sr;
  loadSl(curAx);update();
  toast('✅ Preset: '+n);
}

/* ── Ghost ── */
function saveGhost(){
  ghost=JSON.parse(JSON.stringify(profiles));
  document.getElementById('gleg').style.display='flex';
  toast('👻 บันทึก Ghost curve');
  draw();
}

/* ── Overlay ── */
function togOvr(ax){
  ovr[ax]=!ovr[ax];
  const b=document.querySelector(`.obtn[data-a="${ax}"]`);
  if(b){
    b.classList.toggle('on',ovr[ax]);
    b.setAttribute('aria-pressed', ovr[ax] ? 'true' : 'false');
  }
  draw();
}

/* ── Draw ── */
function draw(){
  const cv=document.getElementById('rv');if(!cv)return;
  const rc=cv.getBoundingClientRect();
  const W=Math.max(Math.round(rc.width),300);
  const H=Math.round(W*0.64);
  cv.width=W;cv.height=H;
  const ctx=cv.getContext('2d');
  const PL=50,PR=16,PT=16,PB=42;
  const gW=W-PL-PR,gH=H-PT-PB;

  ctx.fillStyle='#03050a';ctx.fillRect(0,0,W,H);

  let maxR=100;
  for(const ax of['roll','pitch','yaw'])if(ovr[ax])maxR=Math.max(maxR,getAxisRate(ax,1));
  if(ghost)for(const ax of['roll','pitch','yaw']){
    const p=ghost[ax];let r;
    if(rt==='actual')r=actRate(1,p.rr,p.sr,p.er);
    else if(rt==='bf')r=bfRate(1,p.br,p.bs,p.be);
    else r=ksRate(1,p.kr,p.ka);
    maxR=Math.max(maxR,r);
  }
  maxR=Math.ceil(maxR/100)*100;

  const tx=s=>PL+gW*s;
  const ty=r=>H-PB-gH*Math.min(r,maxR)/maxR;

  // Grid
  ctx.strokeStyle='rgba(255,255,255,0.032)';ctx.lineWidth=1;
  for(let i=1;i<=10;i++){ctx.beginPath();ctx.moveTo(tx(i/10),PT);ctx.lineTo(tx(i/10),H-PB);ctx.stroke();}
  for(let i=1;i<=10;i++){ctx.beginPath();ctx.moveTo(PL,ty(maxR*i/10));ctx.lineTo(W-PR,ty(maxR*i/10));ctx.stroke();}

  // Axes
  ctx.strokeStyle='rgba(255,255,255,0.08)';ctx.lineWidth=1.5;
  ctx.beginPath();ctx.moveTo(PL,PT);ctx.lineTo(PL,H-PB);ctx.moveTo(PL,H-PB);ctx.lineTo(W-PR,H-PB);ctx.stroke();

  // Labels
  ctx.fillStyle='rgba(255,255,255,0.28)';ctx.font="10px 'Space Mono',monospace";
  ctx.textAlign='right';
  for(let i=0;i<=4;i++){const r=maxR*i/4;ctx.fillText(Math.round(r),PL-6,ty(r)+4);}
  ctx.textAlign='center';
  for(let i=0;i<=5;i++)ctx.fillText(i*20+'%',tx(i/5),H-PB+14);
  ctx.save();ctx.translate(12,H/2);ctx.rotate(-Math.PI/2);
  ctx.fillStyle='rgba(255,255,255,0.18)';ctx.font="10px 'Rajdhani',sans-serif";
  ctx.fillText('deg/s',0,0);ctx.restore();

  // Ghost
  if(ghost){
    for(const ax of['roll','pitch','yaw']){
      if(!ovr[ax])continue;
      const p=ghost[ax];
      ctx.globalAlpha=0.2;ctx.strokeStyle=COL[ax];ctx.lineWidth=1.5;ctx.setLineDash([4,5]);
      ctx.beginPath();
      for(let i=0;i<=200;i++){
        const s=i/200;let r;
        if(rt==='actual')r=actRate(s,p.rr,p.sr,p.er);
        else if(rt==='bf')r=bfRate(s,p.br,p.bs,p.be);
        else r=ksRate(s,p.kr,p.ka);
        i===0?ctx.moveTo(tx(s),ty(r)):ctx.lineTo(tx(s),ty(r));
      }
      ctx.stroke();ctx.setLineDash([]);ctx.globalAlpha=1;
    }
  }

  // Linear ref
  ctx.strokeStyle='rgba(100,120,160,0.35)';ctx.lineWidth=1;ctx.setLineDash([5,5]);
  ctx.beginPath();ctx.moveTo(tx(0),ty(0));ctx.lineTo(tx(1),ty(getAxisRate(curAx,1)));ctx.stroke();
  ctx.setLineDash([]);

  // Curves
  for(const ax of['roll','pitch','yaw']){
    if(!ovr[ax])continue;
    const col=COL[ax],gl=GLW[ax];
    const isCur=ax===curAx;
    const alpha=isCur?1:0.45;
    const lw=isCur?2.5:1.5;
    const pts=[];
    for(let i=0;i<=280;i++){const s=i/280;pts.push({x:tx(s),y:ty(getAxisRate(ax,s))});}

    if(isCur){
      const grad=ctx.createLinearGradient(0,PT,0,H-PB);
      grad.addColorStop(0,gl+'0.22)');grad.addColorStop(1,gl+'0.0)');
      ctx.globalAlpha=1;ctx.fillStyle=grad;
      ctx.beginPath();ctx.moveTo(tx(0),H-PB);
      pts.forEach(p=>ctx.lineTo(p.x,p.y));
      ctx.lineTo(tx(1),H-PB);ctx.closePath();ctx.fill();
    }

    ctx.save();ctx.globalAlpha=alpha*0.35;ctx.shadowColor=col;ctx.shadowBlur=14;
    ctx.strokeStyle=col;ctx.lineWidth=lw+3;
    ctx.beginPath();pts.forEach((p,i)=>i===0?ctx.moveTo(p.x,p.y):ctx.lineTo(p.x,p.y));ctx.stroke();
    ctx.restore();

    ctx.save();ctx.globalAlpha=alpha;ctx.strokeStyle=col;ctx.lineWidth=lw;ctx.shadowColor=col;ctx.shadowBlur=5;
    ctx.beginPath();pts.forEach((p,i)=>i===0?ctx.moveTo(p.x,p.y):ctx.lineTo(p.x,p.y));ctx.stroke();
    ctx.restore();

    if(isCur){
      for(const pct of[0.25,0.5,0.75]){
        const r=getAxisRate(ax,pct);
        const mx=tx(pct),my=ty(r);
        ctx.strokeStyle='rgba(255,255,255,0.08)';ctx.lineWidth=1;ctx.setLineDash([2,3]);
        ctx.beginPath();ctx.moveTo(mx,H-PB);ctx.lineTo(mx,my);ctx.stroke();
        ctx.beginPath();ctx.moveTo(PL,my);ctx.lineTo(mx,my);ctx.stroke();
        ctx.setLineDash([]);
        ctx.fillStyle='#fff';ctx.shadowColor=col;ctx.shadowBlur=8;
        ctx.beginPath();ctx.arc(mx,my,3.5,0,Math.PI*2);ctx.fill();
        ctx.shadowBlur=0;
        ctx.fillStyle=col;ctx.font="bold 10px 'Space Mono',monospace";ctx.textAlign='center';
        ctx.fillText(Math.round(r),mx,my-10);
      }
    }
  }
}

/* ── Hover tooltip ── */
const CV=document.getElementById('rv');
const TIP=document.getElementById('tip');
CV.addEventListener('mousemove',e=>{
  const rc=CV.getBoundingClientRect();
  const W=CV.width,PL=50;
  const raw=(e.clientX-rc.left)*(W/rc.width);
  const s=Math.max(0,Math.min(1,(raw-PL)/(W-PL-16)));
  document.getElementById('tts').textContent=`Stick: ${Math.round(s*100)}% · ${curAx.toUpperCase()}`;
  document.getElementById('ttv').textContent=`${Math.round(getRate(s))} deg/s`;
  document.getElementById('ttv').style.color=COL[curAx];
  TIP.style.display='block';
  let lx=e.clientX-rc.left+14,ly=e.clientY-rc.top-44;
  if(lx+170>rc.width)lx-=185;
  TIP.style.left=lx+'px';TIP.style.top=ly+'px';
});
CV.addEventListener('mouseleave',()=>{TIP.style.display='none';});

/* ── Guide accordion ── */
function tog(id){
  const el=document.getElementById('g-'+id);
  if(!el) return;
  el.classList.toggle('open');
  const expanded=el.classList.contains('open');
  const head=el.querySelector('.gch');
  if(head) head.setAttribute('aria-expanded', expanded ? 'true' : 'false');
}

/* ── Toast ── */
function toast(msg){
  const t=document.getElementById('toast');
  t.textContent=msg;t.classList.add('show');
  clearTimeout(t._t);t._t=setTimeout(()=>t.classList.remove('show'),2000);
}

/* ── Resize ── */
let rz;window.addEventListener('resize',()=>{clearTimeout(rz);rz=setTimeout(draw,80);});

/* ── Init ── */
window.addEventListener('load',()=>{
  setTimeout(()=>{ loadSl('roll'); update(); },60);
});

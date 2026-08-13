// static/js/build-card.js — Batch E: extracted from templates/build_card.html inline <script>. No logic change. The one Jinja-rendered line (BASE_URL display text) now reads from a small inline const BC_BASE_URL_DISPLAY (still server-rendered) instead of inline Jinja — same output. Also collapsed a pre-existing duplicate <script> tag bug (only one closing tag existed).

'use strict';
// ── State ─────────────────────────────────────────
let theme = 'cyber';
let style = 'FREESTYLE';
const THEMES = {
  cyber:    {bg1:'#020509',bg2:'#081428',bg3:'#040b14',accent:'#00ff88',accent2:'#00aaff',grid:'rgba(0,255,136,0.04)'},
  midnight: {bg1:'#0a0010',bg2:'#1a0030',bg3:'#0f0020',accent:'#c040ff',accent2:'#ff40aa',grid:'rgba(192,64,255,0.04)'},
  carbon:   {bg1:'#080808',bg2:'#181818',bg3:'#0f0f0f',accent:'#ff6b00',accent2:'#ffcc00',grid:'rgba(255,107,0,0.04)'},
  ocean:    {bg1:'#010d1a',bg2:'#001830',bg3:'#000f20',accent:'#00ccff',accent2:'#0080ff',grid:'rgba(0,204,255,0.04)'},
};

// ── Inputs ────────────────────────────────────────
function g(id){ return document.getElementById(id)?.value?.trim() || ''; }
function gn(id){ const v=parseInt(document.getElementById(id)?.value); return isNaN(v)?null:v; }

// ── Draw ─────────────────────────────────────────
function drawCard(){
  const cv = document.getElementById('cardCanvas');
  const ctx = cv.getContext('2d');
  const W=1200, H=628;
  const T = THEMES[theme];

  // ── Background ───────────────────────────────
  const bg = ctx.createLinearGradient(0,0,W,H);
  bg.addColorStop(0,T.bg1); bg.addColorStop(0.5,T.bg2); bg.addColorStop(1,T.bg3);
  ctx.fillStyle = bg; ctx.fillRect(0,0,W,H);

  // Grid pattern
  ctx.strokeStyle = T.grid; ctx.lineWidth = 1;
  for(let x=0;x<W;x+=40){ctx.beginPath();ctx.moveTo(x,0);ctx.lineTo(x,H);ctx.stroke();}
  for(let y=0;y<H;y+=40){ctx.beginPath();ctx.moveTo(0,y);ctx.lineTo(W,y);ctx.stroke();}

  // Radial glow top-left
  const gl1=ctx.createRadialGradient(0,0,0,0,0,500);
  gl1.addColorStop(0,T.accent+'18'); gl1.addColorStop(1,'transparent');
  ctx.fillStyle=gl1; ctx.fillRect(0,0,W,H);

  // Radial glow bottom-right
  const gl2=ctx.createRadialGradient(W,H,0,W,H,400);
  gl2.addColorStop(0,T.accent2+'12'); gl2.addColorStop(1,'transparent');
  ctx.fillStyle=gl2; ctx.fillRect(0,0,W,H);

  // ── Diagonal accent band ─────────────────────
  ctx.save();
  ctx.globalAlpha=0.06;
  ctx.fillStyle=T.accent;
  ctx.beginPath();ctx.moveTo(720,0);ctx.lineTo(W+100,0);ctx.lineTo(W+100,H);ctx.lineTo(620,H);ctx.closePath();
  ctx.fill();
  ctx.globalAlpha=1;
  ctx.restore();

  // ── Scan lines ───────────────────────────────
  for(let y=0;y<H;y+=4){
    ctx.fillStyle='rgba(0,0,0,0.06)'; ctx.fillRect(0,y,W,1);
  }

  // ── Left accent bar ───────────────────────────
  const barGrad=ctx.createLinearGradient(0,0,0,H);
  barGrad.addColorStop(0,T.accent); barGrad.addColorStop(0.5,T.accent2); barGrad.addColorStop(1,'transparent');
  ctx.fillStyle=barGrad; ctx.fillRect(0,0,4,H);

  // ── Top bar ───────────────────────────────────
  ctx.fillStyle='rgba(0,0,0,0.4)'; ctx.fillRect(0,0,W,56);
  // Logo text
  ctx.font='bold 14px Orbitron,monospace';
  ctx.fillStyle=T.accent; ctx.letterSpacing='3px';
  ctx.fillText('OBIXCONFIG DOCTOR',28,36);
  // URL
  ctx.font='11px JetBrains Mono,monospace';
  ctx.fillStyle='rgba(200,216,232,0.4)'; ctx.letterSpacing='0px';
  ctx.fillText(BC_BASE_URL_DISPLAY,28,52);
  // Date
  const dt=new Date();
  const ds=`${dt.getDate().toString().padStart(2,'0')}/${(dt.getMonth()+1).toString().padStart(2,'0')}/${dt.getFullYear()+543}`;
  ctx.textAlign='right';
  ctx.font='11px JetBrains Mono,monospace';
  ctx.fillStyle='rgba(200,216,232,0.35)';
  ctx.fillText(ds, W-28, 36);
  ctx.textAlign='left';

  // ── Style badge ───────────────────────────────
  const styleColors={FREESTYLE:T.accent,RACING:'#ff4455',CINEMATIC:'#00aaff','LONG RANGE':'#ffb700',MICRO:'#cc88ff'};
  const sclr=styleColors[style]||T.accent;
  ctx.save();
  ctx.font='bold 11px Orbitron,monospace';
  const sw=ctx.measureText(style).width+24;
  ctx.fillStyle=sclr+'22';
  roundRect(ctx,W-sw-28,16,sw,24,4); ctx.fill();
  ctx.strokeStyle=sclr+'66'; ctx.lineWidth=1;
  roundRect(ctx,W-sw-28,16,sw,24,4); ctx.stroke();
  ctx.fillStyle=sclr;
  ctx.fillText(style,W-sw-28+12,33);
  ctx.restore();

  // ── Build name ────────────────────────────────
  const name = g('f_name') || 'MY FPV BUILD';
  ctx.font='bold 52px Orbitron,monospace';
  ctx.fillStyle='#ffffff';
  ctx.letterSpacing = '-1px';
  // fit text
  let fontSize=52;
  while(ctx.measureText(name).width > 680 && fontSize>24){
    fontSize-=2; ctx.font=`bold ${fontSize}px Orbitron,monospace`;
  }
  ctx.fillText(name, 28, 132);
  ctx.letterSpacing='0px';

  // Pilot name
  const pilot=g('f_pilot')||'';
  if(pilot){
    ctx.font='16px JetBrains Mono,monospace';
    ctx.fillStyle=T.accent+'cc';
    ctx.fillText('▸ '+pilot, 32, 162);
  }

  // ── Divider ────────────────────────────────────
  const divY=pilot?182:168;
  ctx.strokeStyle=T.accent+'30'; ctx.lineWidth=1;
  ctx.beginPath(); ctx.moveTo(28,divY); ctx.lineTo(680,divY); ctx.stroke();

  // ── Left column: Main specs ────────────────────
  const specs=[
    ['FRAME',       g('f_size')||'—'],
    ['WEIGHT',      g('f_weight') ? g('f_weight')+' g' : '—'],
    ['BATTERY',     g('f_batt')||'—'],
    ['MOTOR',       g('f_kv')||'—'],
    ['FC',          g('f_fc')||'—'],
    ['ESC',         g('f_esc')||'—'],
    ['CAMERA',      g('f_cam')||'—'],
    ['VTX / LINK',  g('f_vtx')||'—'],
  ];
  const startY=divY+24;
  specs.forEach(([lbl,val],i)=>{
    const y=startY + i*42;
    if(y>H-60) return;
    ctx.font='9px Orbitron,monospace'; ctx.fillStyle=T.accent2+'99';
    ctx.fillText(lbl, 32, y);
    ctx.font='bold 15px JetBrains Mono,monospace'; ctx.fillStyle='#c8d8e8';
    ctx.fillText(val, 32, y+18);
  });

  // ── Right panel: PID display ───────────────────
  const panX=720, panW=456, panH=320, panY=72;
  ctx.fillStyle='rgba(0,0,0,0.35)';
  roundRect(ctx,panX,panY,panW,panH,12); ctx.fill();
  ctx.strokeStyle=T.accent+'20'; ctx.lineWidth=1;
  roundRect(ctx,panX,panY,panW,panH,12); ctx.stroke();

  // Panel header
  ctx.font='bold 10px Orbitron,monospace'; ctx.fillStyle=T.accent;
  ctx.fillText('PID CONFIGURATION', panX+20, panY+22);
  ctx.strokeStyle=T.accent+'20'; ctx.lineWidth=1;
  ctx.beginPath(); ctx.moveTo(panX+20,panY+32); ctx.lineTo(panX+panW-20,panY+32); ctx.stroke();

  // PID axes
  const axes=[
    {n:'ROLL',  p:gn('f_rp'), i:gn('f_ri'), d:gn('f_rd'), c:'#00ff88'},
    {n:'PITCH', p:gn('f_pp'), i:gn('f_pi'), d:gn('f_pd'), c:'#00aaff'},
    {n:'YAW',   p:null,       i:null,        d:null,        c:'#ffb700'},
  ];
  axes.forEach((ax,i)=>{
    const ax_x=panX+20+(i*(panW-40)/3);
    const ax_y=panY+52;
    ctx.font='bold 10px Orbitron,monospace'; ctx.fillStyle=ax.c+'cc';
    ctx.fillText(ax.n, ax_x, ax_y);
    // P I D values
    [['P',ax.p],['I',ax.i],['D',ax.d]].forEach(([k,v],j)=>{
      const vy=ax_y+30+j*38;
      ctx.font='9px Orbitron,monospace'; ctx.fillStyle='rgba(200,216,232,0.45)';
      ctx.fillText(k, ax_x, vy);
      ctx.font=`bold 28px Orbitron,monospace`;
      ctx.fillStyle=v!=null ? ax.c : 'rgba(200,216,232,0.2)';
      ctx.fillText(v!=null?v.toString():'??', ax_x, vy+26);
    });
  });

  // ── Stats bar at bottom of right panel ─────────
  const statY=panY+panH+20;
  const stats2=[
    ['BF VERSION', '4.4/4.5'],
    ['PROTOCOL', 'DSHOT600'],
    ['RPM FILTER', 'ON'],
  ];
  stats2.forEach(([lbl,val],i)=>{
    const sx=panX+20+i*(panW-40)/3;
    ctx.font='9px Orbitron,monospace'; ctx.fillStyle='rgba(200,216,232,0.4)';
    ctx.fillText(lbl, sx, statY);
    ctx.font='bold 13px JetBrains Mono,monospace'; ctx.fillStyle=T.accent+'cc';
    ctx.fillText(val, sx, statY+18);
  });

  // ── Tagline ────────────────────────────────────
  const tag=g('f_tag');
  if(tag){
    ctx.font='italic 18px Sarabun,sans-serif'; ctx.fillStyle='rgba(200,216,232,0.5)';
    ctx.fillText('"'+tag+'"', 28, H-30);
  }

  // ── Bottom border ──────────────────────────────
  const bot=ctx.createLinearGradient(0,0,W,0);
  bot.addColorStop(0,T.accent); bot.addColorStop(0.5,T.accent2); bot.addColorStop(1,'transparent');
  ctx.strokeStyle=bot; ctx.lineWidth=2;
  ctx.beginPath(); ctx.moveTo(0,H-2); ctx.lineTo(W,H-2); ctx.stroke();
}

function roundRect(ctx,x,y,w,h,r){
  ctx.beginPath();
  ctx.moveTo(x+r,y);ctx.lineTo(x+w-r,y);ctx.quadraticCurveTo(x+w,y,x+w,y+r);
  ctx.lineTo(x+w,y+h-r);ctx.quadraticCurveTo(x+w,y+h,x+w-r,y+h);
  ctx.lineTo(x+r,y+h);ctx.quadraticCurveTo(x,y+h,x,y+h-r);
  ctx.lineTo(x,y+r);ctx.quadraticCurveTo(x,y,x+r,y);
  ctx.closePath();
}

function downloadCard(){
  const doDownload = () => {
    drawCard();
    const cv=document.getElementById('cardCanvas');
    const name=(g('f_name')||'build_card').replace(/[^a-zA-Z0-9]/g,'_').toLowerCase();
    const a=document.createElement('a');
    a.download=`obix_${name}.png`; a.href=cv.toDataURL('image/png'); a.click();
  };
  if (document.fonts && document.fonts.ready) {
    document.fonts.ready.then(doDownload);
  } else { doDownload(); }
}

// ── Init ──────────────────────────────────────
document.querySelectorAll('.sp').forEach(el=>{
  el.addEventListener('click',()=>{
    document.querySelectorAll('.sp').forEach(x=>x.classList.remove('on'));
    el.classList.add('on'); style=el.dataset.v; drawCard();
  });
});
document.querySelectorAll('.theme-swatch').forEach(el=>{
  el.addEventListener('click',()=>{
    document.querySelectorAll('.theme-swatch').forEach(x=>x.classList.remove('on'));
    el.classList.add('on'); theme=el.dataset.t; drawCard();
  });
});
document.querySelectorAll('input,textarea').forEach(el=>{
  el.addEventListener('input',drawCard);
});

// Initial draw
// รอ web fonts load ก่อน draw — Orbitron/JetBrains Mono ต้องพร้อมก่อน
if (document.fonts && document.fonts.ready) {
  document.fonts.ready.then(() => drawCard());
} else {
  window.addEventListener('load', drawCard);
}

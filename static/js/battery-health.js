// static/js/battery-health.js — Batch D: extracted from templates/battery_health.html inline <script>. No logic change.

function analyzeBattery() {
  const cells    = parseFloat(document.getElementById('cells').value);
  const cap      = parseFloat(document.getElementById('capacity').value);
  const cRated   = parseFloat(document.getElementById('crating').value);
  const irPerCell= parseFloat(document.getElementById('ir').value);
  const restV    = parseFloat(document.getElementById('restV').value);
  const cycles   = parseFloat(document.getElementById('cycles').value);
  const style    = document.getElementById('bstyle').value;

  const irTotal_mOhm = irPerCell * cells;
  const irTotal_Ohm  = irTotal_mOhm / 1000;
  const irRef = cells <= 3 ? 3.5 : cells === 4 ? 4.0 : 4.5;
  const irAgeFactor = irPerCell / irRef;
  const iPeak_A = (cRated * cap) / 1000;
  const sagV_perCell = (iPeak_A * irTotal_Ohm) / cells;
  const sagV_pack    = iPeak_A * irTotal_Ohm;
  const vAtPeak = restV - sagV_perCell;
  const iMaxForSag = (0.3 * cells) / irTotal_Ohm;
  const cReal = (iMaxForSag / (cap / 1000));
  const irDegradation = (irPerCell - irRef) / irRef * 100;
  const cyclesEstRemain = Math.max(0, Math.round(300 - cycles - (irDegradation * 1.5)));

  let score = 100;
  score -= Math.max(0, (irPerCell - irRef)) * 6;
  score -= Math.max(0, (cycles - 50)) * 0.25;
  if (restV < 3.75) score -= (3.75 - restV) * 60;
  if (restV < 3.6)  score -= 30;
  score = Math.max(0, Math.min(100, Math.round(score)));

  const storageV = 3.82;
  const styleCurrents = {freestyle:85, racing:95, longrange:50, cinewhoop:35};
  const styleC = styleCurrents[style] || 70;
  const actualDraw_A = (styleC * cap) / 1000;

  const color = score >= 80 ? '#10c47a' : score >= 55 ? '#f1b65a' : score >= 30 ? '#fb923c' : '#f87171';
  const grade = score >= 80 ? 'EXCELLENT' : score >= 65 ? 'GOOD' : score >= 45 ? 'FAIR' : score >= 25 ? 'AGING' : 'RETIRE';

  // SVG ring: circumference = 2π×72 ≈ 452.4
  const circ = 452.4;
  const offset = circ - (score / 100) * circ;
  const ring = document.getElementById('ringFill');
  ring.style.strokeDashoffset = offset;
  ring.style.stroke = color;

  document.getElementById('ringScore').innerHTML = `<span style="color:${color}">${score}</span>`;
  document.getElementById('ringGrade').innerHTML = `<span style="color:${color}">${grade}</span>`;

  const sagClass = sagV_perCell > 0.4 ? 'crit' : sagV_perCell > 0.25 ? 'bad' : sagV_perCell > 0.15 ? 'warn' : 'ok';
  document.getElementById('mSag').innerHTML = `<span class="${sagClass}">${sagV_perCell.toFixed(2)}V/cell</span>`;
  document.getElementById('mSagSub').textContent = `pack total: ${sagV_pack.toFixed(2)}V`;

  const cClass = cReal >= cRated * 0.75 ? 'ok' : cReal >= cRated * 0.5 ? 'warn' : 'bad';
  document.getElementById('mRealC').innerHTML = `<span class="${cClass}">${Math.round(cReal)}C</span>`;

  const lifeClass = cyclesEstRemain > 100 ? 'ok' : cyclesEstRemain > 40 ? 'warn' : 'bad';
  document.getElementById('mLife').innerHTML = `<span class="${lifeClass}">~${cyclesEstRemain}</span>`;
  document.getElementById('mStorage').textContent = `${storageV.toFixed(2)} V/cell`;
  document.getElementById('mPeak').innerHTML = `<span style="color:var(--blue)">${Math.round(iPeak_A)} A</span>`;
  document.getElementById('mPeakSub').textContent = `(${cRated}C × ${cap}mAh) — real sustained: ~${Math.round(iMaxForSag)}A`;

  const recs = [];
  if (irPerCell > 12)     recs.push({icon:'🚫',text:'<strong>ควรเลิกใช้แบตนี้</strong> — IR สูงมาก ('+irPerCell+'mΩ/cell) เสี่ยง sag แรง, brownout, หรือ thermal runaway'});
  else if (irPerCell > 8) recs.push({icon:'⚠️',text:'IR สูงกว่าปกติมาก — ลด C-rating ในการใช้งานลง 30% และอย่าใช้กับ racing หรือ freestyle'});
  else if (irPerCell > 6) recs.push({icon:'⚡',text:'IR เริ่มสูง — แบตอยู่ในช่วง mid-life แนะนำใช้กับ longrange หรือ cinematic เท่านั้น'});
  if (restV < 3.70)       recs.push({icon:'🔌',text:'Resting voltage ต่ำ — ชาร์จไม่เต็มหรือแบตเสื่อม ตรวจสอบ balance voltage ทุก cell'});
  if (sagV_perCell > 0.35) recs.push({icon:'💡',text:`Voltage sag ${sagV_perCell.toFixed(2)}V/cell สูงมาก → ลอง throttle cap ที่ 80% หรือเพิ่ม battery parallel`});
  if (cycles > 200)       recs.push({icon:'🔄',text:`${cycles} cycles — ถือว่ามาก สำหรับแบต freestyle แนะนำตรวจ IR ทุก 20 cycles`});
  if (score >= 80)        recs.push({icon:'✅',text:'แบตอยู่ในสภาพดีมาก ดูแลด้วยการ storage charge และเก็บในที่อุณหภูมิเหมาะสม (20–25°C)'});
  recs.push({icon:'🌡️',text:`อุณหภูมิหลังบิน: แบตไม่ควรร้อนกว่า 45°C ถ้าร้อนกว่า = ดึงกระแสเกิน IR capacity`});

  document.getElementById('recList').innerHTML = recs.map(r =>
    `<div class="rec-item"><span class="rec-icon">${r.icon}</span><span class="rec-text">${r.text}</span></div>`
  ).join('');

  document.getElementById('physicsEq').innerHTML =
    `V_sag = I_peak × R_internal<br>` +
    `<span style="color:var(--gold)">${iPeak_A.toFixed(0)} A × ${irTotal_Ohm.toFixed(4)} Ω = <strong style="color:var(--text)">${sagV_pack.toFixed(3)} V drop</strong></span><br><br>` +
    `C_real = V_min_drop / (IR_total × C_nom)<br>` +
    `<span class="comment">// where V_min_drop = 0.3V/cell safe threshold</span><br>` +
    `<span style="color:var(--teal)">${Math.round(cReal)}C effective (rated: ${cRated}C)</span>`;

  const degradePct = Math.round(irDegradation);
  document.getElementById('physicsBody').innerHTML =
    `IR เพิ่มขึ้นจากค่าอ้างอิง <strong style="color:var(--text)">${degradePct}%</strong> — ` +
    (degradePct < 20 ? 'อยู่ในเกณฑ์ดี แบตยังสมบูรณ์' :
     degradePct < 60 ? 'เสื่อมตามอายุ ควรระวังในงาน high-demand' :
     'เสื่อมสภาพมาก ควรใช้เฉพาะงาน low-current');

  document.getElementById('resultPanel').style.display = 'block';
  document.getElementById('hintPanel').style.display = 'none';
}

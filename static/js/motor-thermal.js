// static/js/motor-thermal.js — Batch D: extracted from templates/motor_thermal.html inline <script>. No logic change.

// Stator data: [diameter_mm, height_mm, base_resistance_mOhm, thermal_resistance_C_per_W]
const STATOR_DATA = {
  '1105':{d:11,h:5,R:180,Rth:28},
  '1306':{d:13,h:6,R:140,Rth:24},
  '1507':{d:15,h:7,R:110,Rth:20},
  '2203':{d:22,h:3,R:90,Rth:17},
  '2205':{d:22,h:5,R:70,Rth:14},
  '2306':{d:23,h:6,R:60,Rth:12},
  '2207':{d:22,h:7,R:52,Rth:10},
  '2306lr':{d:23,h:6,R:90,Rth:12},
  '2812':{d:28,h:12,R:40,Rth:9},
  '3115':{d:31,h:15,R:32,Rth:7},
};

const STYLE_DUTY = {freestyle:0.55, racing:0.75, longrange:0.40, cinewhoop:0.25, hover:0.30};

function analyzeThermal() {
  const statorKey  = document.getElementById('stator').value;
  const kv         = parseFloat(document.getElementById('motorKV').value);
  const cells      = parseFloat(document.getElementById('motorCells').value);
  const style      = document.getElementById('mStyle').value;
  const throttle   = parseFloat(document.getElementById('avgThrottle').value) / 100;
  const ambient    = parseFloat(document.getElementById('ambientT').value);
  const duration   = parseFloat(document.getElementById('flightMin').value);

  const st = STATOR_DATA[statorKey];
  const vNom  = cells * 3.7;
  const vMax  = cells * 4.2;

  // Effective voltage at given throttle (assumes linear)
  const vEff  = vMax * throttle;
  const rpm   = kv * vEff;

  // Motor resistance (temp-adjusted: +0.4% per °C above 25°C ambient)
  const R_ohm = (st.R / 1000) * (1 + 0.004 * Math.max(0, ambient - 25));

  // Motor current estimate: P_mech = V×I×η; efficiency ~85% at cruise
  // I ≈ V / (R_total) × (1 - eff) is simplified:
  // Use: I_avg ≈ duty-based model
  const duty = STYLE_DUTY[style] || 0.55;
  const effectiveDuty = Math.max(throttle, duty * 0.8);

  // Power at throttle: P = (V × throttle)² / R_total (simplified back-EMF model)
  // More accurate: I = (V - back_EMF) / R; back_EMF = KV⁻¹ × RPM
  const backEMF = rpm / (kv * vMax / vMax); // ≈ vEff at no-load
  const netV    = Math.max(0.5, vEff - backEMF * 0.7); // simplified
  const I_avg   = (vEff * effectiveDuty * 0.65) / R_ohm / 10; // practical estimate A
  const I_capped = Math.min(I_avg, vEff / R_ohm * 0.5); // safety clamp

  // Power dissipated as heat: P_heat = I² × R
  const P_heat = I_capped * I_capped * R_ohm;

  // Total input power
  const P_in   = vEff * I_capped * effectiveDuty;

  // Efficiency
  const efficiency = P_in > 0 ? Math.max(0.5, Math.min(0.92, 1 - P_heat / Math.max(P_in, 1))) : 0.8;

  // Thermal model: T_winding = T_ambient + P_heat × Rth
  // Rth (thermal resistance) varies with airflow; multiply by airflow factor
  const airflowFactor = style === 'hover' ? 1.4 : style === 'racing' ? 0.7 : 1.0;
  const Rth_eff = st.Rth * airflowFactor;
  const deltaT  = P_heat * Rth_eff;
  const T_winding = ambient + deltaT;

  // Time to reach 70°C (safe limit): simplified linear rise to steady-state
  // Thermal time constant τ ≈ mass × Cp / conductance; estimate stator mass
  const statorVol_mm3 = Math.PI * (st.d/2)**2 * st.h;
  const statorMass_g  = statorVol_mm3 * 0.00786; // steel density g/mm³
  const Cp_J_per_gK   = 0.49; // steel
  const tau_s         = statorMass_g * Cp_J_per_gK * Rth_eff;  // seconds
  const T_steady      = T_winding;
  const T_safe        = 70;

  let safeDuration_min = 999;
  if (T_steady > T_safe) {
    // Time to reach 70°C: t = -τ × ln(1 - (T_safe-ambient)/(T_steady-ambient))
    const ratio = (T_safe - ambient) / (T_steady - ambient);
    if (ratio > 0 && ratio < 1) {
      safeDuration_min = (-tau_s * Math.log(1 - ratio)) / 60;
    } else if (ratio <= 0) {
      safeDuration_min = 0;
    }
  }

  // ── Display ──────────────────────────────────────────────
  const tempColor = T_winding < 45 ? '#10c47a' : T_winding < 60 ? '#2dd4bf' : T_winding < 70 ? '#f1b65a' : T_winding < 85 ? '#fb923c' : '#f87171';
  const zoneText  = T_winding < 45 ? '✅ COOL — สบาย motor ยังใหม่มาก' : T_winding < 60 ? '🟢 WARM — ปกติสำหรับ cruise' : T_winding < 70 ? '🟡 HOT — ใกล้ขอบ safe zone' : T_winding < 85 ? '🟠 DANGER — เกิน safe limit' : '🔴 CRITICAL — motor อาจเสียหายถาวร';

  document.getElementById('tempBig').textContent = Math.round(T_winding) + '°C';
  document.getElementById('tempBig').style.color = tempColor;
  document.getElementById('zoneLabel').innerHTML = `<span style="color:${tempColor}">${zoneText}</span>`;

  // Bar position: 0°C = 0%, 120°C = 100%
  const barPos = Math.min(100, Math.max(0, T_winding / 120 * 100));
  document.getElementById('tempIndicator').style.left = barPos + '%';
  document.getElementById('tempIndicator').style.background = tempColor;

  const tempClass = T_winding < 60 ? 'status-ok' : T_winding < 70 ? 'status-warn' : 'status-bad';
  document.getElementById('mHeatW').innerHTML = `<span class="${tempClass}">${P_heat.toFixed(1)}W</span>`;
  document.getElementById('mEff').innerHTML = `<span class="status-ok">${(efficiency * 100).toFixed(0)}%</span>`;
  document.getElementById('mCurrent').textContent = I_capped.toFixed(1) + ' A';
  document.getElementById('mThermalRise').innerHTML = `<span style="color:${tempColor}">+${deltaT.toFixed(1)}°C</span>`;

  if (safeDuration_min === 999) {
    document.getElementById('mSafeDuration').innerHTML = `<span class="status-ok">∞ ปลอดภัยตลอด</span>`;
  } else {
    const cls = safeDuration_min < 3 ? 'status-bad' : safeDuration_min < 8 ? 'status-warn' : 'status-ok';
    document.getElementById('mSafeDuration').innerHTML = `<span class="${cls}">${safeDuration_min.toFixed(1)} นาที</span>`;
  }

  // Recommendations
  const recs = [];
  if (T_winding > 85)      recs.push({icon:'🚫', text:'<strong>อุณหภูมิสูงอันตราย</strong> — ลด throttle cap ใน BF หรือเปลี่ยน stator ที่ใหญ่กว่า / KV ต่ำกว่า'});
  else if (T_winding > 70) recs.push({icon:'⚠️', text:'เกิน 70°C safe zone — ตรวจสอบ motor หลังบิน ถ้าร้อนมือจับไม่ได้ = over spec'});
  if (style === 'racing' && T_winding > 65) recs.push({icon:'🏁', text:'Racing style + temp สูง — ลอง motor KV ต่ำกว่า หรือ motor poles มากกว่า เพื่อ efficiency สูงขึ้น'});
  if (T_winding < 55)      recs.push({icon:'✅', text:'อุณหภูมิ OK — motor ยังมี headroom อีกมาก ถ้าต้องการ performance สูงขึ้นยังทำได้'});
  recs.push({icon:'🌬️', text:'Airflow จาก prop ช่วยระบายความร้อนมาก — motor จะร้อนกว่านี้ถ้า static test (hover) เทียบกับ forward flight'});
  if (cells >= 6 && kv > 2000) recs.push({icon:'💡', text:'6S + KV สูง = power สูงมาก — stator ขนาดนี้อาจไม่พอรับ sustained เพิ่ม stator height หรือลด KV'});

  document.getElementById('recList').innerHTML = recs.map(r =>
    `<div class="rec-item"><span class="rec-icon">${r.icon}</span><span class="rec-text">${r.text}</span></div>`
  ).join('');

  // Physics
  document.getElementById('physicsEq').innerHTML =
    `T_winding = T_ambient + P_heat × R_thermal<br>` +
    `<span style="color:var(--orange)">${ambient}°C + ${P_heat.toFixed(1)}W × ${Rth_eff.toFixed(1)} °C/W = <strong style="color:var(--text)">${Math.round(T_winding)}°C</strong></span><br><br>` +
    `P_heat = I² × R_winding<br>` +
    `<span class="comment">// I=${I_capped.toFixed(1)}A, R=${R_ohm.toFixed(4)}Ω, τ=${tau_s.toFixed(0)}s thermal time const</span>`;

  document.getElementById('physicsBody').innerHTML =
    `Stator volume: ${Math.round(statorVol_mm3)} mm³ → estimated mass: ${statorMass_g.toFixed(1)}g → ` +
    `thermal time constant: <strong style="color:var(--text)">${tau_s.toFixed(0)}s</strong> ` +
    `(ใช้เวลา ~${(tau_s * 3 / 60).toFixed(1)} นาทีถึง steady-state)`;

  document.getElementById('resultPanel').style.display = 'block';
  document.getElementById('hintPanel').style.display = 'none';
}

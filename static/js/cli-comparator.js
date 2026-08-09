// static/js/cli-comparator.js — Batch C: extracted from templates/cli_comparator.html inline <script>. No logic change.


'use strict';

/* ══════════════════════════════════════════════════
   KNOWLEDGE BASE — 90+ Betaflight Parameters
   cat: PID | FILTER | MOTOR | RATES | SAFETY | RC | VTX | OTHER
   risk: low | medium | high
   safe: safe range string
   min/max: numeric bounds for bar visualization
   hiEffect: what happens when too high
   loEffect: what happens when too low
   related: related param keys
   ══════════════════════════════════════════════════ */
const KB = {
  /* ── PID ── */
  p_roll:   { cat:'PID', risk:'medium', safe:'40–65', min:0, max:100, def:46,
    desc:'P term ของ Roll axis — ตอบสนองหลักต่อ stick input ยิ่ง P สูง การตอบสนองยิ่งคมชัด แต่ถ้าสูงเกินไปจะ oscillate',
    tip:'เพิ่มทีละ 5 จน oscillate แล้วถอยกลับ 10 ตรวจ motor temp หลังบิน',
    hiEffect:'High-frequency oscillation หรือ buzz ที่มองเห็นใน blackbox, motor ร้อน, เสียงดัง',
    loEffect:'Stick รู้สึก mushy/sluggish, โดรนไม่ตอบสนอง, attitude lock แย่',
    related:['d_roll','f_roll','tpa_rate'] },
  p_pitch:  { cat:'PID', risk:'medium', safe:'42–70', min:0, max:110, def:50,
    desc:'P term ของ Pitch axis — Pitch มักต้องการ P สูงกว่า Roll เล็กน้อย เพราะ center of gravity อยู่ต่างตำแหน่ง',
    tip:'ตั้ง pitch P ≈ roll P + 2–5 เป็น starting point',
    hiEffect:'Pitch oscillation ในแนวหน้า-หลัง โดยเฉพาะตอน dive',
    loEffect:'Pitch รู้สึกช้า แล้วก็ nose drop หลัง punch',
    related:['d_pitch','f_pitch','p_roll'] },
  p_yaw:    { cat:'PID', risk:'low', safe:'30–55', min:0, max:80, def:35,
    desc:'P term ของ Yaw axis — Yaw axis ไม่ใช้ D term จึงพึ่ง P เป็นหลัก',
    tip:'35–45 freestyle, 40–55 racing',
    hiEffect:'Yaw wobble หรือ tail wag โดยเฉพาะตอน high throttle',
    loEffect:'Yaw ไม่ยึดตำแหน่ง เกิด yaw drift',
    related:['i_yaw','f_yaw'] },
  i_roll:   { cat:'PID', risk:'low', safe:'70–110', min:0, max:150, def:90,
    desc:'I term ของ Roll — สะสม error เพื่อแก้ drift ระยะยาว และต้านลม I term สำคัญมากสำหรับการ lock attitude',
    tip:'ใช้ iterm_relax = RP เพื่อป้องกัน windup ระหว่าง flip/roll',
    hiEffect:'I-term windup: bounce-back หลัง flip/roll หรือ step input',
    loEffect:'Drift ตอน hover, ต้านลมไม่ได้, เสียความตรง',
    related:['i_pitch','iterm_relax','anti_gravity_gain'] },
  i_pitch:  { cat:'PID', risk:'low', safe:'70–115', min:0, max:150, def:90,
    desc:'I term ของ Pitch — เหมือน I roll ช่วย lock attitude และต้านลม',
    tip:'ปกติตั้งใกล้ I roll ±5',
    hiEffect:'Bounce-back หลัง dive หรือ punch',
    loEffect:'Pitch drift ตอน hover, nose drop เมื่อเพิ่ม throttle',
    related:['i_roll','iterm_relax'] },
  i_yaw:    { cat:'PID', risk:'low', safe:'70–105', min:0, max:140, def:90,
    desc:'I term ของ Yaw — ป้องกัน yaw drift ตอน throttle punch สูงและต้านลมในแนว yaw',
    tip:'ลด I yaw ถ้ามี yaw twitch ตอน full throttle',
    hiEffect:'Yaw drift ตอน punch, yaw วิ่งไปมา',
    loEffect:'Yaw ไม่ยึด drift ง่าย',
    related:['p_yaw','f_yaw'] },
  d_roll:   { cat:'PID', risk:'high', safe:'25–50', min:0, max:70, def:35,
    desc:'D term ของ Roll — dampen oscillation จาก P ค่าสูงมาก = กรอง oscillation ดีขึ้น แต่ motor ร้อน, ค่าต่ำ = P oscillate',
    tip:'ดู motor temp หลังบิน >60°C = D สูงเกิน RPM filter ช่วยให้เพิ่ม D ได้ปลอดภัยขึ้น',
    hiEffect:'Motor ร้อนมาก, เสียงดัง, prop wash แย่ลง — D amplify noise',
    loEffect:'Oscillation จาก P ไม่ถูก damp, bouncy after inputs',
    related:['p_roll','gyro_lpf1_hz','dterm_lpf1_hz'] },
  d_pitch:  { cat:'PID', risk:'high', safe:'27–52', min:0, max:75, def:37,
    desc:'D term ของ Pitch — เหมือน D roll สำคัญมากสำหรับ prop wash และ stability หลัง dive',
    tip:'D pitch ≈ D roll + 2–3',
    hiEffect:'Motor ร้อน, prop wash แย่ลง',
    loEffect:'Oscillation หลัง dive หรือ abrupt input',
    related:['p_pitch','dterm_lpf1_hz','d_roll'] },
  f_roll:   { cat:'PID', risk:'low', safe:'0–120', min:0, max:150, def:0,
    desc:'Feedforward Roll — คาดการณ์ stick input ล่วงหน้า ลด lag ระหว่าง stick กับ drone rotation เพิ่ม "crispness"',
    tip:'เพิ่ม FF ถ้า stick ยังช้า ลดถ้า stick jerky/glitchy',
    hiEffect:'Stick overshoot, jerky feeling, ไวต่อ RC noise',
    loEffect:'Stick lag, โดรนตาม stick ไม่ทัน',
    related:['f_pitch','feedforward_averaging','rc_smoothing_mode'] },
  f_pitch:  { cat:'PID', risk:'low', safe:'0–125', min:0, max:150, def:0,
    desc:'Feedforward Pitch — เหมือน FF roll',
    tip:'FF pitch ≈ FF roll + 3–5',
    hiEffect:'Pitch overshoot, jerky',
    loEffect:'Pitch lag',
    related:['f_roll','feedforward_averaging'] },
  f_yaw:    { cat:'PID', risk:'low', safe:'0–60', min:0, max:100, def:0,
    desc:'Feedforward Yaw — FF สำหรับ yaw axis มักตั้งต่ำกว่า roll/pitch',
    tip:'0–30 เป็น sweet spot สำหรับส่วนใหญ่',
    hiEffect:'Yaw twitch',
    loEffect:'Yaw lag',
    related:['p_yaw','i_yaw'] },
  anti_gravity_gain: { cat:'PID', risk:'low', safe:'3–15', min:0, max:30, def:5,
    desc:'Anti-gravity — เพิ่ม I term ชั่วคราวเมื่อ throttle เปลี่ยนแปลงเร็วมาก ป้องกัน pitch/roll drift ตอน punch หรือ cut',
    tip:'5–8 freestyle สูงขึ้นถ้ามี nose drop ตอน dive+pull',
    hiEffect:'Over-correction ตอน punch',
    loEffect:'Nose drop หรือ attitude shift ตอน throttle punch/cut',
    related:['i_roll','i_pitch','tpa_breakpoint'] },
  feedforward_roll:  { cat:'PID', risk:'low', safe:'0–100', min:0, max:130, def:0,
    desc:'Feedforward Roll (BF 4.x style) — ทำงานเหมือน F term แต่ใช้ชื่อนี้ใน BF รุ่นเก่ากว่า',
    tip:'20–40 เป็น sweet spot สำหรับ 5"',
    hiEffect:'Overshoot, glitchy',
    loEffect:'Lag',
    related:['f_roll','feedforward_averaging'] },
  feedforward_pitch: { cat:'PID', risk:'low', safe:'0–105', min:0, max:130, def:0,
    desc:'Feedforward Pitch (BF 4.x style)',
    tip:'FF pitch = FF roll + 5',
    hiEffect:'Overshoot',
    loEffect:'Lag',
    related:['f_pitch'] },
  feedforward_averaging: { cat:'PID', risk:'low', safe:'2_POINT', min:0, max:4, def:0,
    desc:'วิธีเฉลี่ย Feedforward เพื่อลด noise จาก RC signal 2_POINT ใช้ 2 ค่าล่าสุด',
    tip:'2_POINT เหมาะสำหรับ ELRS/CRSF, 4_POINT ถ้า RC noisy มาก',
    hiEffect:'Smooth FF มากขึ้น แต่ lag เพิ่มเล็กน้อย',
    loEffect:'FF noisy',
    related:['f_roll','rc_smoothing_mode'] },
  tpa_rate: { cat:'PID', risk:'low', safe:'5–25', min:0, max:50, def:10,
    desc:'TPA Rate — ลด P/D เมื่อ throttle สูง ป้องกัน oscillation ตอน high-speed flight',
    tip:'10–15 freestyle, 20–25 racing',
    hiEffect:'P/D ลดเร็วเกินไปที่ throttle สูง โดรนเบากว่าปกติ',
    loEffect:'Oscillation ตอน full throttle',
    related:['tpa_breakpoint','p_roll','d_roll'] },
  tpa_breakpoint: { cat:'PID', risk:'low', safe:'1300–1600', min:1000, max:2000, def:1500,
    desc:'Throttle ที่ TPA เริ่มทำงาน ค่าต่ำ TPA เริ่มเร็ว ค่าสูง TPA เริ่มช้า',
    tip:'ตั้งใกล้ hover throttle ~1400–1500',
    hiEffect:'TPA เริ่มช้าเกินไป',
    loEffect:'TPA เริ่มเร็ว P/D ลดตั้งแต่ mid-throttle',
    related:['tpa_rate'] },
  iterm_relax: { cat:'PID', risk:'low', safe:'RP', min:0, max:3, def:1,
    desc:'ลด I term buildup ระหว่าง rapid stick input ป้องกัน bounce-back หลัง trick หรือ step input',
    tip:'RP (Roll+Pitch) สำหรับ freestyle/racing, RPY รวม yaw ด้วย',
    hiEffect:'I term ทำงานน้อยลงขณะ maneuver',
    loEffect:'Bounce-back หลัง flip/roll',
    related:['i_roll','i_pitch'] },

  /* ── FILTER ── */
  gyro_lpf1_hz: { cat:'FILTER', risk:'medium', safe:'150–250', min:50, max:500, def:200,
    desc:'Gyro LPF1 cutoff frequency (Hz) — กรอง high-frequency noise จาก gyro ก่อนเข้า PID ค่าต่ำ = กรองมาก latency สูง ค่าสูง = response ไว แต่ noise ผ่านมาก',
    tip:'ถ้าเปิด RPM filter เพิ่ม Hz ขึ้น 20–40 เพื่อลด latency ได้ปลอดภัย',
    hiEffect:'Noise เข้า PID มากขึ้น motor ร้อนขึ้น',
    loEffect:'Gyro latency เพิ่ม โดรนตอบสนองช้าลง',
    related:['gyro_lpf2_hz','gyro_lpf1_type','dshot_bidir'] },
  gyro_lpf2_hz: { cat:'FILTER', risk:'low', safe:'300–500', min:100, max:1000, def:400,
    desc:'Gyro LPF2 — second stage filter ค่ามักตั้ง 2× LPF1',
    tip:'LPF2 = LPF1 × 2',
    hiEffect:'Noise มากขึ้น',
    loEffect:'Latency เพิ่ม',
    related:['gyro_lpf1_hz'] },
  dterm_lpf1_hz: { cat:'FILTER', risk:'medium', safe:'90–130', min:30, max:300, def:110,
    desc:'D-term LPF1 cutoff — สำคัญมาก กรอง noise ก่อน D term ซึ่งขยาย noise ตามธรรมชาติ ค่าต่ำเกิน D ไม่ทำงาน ค่าสูงเกิน motor ร้อน',
    tip:'100–120 Hz สำหรับ most 5" builds',
    hiEffect:'Motor ร้อน prop wash แย่ลง (D amplify noise)',
    loEffect:'D term sluggish ไม่ dampen oscillation',
    related:['dterm_lpf2_hz','dterm_lpf1_type','d_roll'] },
  dterm_lpf2_hz: { cat:'FILTER', risk:'low', safe:'150–250', min:50, max:500, def:175,
    desc:'D-term LPF2 cutoff — second stage filter สำหรับ D term',
    tip:'~ LPF1 × 1.5–2',
    hiEffect:'Noise มากขึ้นใน D term',
    loEffect:'D term laggy',
    related:['dterm_lpf1_hz'] },
  dyn_notch_count: { cat:'FILTER', risk:'low', safe:'1–4', min:0, max:5, def:3,
    desc:'จำนวน dynamic notch filter — ติดตาม resonance peak แบบ real-time ค่ามาก = CPU มาก แต่กรองดีกว่า',
    tip:'2–3 สำหรับส่วนใหญ่, 1 ถ้ามี RPM filter เพราะ RPM filter ทำงานแทน',
    hiEffect:'CPU load เพิ่ม อาจ looptime ช้าลง',
    loEffect:'Resonance peak ที่ไม่ถูกกรอง = motor ร้อนหรือ buzz',
    related:['dyn_notch_min_hz','dyn_notch_max_hz','dshot_bidir'] },
  dyn_notch_min_hz: { cat:'FILTER', risk:'low', safe:'60–150', min:30, max:300, def:100,
    desc:'Dynamic notch minimum tracking frequency — notch จะไม่ติดตาม resonance ต่ำกว่านี้',
    tip:'80–100 Hz สำหรับ 5" builds',
    hiEffect:'Notch ไม่ติดตาม low-freq resonance',
    loEffect:'Notch อาจ false-track ใน very low frequency',
    related:['dyn_notch_max_hz','dyn_notch_count'] },
  dyn_notch_max_hz: { cat:'FILTER', risk:'low', safe:'300–700', min:100, max:1000, def:500,
    desc:'Dynamic notch maximum tracking frequency',
    tip:'500–700 Hz สำหรับ 5" builds, higher สำหรับ micro',
    hiEffect:'Notch ไม่ติดตาม high-freq resonance',
    loEffect:'ไม่มีผลเสียโดยตรง',
    related:['dyn_notch_min_hz'] },
  dyn_notch_width_percent: { cat:'FILTER', risk:'low', safe:'5–15', min:1, max:30, def:8,
    desc:'ความกว้างของ dynamic notch filter (%) ค่าสูง = กรองกว้าง แต่กรอง frequency ที่ไม่ต้องการกรองออกด้วย',
    tip:'8 เป็น default ที่ดีสำหรับส่วนใหญ่',
    hiEffect:'Gyroc data หายไปมากเกินความจำเป็น',
    loEffect:'Notch แคบเกินไปอาจไม่ครอบ resonance',
    related:['dyn_notch_count'] },
  gyro_lpf1_type: { cat:'FILTER', risk:'low', safe:'PT1', min:0, max:1, def:0,
    desc:'ประเภทของ Gyro LPF1 — PT1: เร็วกว่า rolloff ไม่ชัน BIQUAD: ชันกว่าแต่ delay มากกว่า',
    tip:'PT1 สำหรับ racing, BIQUAD สำหรับ smooth freestyle',
    hiEffect:'—',
    loEffect:'—',
    related:['gyro_lpf1_hz'] },
  dterm_lpf1_type: { cat:'FILTER', risk:'low', safe:'PT1', min:0, max:1, def:0,
    desc:'ประเภทของ D-term LPF1',
    tip:'PT1 แนะนำสำหรับ most builds',
    hiEffect:'—',
    loEffect:'—',
    related:['dterm_lpf1_hz'] },
  rpm_filter_harmonics: { cat:'FILTER', risk:'low', safe:'3', min:1, max:5, def:3,
    desc:'จำนวน harmonic ที่ RPM filter กรอง — แต่ละ harmonic คือ motor frequency × N',
    tip:'3 เป็น sweet spot สำหรับส่วนใหญ่',
    hiEffect:'CPU load เพิ่ม',
    loEffect:'Upper harmonics ไม่ถูกกรอง',
    related:['dshot_bidir','motor_poles'] },
  rpm_filter_min_hz: { cat:'FILTER', risk:'low', safe:'80–150', min:30, max:300, def:100,
    desc:'ความถี่ต่ำสุดที่ RPM filter ทำงาน ควรต่ำกว่า idle RPM harmonic เล็กน้อย',
    tip:'100 Hz สำหรับ 5" motor ~4500 KV',
    hiEffect:'RPM filter ไม่กรอง low RPM',
    loEffect:'อาจกรอง frequency ที่ไม่ใช่ motor noise',
    related:['dshot_bidir','motor_poles','rpm_filter_harmonics'] },

  /* ── MOTOR ── */
  motor_pwm_protocol: { cat:'MOTOR', risk:'high', safe:'DSHOT600', min:0, max:6, def:4,
    desc:'โปรโตคอลสื่อสาร FC ↔ ESC — DSHOT300/600 เป็น digital ไม่ต้อง calibrate เที่ยงตรงกว่า Oneshot/Multishot',
    tip:'DSHOT600 สำหรับ ESC สมัยใหม่, DSHOT300 สำหรับ ESC รุ่นเก่า',
    hiEffect:'ESC ไม่รับสัญญาณถ้าไม่รองรับ DSHOT นั้น',
    loEffect:'—',
    related:['dshot_bidir'] },
  dshot_bidir: { cat:'MOTOR', risk:'high', safe:'ON', min:0, max:1, def:0,
    desc:'Bidirectional DSHOT — เปิด RPM telemetry จาก ESC → FC จำเป็นสำหรับ RPM filter ESC ต้องรองรับ BLHeli_32 หรือ AM32/Bluejay',
    tip:'ถ้า ESC ไม่รองรับ motor จะ desync ทันที ตรวจ ESC firmware ก่อนเปิด',
    hiEffect:'—',
    loEffect:'RPM filter ไม่ทำงาน',
    related:['motor_pwm_protocol','motor_poles','rpm_filter_harmonics'] },
  motor_poles: { cat:'MOTOR', risk:'high', safe:'14', min:6, max:24, def:14,
    desc:'จำนวนขั้วแม่เหล็กของ motor — ใช้คำนวณ RPM จาก ESC telemetry ผิดพลาด → RPM filter ทำงานที่ความถี่ผิด',
    tip:'Motor 5" ส่วนใหญ่ใช้ 14 poles (7 แม่เหล็กคู่), micro อาจใช้ 12',
    hiEffect:'RPM filter กรองผิดความถี่ ประสิทธิภาพลด',
    loEffect:'เหมือนกัน',
    related:['dshot_bidir','rpm_filter_harmonics'] },
  min_throttle: { cat:'MOTOR', risk:'medium', safe:'1000–1050', min:1000, max:1100, def:1000,
    desc:'Throttle ต่ำสุดที่ส่งไป ESC ขณะ armed แต่ยังไม่ spin (motor_stop=ON) หรือ spin ช้า (motor_stop=OFF)',
    tip:'1010–1030 สำหรับส่วนใหญ่',
    hiEffect:'Motor หมุนเร็วตลอด ทำให้ landing ยาก',
    loEffect:'Motor ดับระหว่างบิน (desync)',
    related:['idle_percent','motor_stop'] },
  idle_percent: { cat:'MOTOR', risk:'medium', safe:'3.5–7', min:0, max:15, def:5.5,
    desc:'Motor idle speed (%) เมื่อ armed — ค่าต่ำเกิน motor ดับหรือ desync ค่าสูงเกิน drag เพิ่ม battery drain',
    tip:'5–6% freestyle, 3.5–4.5% racing',
    hiEffect:'Motor drag เพิ่ม, battery drain',
    loEffect:'Motor desync ตอน low throttle',
    related:['min_throttle','motor_stop'] },
  motor_output_limit: { cat:'MOTOR', risk:'medium', safe:'85–100', min:50, max:100, def:100,
    desc:'จำกัด maximum motor output (%) ใช้ลด max power สำหรับ whoops หรือ beginner practice',
    tip:'100 สำหรับ full power, 80–90 สำหรับ beginner',
    hiEffect:'—',
    loEffect:'Maximum power ลด performance',
    related:['min_throttle'] },
  motor_stop: { cat:'SAFETY', risk:'medium', safe:'OFF', min:0, max:1, def:0,
    desc:'เมื่อ ON: motor หยุดสนิทตอน throttle = 0 อันตรายถ้า re-arm กลางอากาศ motor จะ spin กะทันหัน',
    tip:'ปกติตั้ง OFF เพื่อความปลอดภัย',
    hiEffect:'Motor หยุดตอน throttle 0 อาจ desync',
    loEffect:'—',
    related:['min_throttle','idle_percent'] },

  /* ── RATES ── */
  roll_rc_rate:  { cat:'RATES', risk:'low', safe:'1.0–2.5', min:0.1, max:3.5, def:1.4,
    desc:'RC Rate ของ Roll — ความเร็ว roll ที่ full stick ค่าสูง = roll เร็ว',
    tip:'1.4–1.8 freestyle, 1.8–2.2 racing',
    hiEffect:'Stick hyperactive ยาก control',
    loEffect:'Slow roll ไม่พอ',
    related:['roll_expo','roll_srate'] },
  pitch_rc_rate: { cat:'RATES', risk:'low', safe:'1.0–2.5', min:0.1, max:3.5, def:1.4,
    desc:'RC Rate ของ Pitch',
    tip:'= roll_rc_rate',
    hiEffect:'Stick ไว',
    loEffect:'Slow pitch',
    related:['pitch_expo','roll_rc_rate'] },
  yaw_rc_rate:   { cat:'RATES', risk:'low', safe:'0.8–2.0', min:0.1, max:3.0, def:1.0,
    desc:'RC Rate ของ Yaw',
    tip:'1.0–1.5 freestyle',
    hiEffect:'Yaw ไวเกิน',
    loEffect:'Slow yaw',
    related:['yaw_expo'] },
  roll_expo:     { cat:'RATES', risk:'low', safe:'0–0.7', min:0, max:1, def:0,
    desc:'Expo Roll — curve ที่ center stick ค่าสูง = center นุ่ม edge ไว',
    tip:'0.2–0.4 freestyle',
    hiEffect:'Center เบา edge ไว',
    loEffect:'Linear',
    related:['roll_rc_rate','roll_srate'] },
  roll_srate:    { cat:'RATES', risk:'low', safe:'0–1.0', min:0, max:1, def:0.7,
    desc:'Super Rate Roll — เพิ่ม sensitivity ที่ edge ของ stick',
    tip:'0.6–0.75 freestyle',
    hiEffect:'Edge hyperactive',
    loEffect:'Linear near full stick',
    related:['roll_rc_rate','roll_expo'] },

  /* ── SAFETY ── */
  failsafe_delay: { cat:'SAFETY', risk:'high', safe:'4–8', min:0, max:20, def:4,
    desc:'เวลา (unit: 0.1 วินาที) ก่อน failsafe trigger เมื่อ signal หาย ค่าต่ำเกิน = false trigger จาก interference ค่าสูงเกิน = ปฏิกิริยาช้า',
    tip:'4–5 เหมาะกับ FPV ทั่วไป (0.4–0.5 วินาที)',
    hiEffect:'Failsafe ช้าเกินไป โดรนบินไปไกล',
    loEffect:'False trigger จาก RF interference ชั่วคราว',
    related:['failsafe_action','failsafe_off_delay'] },
  failsafe_action: { cat:'SAFETY', risk:'high', safe:'DROP', min:0, max:3, def:0,
    desc:'การกระทำเมื่อ failsafe — DROP: ตัด motor ทันที, LAND: ลงช้าๆ, GPS_RESCUE: บินกลับ home',
    tip:'DROP สำหรับ FPV racing/freestyle, LAND สำหรับ beginner, GPS_RESCUE ถ้ามี GPS',
    hiEffect:'—',
    loEffect:'—',
    related:['failsafe_delay','failsafe_off_delay'] },
  failsafe_off_delay: { cat:'SAFETY', risk:'medium', safe:'1–5', min:0, max:10, def:1,
    desc:'เวลารอก่อน motor ดับหลัง failsafe trigger ช่วยป้องกัน desync ตอน signal กลับมา',
    tip:'1 วินาที เป็นค่าแนะนำ',
    hiEffect:'Motor หมุนนานหลัง failsafe',
    loEffect:'Motor ดับเร็วเกินไปอาจ desync',
    related:['failsafe_delay','failsafe_action'] },

  /* ── RC ── */
  serialrx_provider: { cat:'RC', risk:'high', safe:'CRSF', min:0, max:8, def:0,
    desc:'ระบบ receiver ที่ใช้ CRSF (ExpressLRS/TBS), SBUS, DSM2 ฯลฯ ผิดพลาด → ไม่รับสัญญาณเลย',
    tip:'CRSF สำหรับ ExpressLRS/TBS Crossfire, SBUS สำหรับ Futaba/FrSky legacy',
    hiEffect:'ไม่รับสัญญาณ',
    loEffect:'—',
    related:['rc_smoothing_mode','failsafe_action'] },
  rc_smoothing_mode: { cat:'RC', risk:'low', safe:'AUTO', min:0, max:2, def:0,
    desc:'วิธีลด noise จาก RC signal — AUTO ปรับอัตโนมัติตาม RC input rate',
    tip:'AUTO แนะนำสำหรับ ELRS 250Hz+',
    hiEffect:'Smooth มากแต่ lag เพิ่ม',
    loEffect:'RC noise เข้า FF มาก',
    related:['rc_smoothing_setpoint_cutoff','feedforward_averaging'] },
  rc_smoothing_setpoint_cutoff: { cat:'RC', risk:'low', safe:'0', min:0, max:50, def:0,
    desc:'RC smoothing cutoff frequency (0 = auto) ตั้งค่าได้เองถ้าต้องการ manual control',
    tip:'0 (auto) ดีที่สุดสำหรับส่วนใหญ่',
    hiEffect:'Smooth มาก',
    loEffect:'Noisy',
    related:['rc_smoothing_mode'] },

  /* ── VTX ── */
  vtx_power:   { cat:'VTX', risk:'low', safe:'1–4', min:1, max:5, def:1,
    desc:'VTX power level — ระวัง: กฎหมายหลายประเทศจำกัด max power',
    tip:'ตรวจสอบกฎหมายท้องถิ่นก่อนเพิ่ม power',
    hiEffect:'อาจผิดกฎหมาย หรือรบกวน pilot อื่น',
    loEffect:'Range สั้นลง',
    related:['vtx_band','vtx_channel'] },
  vtx_band:    { cat:'VTX', risk:'low', safe:'A/B/E/F/R', min:0, max:5, def:0,
    desc:'VTX frequency band ต้องตรงกับ goggles',
    tip:'A/B band compatibility สูงสุด',
    hiEffect:'—',
    loEffect:'—',
    related:['vtx_channel','vtx_power'] },
  vtx_channel: { cat:'VTX', risk:'low', safe:'1–8', min:1, max:8, def:1,
    desc:'VTX channel ภายใน band ที่เลือก',
    tip:'เลือก channel ไม่ซ้อนกับ pilot อื่น',
    hiEffect:'—',
    loEffect:'—',
    related:['vtx_band'] },
};

/* ── Category colors ── */
const CC = {PID:'var(--green)',FILTER:'var(--blue)',MOTOR:'var(--amber)',RATES:'var(--purple)',SAFETY:'var(--red)',RC:'var(--teal)',VTX:'var(--pink)',OTHER:'var(--muted)'};

/* ── State ── */
let _data = null, _filter = 'ch', _cat = 'ALL', _q = '';

/* ── Utils ── */
const $ = id => document.getElementById(id);
function esc(s){ return String(s).replace(/&/g,'&amp;').replace(/</g,'&lt;').replace(/>/g,'&gt;').replace(/"/g,'&quot;') }
function toast(msg, dur=3200){
  const t=$('toast'); t.textContent=msg; t.classList.add('show');
  clearTimeout(t._t); t._t=setTimeout(()=>t.classList.remove('show'),dur);
}

/* ── Clear ── */
function clearAll(){
  $('taA').value=''; $('taB').value='';
  $('results').style.display='none'; _data=null;
}

/* ── Example ── */
function loadExample(){
  $('taA').value=`# Config A — 5" Freestyle before tuning
set p_roll = 48
set i_roll = 90
set d_roll = 38
set f_roll = 0
set p_pitch = 52
set i_pitch = 90
set d_pitch = 40
set f_pitch = 0
set p_yaw = 40
set i_yaw = 90
set gyro_lpf1_hz = 200
set gyro_lpf2_hz = 400
set dterm_lpf1_hz = 110
set dterm_lpf2_hz = 175
set dyn_notch_count = 2
set dyn_notch_min_hz = 100
set anti_gravity_gain = 5
set tpa_rate = 10
set tpa_breakpoint = 1450
set iterm_relax = RP
set motor_pwm_protocol = DSHOT600
set dshot_bidir = ON
set motor_poles = 14
set idle_percent = 5
set failsafe_delay = 4
set failsafe_action = DROP
set serialrx_provider = CRSF
set roll_rc_rate = 1.40
set roll_expo = 0.20
set roll_srate = 0.70`;

  $('taB').value=`# Config B — After RPM filter + FF tuning
set p_roll = 52
set i_roll = 90
set d_roll = 43
set f_roll = 35
set p_pitch = 56
set i_pitch = 90
set d_pitch = 46
set f_pitch = 40
set p_yaw = 38
set i_yaw = 85
set gyro_lpf1_hz = 185
set gyro_lpf2_hz = 370
set dterm_lpf1_hz = 105
set dterm_lpf2_hz = 165
set dyn_notch_count = 2
set dyn_notch_min_hz = 80
set anti_gravity_gain = 8
set tpa_rate = 12
set tpa_breakpoint = 1420
set iterm_relax = RP
set feedforward_averaging = 2_POINT
set rpm_filter_harmonics = 3
set rpm_filter_min_hz = 100
set motor_pwm_protocol = DSHOT600
set dshot_bidir = ON
set motor_poles = 14
set idle_percent = 5
set failsafe_delay = 4
set failsafe_action = DROP
set serialrx_provider = CRSF
set roll_rc_rate = 1.40
set roll_expo = 0.20
set roll_srate = 0.70`;
  toast('✅ โหลด Example แล้ว — กด วิเคราะห์ ได้เลย');
}

/* ── MAIN COMPARE ── */
async function doCompare(){
  const a=$('taA').value.trim(), b=$('taB').value.trim();
  if(!a||!b){ toast('⚠️ กรุณาวาง Config ทั้ง 2 ชุดก่อน'); return }
  $('loading').style.display='block';
  $('results').style.display='none';
  /* FIX: read CSRF from meta tag (consistent with blackbox.html / cli_surgeon.html)
     fallback to cookie for compatibility */
  const csrf = document.querySelector('meta[name="csrf-token"]')?.content ||
               (document.cookie.match(/csrf_token=([^;]+)/)||[])[1] || '';
  try{
    const res=await fetch('/compare_cli',{
      method:'POST',
      headers:{'Content-Type':'application/json','X-CSRFToken':csrf},
      body:JSON.stringify({dump_a:a,dump_b:b})
    });
    if(res.status===429){toast('⚠️ คำขอมากเกินไป กรุณารอ 1 นาที');return}
    const d=await res.json();
    if(d.error){toast('❌ '+d.error);return}
    _data=d; renderAll(d);
  }catch(e){ toast('❌ Error: '+e.message) }
  finally{ $('loading').style.display='none' }
}

/* ── RENDER ALL ── */
function renderAll(d){
  renderSummary(d);
  renderRisk(d);
  renderProfile(d);
  renderSymptoms(d);
  renderSafetyAlerts(d);
  renderAI(d);
  renderBadges(d);
  renderCatPills(d);
  renderTables(d);
  renderPatch(d);
  renderStats(d);
  $('results').style.display='block';
  $('results').scrollIntoView({behavior:'smooth',block:'start'});
  setFilter('ch', document.querySelector('.fbtn[data-f="ch"]'));
}

/* ── SUMMARY ── */
function renderSummary(d){
  $('cntCh').textContent=d.changed.length;
  $('cntA').textContent=d.only_in_a.length;
  $('cntB').textContent=d.only_in_b.length;
  $('cntSm').textContent=d.same.length;
}

/* ── RISK ── */
function renderRisk(d){
  let sc=0;
  const cats={PID:0,FILTER:0,MOTOR:0,SAFETY:0,RATES:0,RC:0,VTX:0,OTHER:0};
  const all=[...d.changed.map(r=>r[0]),...d.only_in_b.map(r=>r[0])];
  all.forEach(k=>{
    const kb=KB[k]||{cat:'OTHER',risk:'low'};
    cats[kb.cat]=(cats[kb.cat]||0)+1;
    sc+=kb.risk==='high'?20:kb.risk==='medium'?10:3;
  });
  sc=Math.min(100,sc);
  const col=sc<25?'var(--green)':sc<50?'var(--teal)':sc<70?'var(--amber)':'var(--red)';
  const grade=sc<15?'MINIMAL':sc<30?'LOW':sc<55?'MODERATE':sc<75?'HIGH':'CRITICAL';
  const desc=sc<15?'ความแตกต่างเล็กน้อยมาก ปลอดภัยสูง ทดสอบ hover ก่อนบินเต็ม':
    sc<30?'มีการเปลี่ยนแปลงเล็กน้อย แนะนำ hover test และตรวจ motor temp':
    sc<55?'การเปลี่ยนแปลงหลายจุด แนะนำ hover test ในที่โล่ง ตรวจ motor temp':
    sc<75?'การเปลี่ยนแปลงหลายจุดรวม motor/safety ตรวจสอบทุกค่าอย่างละเอียดก่อนบิน':
    '⚠️ การเปลี่ยนแปลงความเสี่ยงสูง ตรวจสอบ SAFETY parameters ทุกค่า ทำ bench test ก่อน arm';

  $('riskNum').textContent=sc; $('riskNum').style.color=col;
  $('riskGrade').textContent=grade; $('riskGrade').style.color=col;
  $('riskDesc').textContent=desc;
  const C=194.8;
  $('riskArc').style.strokeDashoffset=C-(sc/100*C);
  $('riskArc').style.stroke=col;

  $('riskBars').innerHTML=['PID','FILTER','MOTOR','SAFETY'].map(cat=>{
    const v=cats[cat]||0, p=Math.min(100,v*30);
    return`<div class="rbar-row"><span class="rbar-lbl">${cat}</span><div class="rbar-track"><div class="rbar-fill" style="width:${p}%;background:${CC[cat]}"></div></div><span class="rbar-n">${v}</span></div>`;
  }).join('');
}

/* ── FLIGHT PROFILE ── */
function renderProfile(d){
  const get=(k,src)=>{
    const r=(src||[...d.changed.map(r=>({k:r[0],v:r[2]})),...d.only_in_b.map(r=>({k:r[0],v:r[1]})),...d.same.map(r=>({k:r[0],v:r[1]}))]).find(x=>x.k===k);
    return r?parseFloat(r.v)||0:null;
  };
  const allParams=[...d.changed.map(r=>({k:r[0],v:r[2]})),...d.only_in_b.map(r=>({k:r[0],v:r[1]})),...d.same.map(r=>({k:r[0],v:r[1]}))];
  const gp=(k)=>{const r=allParams.find(x=>x.k===k);return r?parseFloat(r.v)||0:null};

  const proll=gp('p_roll')||48, droll=gp('d_roll')||38;
  const froll=gp('f_roll')||gp('feedforward_roll')||0;
  const rcrate=gp('roll_rc_rate')||1.4;
  const gyrolpf=gp('gyro_lpf1_hz')||200;
  const tpa=gp('tpa_rate')||10;

  // Scoring: race=high PID+FF+rates, freestyle=mid PID, cinematic=low PID+low FF+low rates
  let raceScore=0, freestyleScore=0, cinematicScore=0, proximityScore=0;
  if(proll>=52) raceScore+=25; else if(proll<=44) cinematicScore+=20;
  if(droll>=40) raceScore+=15; else if(droll<=30) cinematicScore+=15;
  if(froll>=40) raceScore+=20; else if(froll>=20) freestyleScore+=20; else cinematicScore+=20;
  if(rcrate>=1.8) raceScore+=25; else if(rcrate>=1.3) freestyleScore+=25; else cinematicScore+=30;
  if(gyrolpf<=180) raceScore+=15; else if(gyrolpf>=220) cinematicScore+=10;
  if(tpa>=18) raceScore+=10;

  // Proximity: high P, high D, moderate FF, low rates
  if(proll>=50 && droll>=40 && rcrate<=1.5) proximityScore=40;

  const scores={Racing:raceScore,Freestyle:freestyleScore,Cinematic:cinematicScore,Proximity:proximityScore};
  const top=Object.entries(scores).sort((a,b)=>b[1]-a[1])[0];
  const profiles={
    Racing:{icon:'🏎️',color:'var(--red)',sub:'ค่า PID เข้มข้น Feedforward สูง อัตรา roll เร็ว มุ่งเน้นความเร็วและ precision'},
    Freestyle:{icon:'🎭',color:'var(--green)',sub:'สมดุล PID moderate FF รู้สึก snappy แต่ไม่แข็งกระด้าง'},
    Cinematic:{icon:'🎬',color:'var(--blue)',sub:'PID นุ่ม FF ต่ำ อัตรา roll ช้า เน้นความ smooth ของภาพ'},
    Proximity:{icon:'🌿',color:'var(--teal)',sub:'PID แน่นเพื่อ precision FF ปานกลาง rates ต่ำเพื่อ control'}
  };
  const p=profiles[top[0]];

  $('profileIcon').textContent=p.icon;
  $('profileIcon').style.color=p.color;
  $('profileName').textContent=top[0]+' CONFIG';
  $('profileName').style.color=p.color;
  $('profileSub').textContent=p.sub;

  const total=Math.max(1,Object.values(scores).reduce((a,b)=>a+b,0));
  $('profileBars').innerHTML=Object.entries(scores).map(([name,sc])=>{
    const pct=Math.round(sc/total*100);
    return`<div class="pb-row"><span class="pb-lbl">${name}</span><div class="pb-track"><div class="pb-fill" style="width:${pct}%;background:${profiles[name].color}"></div></div><span style="font-family:var(--font-m);font-size:9px;color:var(--muted);width:28px;text-align:right">${pct}%</span></div>`;
  }).join('');
}

/* ── SYMPTOMS ── */
function renderSymptoms(d){
  const changed=d.changed.map(r=>r[0]);
  const inB=d.only_in_b.map(r=>r[0]);
  const all=[...changed,...inB];
  const get=(k)=>{
    const ch=d.changed.find(r=>r[0]===k);if(ch)return{va:parseFloat(ch[1]),vb:parseFloat(ch[2])};
    const ob=d.only_in_b.find(r=>r[0]===k);if(ob)return{va:null,vb:parseFloat(ob[1])};
    const sm=d.same.find(r=>r[0]===k);if(sm)return{va:parseFloat(sm[1]),vb:parseFloat(sm[1])};
    return null;
  };
  const syms=[];

  // PID changes
  const prollDiff=d.changed.find(r=>r[0]==='p_roll');
  if(prollDiff&&parseFloat(prollDiff[2])>parseFloat(prollDiff[1])+5) syms.push({type:'warn',icon:'⚠️',text:'P term เพิ่มสูงขึ้นมาก ตรวจ motor temp หลังบินครั้งแรก'});
  const drollDiff=d.changed.find(r=>r[0]==='d_roll'||r[0]==='d_pitch');
  if(drollDiff&&parseFloat(drollDiff[2])>parseFloat(drollDiff[1])+5) syms.push({type:'warn',icon:'🌡️',text:'D term เพิ่มสูง motor อาจร้อนขึ้น ดู motor temp ก่อนบินนาน'});

  // FF added
  const ffAdded=all.some(k=>k.startsWith('f_')||k.startsWith('feedforward'));
  if(ffAdded) syms.push({type:'good',icon:'⚡',text:'เพิ่ม Feedforward — stick จะรู้สึก direct และ responsive มากขึ้น'});

  // RPM filter
  const rpmAdded=all.some(k=>k.includes('rpm_filter')||k==='dshot_bidir');
  if(rpmAdded) syms.push({type:'good',icon:'🔄',text:'RPM Filter config เปลี่ยน — motor noise จะสะอาดขึ้นถ้า ESC รองรับ'});

  // Filter cutoff lowered
  const gyroLpf=d.changed.find(r=>r[0]==='gyro_lpf1_hz');
  if(gyroLpf&&parseFloat(gyroLpf[2])<parseFloat(gyroLpf[1])) syms.push({type:'good',icon:'🔊',text:'Gyro LPF ลดลง — response เร็วขึ้น แต่ noise อาจเข้ามากขึ้นถ้าไม่มี RPM filter'});

  // Anti-gravity increased
  const ag=d.changed.find(r=>r[0]==='anti_gravity_gain');
  if(ag&&parseFloat(ag[2])>parseFloat(ag[1])) syms.push({type:'good',icon:'🏋️',text:'Anti-gravity เพิ่ม — nose drop ตอน throttle punch จะดีขึ้น'});

  // Safety changes
  const safetyChanged=all.some(k=>KB[k]?.cat==='SAFETY');
  if(safetyChanged) syms.push({type:'bad',icon:'🛡️',text:'Safety parameter เปลี่ยน — ตรวจสอบ failsafe ทำงานถูกต้องก่อนบิน'});

  // Motor changed
  const motorChanged=all.some(k=>['motor_pwm_protocol','dshot_bidir','motor_poles'].includes(k));
  if(motorChanged) syms.push({type:'bad',icon:'⚙️',text:'Motor/ESC protocol เปลี่ยน — ทำ motor test บน bench ก่อน arm ครั้งแรก'});

  if(syms.length===0) syms.push({type:'good',icon:'✅',text:'ไม่พบ symptom ที่น่าเป็นห่วง Config B ดูปลอดภัย'});

  $('symptomList').innerHTML=syms.map(s=>`<div class="symptom-item ${s.type}"><span class="symptom-icon">${s.icon}</span><span>${esc(s.text)}</span></div>`).join('');
}

/* ── SAFETY ALERTS ── */
function renderSafetyAlerts(d){
  const alerts=[];
  const allKeys=[...d.changed.map(r=>r[0]),...d.only_in_b.map(r=>r[0])];

  // Check dshot_bidir ON but motor_poles missing/wrong
  const bidir=[...d.changed,...d.only_in_b,...d.same].find(r=>r[0]==='dshot_bidir'&&String(r[r.length>2?2:1]).toUpperCase()==='ON');
  if(bidir){
    alerts.push({level:'crit',icon:'⚠️',title:'DSHOT BIDIR ON — ต้องตรวจ ESC Firmware',body:'Bidirectional DSHOT ต้องการ ESC firmware ที่รองรับ (BLHeli_32, AM32, Bluejay) ถ้า ESC ไม่รองรับ motor จะ desync ทันที ตรวจสอบ ESC firmware version ก่อน arm'});
  }

  // High D term
  const droll=[...d.changed,...d.only_in_b,...d.same].find(r=>r[0]==='d_roll');
  if(droll&&parseFloat(droll[droll.length>2?2:1])>=55){
    alerts.push({level:'warn',icon:'🌡️',title:'D TERM สูงมาก — ความเสี่ยง motor ร้อน',body:`D Roll = ${droll[droll.length>2?2:1]} ค่านี้สูงมาก ตรวจสอบ motor temp หลังบิน 2–3 นาที ถ้าร้อนกว่า 65°C ให้ลด D หรือเพิ่ม filter`});
  }

  // Failsafe delay very low
  const fsDelay=[...d.changed,...d.only_in_b,...d.same].find(r=>r[0]==='failsafe_delay');
  if(fsDelay&&parseFloat(fsDelay[fsDelay.length>2?2:1])<3){
    alerts.push({level:'crit',icon:'🛡️',title:'FAILSAFE_DELAY ต่ำเกินไป',body:`ค่า ${fsDelay[fsDelay.length>2?2:1]} (${parseFloat(fsDelay[fsDelay.length>2?2:1])*0.1} วินาที) อาจทำให้ failsafe trigger จาก RF interference ชั่วคราว แนะนำตั้ง 4–6`});
  }

  // motor_stop ON warning
  const mstop=[...d.changed,...d.only_in_b,...d.same].find(r=>r[0]==='motor_stop'&&String(r[r.length>2?2:1]).toUpperCase()==='ON');
  if(mstop){
    alerts.push({level:'warn',icon:'⚙️',title:'MOTOR_STOP = ON — ระวัง',body:'Motor หยุดสนิทตอน throttle 0 ถ้า re-arm กลางอากาศ motor จะ spin กะทันหัน แนะนำตั้ง OFF'});
  }

  // Info: RPM filter requires bidir
  const hasRpm=allKeys.some(k=>k.includes('rpm_filter'));
  const hasBidir=[...d.changed,...d.only_in_b,...d.same].find(r=>r[0]==='dshot_bidir');
  if(hasRpm&&hasBidir&&String(hasBidir[hasBidir.length>2?2:1]).toUpperCase()!=='ON'){
    alerts.push({level:'warn',icon:'🔄',title:'RPM Filter ต้องการ DSHOT BIDIR ON',body:'Config B มีการตั้งค่า rpm_filter แต่ dshot_bidir ดูเหมือนจะไม่ใช่ ON ตรวจสอบ bidir setting ด้วย'});
  }

  const el=$('safetyAlerts');
  if(alerts.length===0){el.innerHTML='';return}
  el.innerHTML=`<div style="font-family:var(--font-d);font-size:9px;letter-spacing:.18em;color:var(--red);margin-bottom:10px">🛡️ SAFETY ALERTS — ต้องอ่านก่อน arm</div>`+
    alerts.map(a=>`<div class="alert-item ${a.level}"><span class="alert-icon">${a.icon}</span><div><div class="alert-title ${a.level}">${esc(a.title)}</div><div class="alert-body">${esc(a.body)}</div></div></div>`).join('');
}

/* ── AI SUMMARY ── */
function renderAI(d){
  const all=[...d.changed.map(r=>r[0]),...d.only_in_b.map(r=>r[0])];
  const pidN=all.filter(k=>KB[k]?.cat==='PID').length;
  const filtN=all.filter(k=>KB[k]?.cat==='FILTER').length;
  const motorN=all.filter(k=>KB[k]?.cat==='MOTOR').length;
  const safeN=all.filter(k=>KB[k]?.cat==='SAFETY').length;
  const hasFf=all.some(k=>k.startsWith('f_')||k.startsWith('feedforward'));
  const hasPup=d.changed.some(r=>{if(!['p_roll','p_pitch','d_roll','d_pitch'].includes(r[0]))return false;try{return parseFloat(r[2])>parseFloat(r[1])+3}catch{return false}});

  const ins=[];
  if(pidN>0) ins.push(`PID เปลี่ยน ${pidN} ค่า`);
  if(filtN>0) ins.push(`Filter ปรับ ${filtN} จุด`);
  if(motorN>0) ins.push(`Motor/ESC เปลี่ยน ${motorN} ค่า ⚠️`);
  if(safeN>0)  ins.push(`Safety เปลี่ยน ${safeN} ค่า 🛡️`);
  if(hasFf)    ins.push('เพิ่ม Feedforward');
  if(hasPup)   ins.push('P/D สูงขึ้น ตรวจ motor temp');

  let txt=d.changed.length===0&&d.only_in_b.length===0&&d.only_in_a.length===0
    ?'✅ Config A และ B เหมือนกันทุกค่า ไม่มีความแตกต่าง'
    :`Config B แตกต่างจาก A ใน <strong>${d.changed.length}</strong> ค่า${d.only_in_b.length?` + เพิ่มใหม่ ${d.only_in_b.length} ตัว`:''}${d.only_in_a.length?` (A มีค่าที่ B ไม่มี ${d.only_in_a.length} ตัว)`:''}. ${ins.length?'ประเด็นสำคัญ: '+ins.join(' · ')+'.'	:''}`;
  if(motorN>0||safeN>0) txt+=` <strong style="color:var(--red)">⚠️ ตรวจสอบ Motor/Safety parameters ก่อน arm</strong>`;
  $('aiText').innerHTML=txt;

  const tags=[];
  if(safeN===0) tags.push({c:'g',t:'✅ Safety ปกติ'}); else tags.push({c:'r',t:'⚠️ Safety เปลี่ยน'});
  if(pidN>0)    tags.push({c:'w',t:`🎛️ PID ×${pidN}`});
  if(filtN>0)   tags.push({c:'b',t:`🔊 Filter ×${filtN}`});
  if(hasFf)     tags.push({c:'g',t:'⚡ FF เพิ่ม'});
  if(motorN>0)  tags.push({c:'w',t:`⚙️ Motor ×${motorN}`});
  $('aiTags').innerHTML=tags.map(t=>`<span class="atag ${t.c}">${t.t}</span>`).join('');
}

/* ── BADGES ── */
function renderBadges(d){
  [['ch',d.changed.length],['oa',d.only_in_a.length],['ob',d.only_in_b.length],['sm',d.same.length]]
    .forEach(([k,n])=>{ $('fb-'+k).textContent=n; });
  [['scCh',d.changed.length],['scOA',d.only_in_a.length],['scOB',d.only_in_b.length],['scSm',d.same.length]]
    .forEach(([k,n])=>$( k).textContent=n);
}

/* ── CAT PILLS ── */
function renderCatPills(d){
  const all=[...d.changed.map(r=>r[0]),...d.only_in_a.map(r=>r[0]),...d.only_in_b.map(r=>r[0])];
  const counts={};
  all.forEach(k=>{ const c=(KB[k]||{cat:'OTHER'}).cat; counts[c]=(counts[c]||0)+1 });
  const cats=['PID','FILTER','MOTOR','RATES','SAFETY','RC','VTX','OTHER'].filter(c=>counts[c]);
  $('catPills').innerHTML=
    `<button class="cpill act" data-cat="ALL" onclick="setCat('ALL',this)">ทั้งหมด</button>`+
    cats.map(c=>`<button class="cpill" data-cat="${c}" onclick="setCat('${c}',this)">${c} <span style="font-size:8px;opacity:.65">${counts[c]}</span></button>`).join('');
}

/* ── HELPERS ── */
const getKB=k=>KB[k]||{cat:'OTHER',risk:'low',safe:'—',desc:'Configuration parameter',tip:'',hiEffect:'—',loEffect:'—',related:[]};
function catBadge(k){ const kb=getKB(k);return`<span class="ccat ${kb.cat}">${kb.cat}</span>` }
function riskDot(k){ const kb=getKB(k);return`<span class="rdot ${kb.risk}"></span>` }

function buildVBar(va,vb,kb){
  const mn=kb.min||0, mx=kb.max||100;
  const pA=Math.round(Math.max(0,Math.min(100,(va-mn)/(mx-mn)*100)));
  const pB=Math.round(Math.max(0,Math.min(100,(vb-mn)/(mx-mn)*100)));
  return`<div class="vbar-wrap">
    <div class="vbar-both">
      <div class="vbar-both-track"><div class="vbar-a" style="width:${pA}%"></div></div>
      <div class="vbar-both-track"><div class="vbar-b" style="width:${pB}%"></div></div>
    </div>
    <span style="font-family:var(--font-m);font-size:8px;color:var(--muted);width:40px">${pA}%→${pB}%</span>
  </div>`;
}

function buildChangedRow(row){
  const[key,va,vb]=row; const kb=getKB(key);
  let arrow='',ac='',dpHtml='';
  try{
    const na=parseFloat(va),nb=parseFloat(vb);
    if(!isNaN(na)&&!isNaN(nb)&&na!==0){
      const diff=nb-na; arrow=diff>0?'↑':'↓'; ac=diff>0?'arr-up':'arr-down';
      const pct=Math.round(Math.abs(diff/na*100));
      dpHtml=`<span class="dpct ${diff>0?'up':'dn'}">${diff>0?'+':''}${diff.toFixed(0)} (${pct}%)</span>`;
    }
  }catch{}
  const barHtml=(!isNaN(parseFloat(va))&&kb.max)?buildVBar(parseFloat(va),parseFloat(vb),kb):'';
  return`<tr data-key="${esc(key)}" data-cat="${kb.cat}" onclick="showParamGuide('${esc(key)}')">
    <td><span class="ckey">${esc(key)}</span>${catBadge(key)}</td>
    <td><span class="val-a">${esc(String(va))}</span></td>
    <td>
      ${arrow?`<span class="${ac}">${arrow}</span> `:''}
      <span class="val-b">${esc(String(vb))}</span>${dpHtml}
      ${barHtml}
    </td>
    <td>
      ${riskDot(key)}
      <span class="cell-exp">${esc(kb.desc.split('—')[0].trim().substring(0,55))}…</span>
      <span class="exp-more" onclick="event.stopPropagation();openParamModal('${esc(key)}')">รายละเอียด</span>
    </td>
  </tr>`;
}

function buildSingleRow(row,side){
  const[key,val]=row; const kb=getKB(key);
  const vc=side==='a'?'val-a':'val-b';
  return`<tr data-key="${esc(key)}" data-cat="${kb.cat}" onclick="openParamModal('${esc(key)}')">
    <td><span class="ckey">${esc(key)}</span>${catBadge(key)}</td>
    <td><span class="${vc}">${esc(String(val))}</span></td>
    <td><span class="cell-exp">${esc(kb.desc.split('—')[0].trim().substring(0,70))}</span></td>
  </tr>`;
}

function buildSameRow(row){
  const[key,val]=row; const kb=getKB(key);
  return`<tr data-key="${esc(key)}" data-cat="${kb.cat}" onclick="openParamModal('${esc(key)}')">
    <td><span class="ckey" style="color:var(--muted)">${esc(key)}</span>${catBadge(key)}</td>
    <td><span class="val-s">${esc(String(val))}</span></td>
    <td><span class="cell-exp">${esc(kb.desc.split('—')[0].trim().substring(0,70))}</span></td>
  </tr>`;
}

/* ── RENDER TABLES ── */
function renderTables(d){
  const ok=row=>{
    if(_cat!=='ALL'&&(KB[row[0]]||{cat:'OTHER'}).cat!==_cat) return false;
    if(!_q) return true;
    return row[0].toLowerCase().includes(_q)||(KB[row[0]]?.desc||'').toLowerCase().includes(_q);
  };
  const empty=(cols,msg)=>`<tr><td colspan="${cols}" style="text-align:center;padding:28px;color:var(--muted)">${msg}</td></tr>`;

  const ch=d.changed.filter(ok);
  $('tbCh').innerHTML=ch.length?ch.map(r=>buildChangedRow(r)).join(''):empty(4,'ไม่มีค่าที่เปลี่ยน (หรือถูก filter ออก)');
  const oa=d.only_in_a.filter(ok);
  $('tbOA').innerHTML=oa.length?oa.map(r=>buildSingleRow(r,'a')).join(''):empty(3,'ไม่มี');
  const ob=d.only_in_b.filter(ok);
  $('tbOB').innerHTML=ob.length?ob.map(r=>buildSingleRow(r,'b')).join(''):empty(3,'ไม่มี');
  const sm=d.same.filter(ok);
  $('tbSm').innerHTML=sm.length?sm.map(r=>buildSameRow(r)).join(''):empty(3,'ไม่มี');
}

/* ── PARAM GUIDE (sidebar) ── */
function showParamGuide(key){
  const kb=getKB(key);
  const pg=$('paramGuide'); pg.style.display='block';
  const ch=_data?.changed.find(r=>r[0]===key);
  let html=`<div class="pg-name">${esc(key)}</div>
    <span class="ccat ${kb.cat}" style="margin-bottom:10px;display:inline-block">${kb.cat}</span>
    <div class="pg-desc">${esc(kb.desc)}</div>
    ${kb.tip?`<div class="pg-tip">💡 <strong>Tip:</strong> ${esc(kb.tip)}</div>`:''}
    <div class="pg-ranges">
      <span class="pg-range-item safe">✅ ${esc(kb.safe||'—')}</span>
      <span class="pg-range-item" style="background:rgba(255,51,68,.06);color:var(--red)">⚠️ ${esc(kb.risk||'low')}</span>
    </div>`;
  if(ch) html+=`<div class="pg-vals">
    <div class="pg-val a">A: <span class="val-a">${esc(String(ch[1]))}</span></div>
    <div class="pg-val b">B: <span class="val-b">${esc(String(ch[2]))}</span></div>
  </div>`;
  html+=`<div style="margin-top:12px"><a class="exp-more" style="font-size:12px" onclick="openParamModal('${esc(key)}')">📖 คู่มือเต็ม + Effects →</a></div>`;
  $('pgBody').innerHTML=html;
  if(window.innerWidth<1100) pg.scrollIntoView({behavior:'smooth',block:'nearest'});
}

/* ── PARAM DETAIL MODAL ── */
function openParamModal(key){
  const kb=getKB(key);
  const ch=_data?.changed.find(r=>r[0]===key);
  const va=ch?ch[1]:(_data?.same.find(r=>r[0]===key)||[])[1];
  const vb=ch?ch[2]:va;
  $('paramModalTitle').textContent=key+' — '+kb.cat;

  let rangeBar='';
  if(kb.min!==undefined&&kb.max!==undefined&&!isNaN(parseFloat(vb))){
    const mn=kb.min,mx=kb.max,def=kb.def||mn;
    const safeStr=kb.safe||'';
    const safeMatch=safeStr.match(/([\d.]+)\s*[–-]\s*([\d.]+)/);
    const slo=safeMatch?parseFloat(safeMatch[1]):mn;
    const shi=safeMatch?parseFloat(safeMatch[2]):mx;
    const pLo=Math.max(0,Math.min(100,(slo-mn)/(mx-mn)*100));
    const pHi=Math.max(0,Math.min(100,(shi-mn)/(mx-mn)*100));
    const pA=ch?Math.max(0,Math.min(100,(parseFloat(ch[1])-mn)/(mx-mn)*100)):null;
    const pB=!isNaN(parseFloat(vb))?Math.max(0,Math.min(100,(parseFloat(vb)-mn)/(mx-mn)*100)):null;
    rangeBar=`<div class="pmg-range-bar">
      <div style="font-family:var(--font-d);font-size:8px;color:var(--muted);letter-spacing:.1em;margin-bottom:6px">RANGE VISUALIZATION</div>
      <div class="prb-track">
        <div class="prb-safe" style="left:${pLo}%;width:${pHi-pLo}%"></div>
        ${pA!==null?`<div class="prb-marker" style="left:${pA}%;background:var(--red)" title="Config A: ${ch[1]}"></div>`:''}
        ${pB!==null?`<div class="prb-marker" style="left:${pB}%;background:var(--green)" title="Config B: ${vb}"></div>`:''}
      </div>
      <div class="prb-labels"><span>${mn}</span><span style="color:var(--green)">Safe: ${esc(kb.safe||'—')}</span><span>${mx}</span></div>
    </div>`;
  }

  const relHtml=kb.related&&kb.related.length
    ?`<div><div style="font-family:var(--font-d);font-size:8px;color:var(--muted);letter-spacing:.1em;margin-bottom:6px">RELATED PARAMETERS</div><div class="related-params">${kb.related.map(k=>`<span class="rp-tag" onclick="closeParam();setTimeout(()=>openParamModal('${k}'),80)">${k}</span>`).join('')}</div></div>`:'';

  $('paramModalContent').innerHTML=`
    <div class="param-modal-header">
      <div class="param-modal-name">${esc(key)}</div>
      <span class="ccat ${kb.cat} param-modal-cat">${kb.cat}</span>
      ${ch?`<div style="display:flex;gap:8px;margin-top:8px"><div class="pg-val a" style="padding:6px 12px">Config A: <span class="val-a">${esc(String(ch[1]))}</span></div><div class="pg-val b" style="padding:6px 12px">Config B: <span class="val-b">${esc(String(ch[2]))}</span></div></div>`:''}
    </div>
    <div class="param-modal-grid">
      <div class="pmg-section">
        <h4>📋 DESCRIPTION</h4>
        <p>${esc(kb.desc)}</p>
        ${kb.tip?`<div class="pg-tip">💡 <strong>Tuning Tip:</strong> ${esc(kb.tip)}</div>`:''}
        <div class="pg-ranges" style="margin-top:10px">
          <span class="pg-range-item safe">✅ Safe: ${esc(kb.safe||'—')}</span>
          <span class="pg-range-item danger">⚠️ Risk: ${esc(kb.risk)}</span>
        </div>
        ${rangeBar}
      </div>
      <div class="pmg-section">
        <h4>📊 EFFECTS</h4>
        <div class="effects-grid">
          <div class="effect-box hi">
            <div class="effect-hd hi">↑ ค่าสูงเกินไป</div>
            ${esc(kb.hiEffect||'—')}
          </div>
          <div class="effect-box lo">
            <div class="effect-hd lo">↓ ค่าต่ำเกินไป</div>
            ${esc(kb.loEffect||'—')}
          </div>
        </div>
        ${relHtml}
      </div>
    </div>`;
  $('paramModal').style.display='block';
  document.body.style.overflow='hidden';
}
function closeParam(){ $('paramModal').style.display='none'; document.body.style.overflow='' }

/* ── PATCH ── */
function renderPatch(d){
  const lines=[
    '# ════════════════════════════════════════════',
    '# PATCH CLI: Config A → Config B',
    '# สร้างโดย OBIXConfig Doctor v5.2',
    '# วาง paste ใน Betaflight CLI แล้วพิมพ์ save',
    '# ════════════════════════════════════════════',''
  ];
  const byCat={};
  d.changed.forEach(r=>{ const c=(KB[r[0]]||{cat:'OTHER'}).cat; if(!byCat[c])byCat[c]=[];byCat[c].push(r) });
  d.only_in_b.forEach(r=>{ const c=(KB[r[0]]||{cat:'OTHER'}).cat; if(!byCat[c])byCat[c]=[];byCat[c].push([r[0],null,r[1],'']) });
  Object.entries(byCat).forEach(([cat,rows])=>{
    lines.push(`# ── ${cat} ─────────────────────────────`);
    rows.forEach(r=>{ if(r[1]!==null)lines.push(`# A: ${r[0]} = ${r[1]}`); lines.push(`set ${r[0]} = ${r[2]}`) });
    lines.push('');
  });
  lines.push('save','');
  if(d.only_in_a.length){ lines.push('# ── เฉพาะใน A (reset to default หรือตรวจสอบ) ──'); d.only_in_a.forEach(r=>lines.push(`# [A only] ${r[0]} = ${r[1]}`)) }

  $('patchCode').innerHTML=lines.map(l=>{
    if(l.startsWith('# ═')||l==='save') return`<span class="pl-sec">${esc(l)}</span>`;
    if(l.startsWith('# A:')||l.startsWith('# [')) return`<span class="pl-rem">${esc(l)}</span>`;
    if(l.startsWith('#')) return`<span class="pl-cmt">${esc(l)}</span>`;
    if(l.startsWith('set ')) return`<span class="pl-add">${esc(l)}</span>`;
    return esc(l);
  }).join('\n');

  const raw=lines.join('\n');
  const blob=new Blob([raw],{type:'text/plain'});
  $('dlPatch').href=URL.createObjectURL(blob);
}

function copyPatch(){
  navigator.clipboard.writeText($('patchCode').textContent).then(()=>toast('✅ Copy Patch CLI แล้ว — paste ใน Betaflight ได้เลย'));
}

/* ── STATS ── */
function renderStats(d){
  const all=[...d.changed.map(r=>r[0]),...d.only_in_a.map(r=>r[0]),...d.only_in_b.map(r=>r[0])];
  const counts={};
  all.forEach(k=>{ const c=(KB[k]||{cat:'OTHER'}).cat; counts[c]=(counts[c]||0)+1 });
  $('statsBody').innerHTML=Object.entries(counts).sort((a,b)=>b[1]-a[1]).map(([cat,n])=>`
    <div class="srow">
      <span class="srow-lbl" style="color:${CC[cat]||'var(--muted)'}">${cat}</span>
      <span class="srow-val">${n} ค่า</span>
    </div>`).join('')||'<div style="color:var(--muted);font-size:12px">ไม่มีการเปลี่ยนแปลง</div>';
}

/* ── FILTER ── */
function setFilter(f,btn){
  _filter=f;
  document.querySelectorAll('.fbtn').forEach(b=>b.classList.remove('act'));
  if(btn)btn.classList.add('act');
  const show={ch:['secCh'],oa:['secOA'],ob:['secOB'],sm:['secSm'],al:['secCh','secOA','secOB','secSm']}[f]||['secCh'];
  ['secCh','secOA','secOB','secSm'].forEach(id=>$(id)?.classList.toggle('hidden',!show.includes(id)));
}

function setCat(cat,btn){
  _cat=cat;
  document.querySelectorAll('.cpill').forEach(p=>p.classList.remove('act'));
  if(btn)btn.classList.add('act');
  if(_data)renderTables(_data);
}

function onSearch(v){ _q=v.toLowerCase(); if(_data)renderTables(_data) }

/* ── LEARN MODALS ── */
const LEARN_CONTENT = {
  pid:{title:'🎛️ PID FUNDAMENTALS — คู่มือฉบับสมบูรณ์',body:`
<h3 style="color:var(--green);font-family:var(--font-d);font-size:13px;margin-bottom:14px">P · I · D คืออะไร?</h3>
<p>PID Controller คือ algorithm หลักที่ควบคุม motor ให้โดรนทำตาม stick input อย่างแม่นยำ แบ่งเป็น 3 component:</p>

<div style="display:grid;grid-template-columns:1fr 1fr 1fr;gap:12px;margin:16px 0">
  <div style="background:rgba(0,255,136,.07);border:1px solid rgba(0,255,136,.2);border-radius:8px;padding:14px;text-align:center">
    <div style="font-family:var(--font-d);font-size:18px;font-weight:900;color:var(--green);margin-bottom:6px">P</div>
    <div style="font-family:var(--font-d);font-size:9px;color:var(--green);margin-bottom:8px">PROPORTIONAL</div>
    <div style="font-size:12px;color:var(--text2);line-height:1.6">ตอบสนองต่อ error ปัจจุบัน ยิ่งสูง = ยิ่งไว</div>
  </div>
  <div style="background:rgba(0,170,255,.07);border:1px solid rgba(0,170,255,.2);border-radius:8px;padding:14px;text-align:center">
    <div style="font-family:var(--font-d);font-size:18px;font-weight:900;color:var(--blue);margin-bottom:6px">I</div>
    <div style="font-family:var(--font-d);font-size:9px;color:var(--blue);margin-bottom:8px">INTEGRAL</div>
    <div style="font-size:12px;color:var(--text2);line-height:1.6">สะสม error แก้ drift ระยะยาว ต้านลม</div>
  </div>
  <div style="background:rgba(255,187,0,.07);border:1px solid rgba(255,187,0,.2);border-radius:8px;padding:14px;text-align:center">
    <div style="font-family:var(--font-d);font-size:18px;font-weight:900;color:var(--amber);margin-bottom:6px">D</div>
    <div style="font-family:var(--font-d);font-size:9px;color:var(--amber);margin-bottom:8px">DERIVATIVE</div>
    <div style="font-size:12px;color:var(--text2);line-height:1.6">คาดการณ์ dampen oscillation ป้องกัน overshoot</div>
  </div>
</div>

<h4 style="font-family:var(--font-d);font-size:10px;letter-spacing:.14em;color:var(--muted);margin:18px 0 10px">อาการจากค่าที่ผิดปกติ</h4>
<div style="display:grid;grid-template-columns:1fr 1fr;gap:8px;margin-bottom:16px">
  <div style="background:rgba(255,51,68,.06);border:1px solid rgba(255,51,68,.15);border-radius:7px;padding:12px">
    <div style="font-family:var(--font-d);font-size:8px;color:var(--red);margin-bottom:6px">P สูงเกินไป</div>
    <div style="font-size:12px;color:var(--text2);line-height:1.6">High-freq oscillation หรือ buzz ในภาพ FPV, motor ร้อน, เสียงดัง</div>
  </div>
  <div style="background:rgba(0,170,255,.06);border:1px solid rgba(0,170,255,.15);border-radius:7px;padding:12px">
    <div style="font-family:var(--font-d);font-size:8px;color:var(--blue);margin-bottom:6px">P ต่ำเกินไป</div>
    <div style="font-size:12px;color:var(--text2);line-height:1.6">Stick mushy/sluggish, โดรนไม่ตอบสนอง, attitude lock แย่</div>
  </div>
  <div style="background:rgba(255,51,68,.06);border:1px solid rgba(255,51,68,.15);border-radius:7px;padding:12px">
    <div style="font-family:var(--font-d);font-size:8px;color:var(--red);margin-bottom:6px">D สูงเกินไป</div>
    <div style="font-size:12px;color:var(--text2);line-height:1.6">Motor ร้อนมาก เสียงดัง prop wash แย่ลง (D amplify noise)</div>
  </div>
  <div style="background:rgba(0,170,255,.06);border:1px solid rgba(0,170,255,.15);border-radius:7px;padding:12px">
    <div style="font-family:var(--font-d);font-size:8px;color:var(--blue);margin-bottom:6px">I สูงเกินไป</div>
    <div style="font-size:12px;color:var(--text2);line-height:1.6">Bounce-back หลัง flip/roll (I-term windup), oscillation ช้าๆ</div>
  </div>
</div>

<div style="background:rgba(0,255,136,.06);border:1px solid rgba(0,255,136,.15);border-radius:8px;padding:16px">
<div style="font-family:var(--font-d);font-size:9px;color:var(--green);margin-bottom:10px">⚡ TUNING ORDER — วิธีปรับ PID อย่างถูกต้อง</div>
<ol style="padding-left:18px;line-height:2.2;font-size:13px">
  <li>เพิ่ม <strong>P</strong> ทีละ 5 จน oscillate มองเห็นใน OSD/blackbox แล้วถอยกลับ 10</li>
  <li>เพิ่ม <strong>D</strong> จนลด oscillation จาก P สูง ดู motor temp ไม่เกิน 60°C</li>
  <li>ปรับ <strong>I</strong> ตาม drift ที่สังเกต ถ้า bounce-back หลัง flip ให้ลด I</li>
  <li>เพิ่ม <strong>Feedforward</strong> เพื่อลด stick lag</li>
  <li>ทำ <strong>Blackbox analysis</strong> เพื่อยืนยันผล</li>
</ol>
</div>`},

  filter:{title:'🔊 FILTER GUIDE — เข้าใจทุก filter ใน Betaflight',body:`
<h3 style="color:var(--blue);font-family:var(--font-d);font-size:13px;margin-bottom:14px">Filter คืออะไรและทำงานอย่างไร?</h3>
<p>Filter ช่วยกรอง noise จาก motor vibration, ESC switching frequency และ airframe resonance ออกจาก gyro data ก่อนส่งไปยัง PID controller — เหมือน noise-canceling headphones สำหรับโดรน</p>

<div style="display:flex;flex-direction:column;gap:12px;margin:16px 0">
  <div style="background:rgba(0,255,136,.05);border:1px solid rgba(0,255,136,.18);border-radius:8px;padding:14px">
    <div style="font-family:var(--font-d);font-size:9px;color:var(--green);margin-bottom:6px">🔹 GYRO LPF (Low-Pass Filter)</div>
    <div style="font-size:13px;color:var(--text2);line-height:1.7">กรอง noise จาก gyro sensor ทุกอย่างที่ความถี่สูงกว่า cutoff จะถูกกรองออก ค่าต่ำ = กรองมาก + latency สูง ค่าสูง = response ไว + noise ผ่านมาก</div>
  </div>
  <div style="background:rgba(0,170,255,.05);border:1px solid rgba(0,170,255,.18);border-radius:8px;padding:14px">
    <div style="font-family:var(--font-d);font-size:9px;color:var(--blue);margin-bottom:6px">🔹 D-TERM LPF</div>
    <div style="font-size:13px;color:var(--text2);line-height:1.7">D term ขยาย noise ตามธรรมชาติ จึงต้องมี LPF ก่อน D ด้วย ค่าต่ำเกิน D ทำงานไม่ได้ ค่าสูงเกิน motor ร้อนมาก <strong style="color:var(--amber)">นี่คือ filter ที่สำคัญที่สุด</strong></div>
  </div>
  <div style="background:rgba(255,187,0,.05);border:1px solid rgba(255,187,0,.18);border-radius:8px;padding:14px">
    <div style="font-family:var(--font-d);font-size:9px;color:var(--amber);margin-bottom:6px">🔹 DYNAMIC NOTCH FILTER</div>
    <div style="font-size:13px;color:var(--text2);line-height:1.7">ติดตาม resonance peak แบบ real-time และสร้าง notch filter ที่ความถี่นั้น ไม่ต้องรู้ความถี่ล่วงหน้า เหมาะสำหรับ resonance ที่เปลี่ยนตาม RPM</div>
  </div>
  <div style="background:rgba(176,96,255,.05);border:1px solid rgba(176,96,255,.18);border-radius:8px;padding:14px">
    <div style="font-family:var(--font-d);font-size:9px;color:var(--purple);margin-bottom:6px">🔹 RPM FILTER (ขั้นสูง)</div>
    <div style="font-size:13px;color:var(--text2);line-height:1.7">ใช้ RPM telemetry จาก ESC (ต้องมี Bidirectional DSHOT) สร้าง notch filter ที่ motor frequency และ harmonic แน่นอนที่สุด เมื่อใช้ร่วมกัน LPF อื่นสามารถเพิ่ม Hz ขึ้นเพื่อลด latency</div>
  </div>
</div>

<div style="background:rgba(0,212,200,.06);border:1px solid rgba(0,212,200,.2);border-radius:8px;padding:14px">
<div style="font-family:var(--font-d);font-size:9px;color:var(--teal);margin-bottom:8px">💡 OPTIMAL FILTER STRATEGY</div>
<div style="font-size:13px;color:var(--text2);line-height:1.8">
1. เปิด <strong>Bidirectional DSHOT</strong> + RPM Filter<br>
2. เพิ่ม <strong>Gyro LPF1 Hz ขึ้น 20–40</strong> (เช่น 200→240) เพื่อลด latency<br>
3. ลด <strong>D-term LPF1 Hz ลง 10–20</strong> (เช่น 110→100) เพื่อ D term clean ขึ้น<br>
4. ลด <strong>dyn_notch_count เหลือ 1–2</strong> เพราะ RPM filter ทำหน้าที่แทน<br>
ผลลัพธ์: Response ไวขึ้น + Clean กว่า filter อย่างเดียว
</div>
</div>`},

  ff:{title:'⚡ FEEDFORWARD — ลด Stick Lag อย่างมีประสิทธิภาพ',body:`
<h3 style="color:var(--amber);font-family:var(--font-d);font-size:13px;margin-bottom:14px">Feedforward (FF) คืออะไร?</h3>
<p>Feedforward คือการ <strong>"คาดการณ์"</strong> ล่วงหน้าจาก stick input — แทนที่จะรอให้ error เกิดขึ้นแล้วค่อยแก้ (แบบ PID), FF ส่ง command ไปยัง motor ทันทีที่ stick เคลื่อน ทำให้โดรนตาม stick ได้เร็วขึ้น</p>

<div style="display:grid;grid-template-columns:1fr 1fr;gap:12px;margin:16px 0">
  <div style="background:rgba(255,187,0,.07);border:1px solid rgba(255,187,0,.2);border-radius:8px;padding:14px">
    <div style="font-family:var(--font-d);font-size:9px;color:var(--amber);margin-bottom:6px">FF สูง</div>
    <div style="font-size:12px;color:var(--text2);line-height:1.6">✅ Stick direct/crisp<br>✅ ลด lag อย่างเห็นได้ชัด<br>⚠️ อาจมี overshoot<br>⚠️ ไวต่อ RC glitch</div>
  </div>
  <div style="background:rgba(0,170,255,.07);border:1px solid rgba(0,170,255,.2);border-radius:8px;padding:14px">
    <div style="font-family:var(--font-d);font-size:9px;color:var(--blue);margin-bottom:6px">FF ต่ำ</div>
    <div style="font-size:12px;color:var(--text2);line-height:1.6">✅ Smooth สำหรับ cinematic<br>✅ ไม่ไวต่อ RC noise<br>⚠️ Stick lag<br>⚠️ โดรนตาม stick ไม่ทัน</div>
  </div>
</div>

<div style="background:rgba(255,187,0,.05);border:1px solid rgba(255,187,0,.15);border-radius:8px;padding:14px;margin-bottom:14px">
<div style="font-family:var(--font-d);font-size:9px;color:var(--amber);margin-bottom:8px">🎯 SWEET SPOTS ตาม Style</div>
<div style="display:grid;grid-template-columns:1fr 1fr 1fr;gap:8px;font-size:12px">
  <div style="text-align:center;padding:8px;background:rgba(255,51,68,.07);border-radius:6px"><div style="color:var(--red);font-weight:bold">Racing</div><div style="color:var(--text2);margin-top:4px">FF Roll: 40–80<br>FF Pitch: 45–90</div></div>
  <div style="text-align:center;padding:8px;background:rgba(0,255,136,.07);border-radius:6px"><div style="color:var(--green);font-weight:bold">Freestyle</div><div style="color:var(--text2);margin-top:4px">FF Roll: 20–40<br>FF Pitch: 25–45</div></div>
  <div style="text-align:center;padding:8px;background:rgba(0,170,255,.07);border-radius:6px"><div style="color:var(--blue);font-weight:bold">Cinematic</div><div style="color:var(--text2);margin-top:4px">FF Roll: 0–15<br>FF Pitch: 0–20</div></div>
</div>
</div>

<div style="font-family:var(--font-d);font-size:9px;color:var(--muted);margin-bottom:8px">feedforward_averaging OPTIONS</div>
<div style="font-size:13px;color:var(--text2);line-height:1.8;background:rgba(255,255,255,.03);border-radius:7px;padding:12px">
<strong>OFF</strong> — ใช้ค่า FF โดยตรง ไว แต่ noisy<br>
<strong>2_POINT</strong> — เฉลี่ย 2 ค่า balance ดี เหมาะ ELRS 250Hz+<br>
<strong>3_POINT, 4_POINT</strong> — Smooth มาก เหมาะ RC noisy แต่ lag เพิ่ม
</div>`},

  rates:{title:'🎮 RATES & RC TUNING — ปรับ Stick Feel',body:`
<h3 style="color:var(--purple);font-family:var(--font-d);font-size:13px;margin-bottom:14px">Rates คืออะไร?</h3>
<p>Rates กำหนดว่า stick ที่ตำแหน่งต่างๆ จะทำให้โดรนหมุนเร็วแค่ไหน ปรับ feel ของ stick ได้หลายแบบ</p>

<div style="display:grid;grid-template-columns:1fr 1fr 1fr;gap:10px;margin:16px 0">
  <div style="background:rgba(176,96,255,.07);border:1px solid rgba(176,96,255,.2);border-radius:8px;padding:12px">
    <div style="font-family:var(--font-d);font-size:9px;color:var(--purple);margin-bottom:6px">RC RATE</div>
    <div style="font-size:12px;color:var(--text2);line-height:1.6">ความเร็วสูงสุดที่ full stick ค่าสูง = roll เร็วกว่า</div>
  </div>
  <div style="background:rgba(176,96,255,.07);border:1px solid rgba(176,96,255,.2);border-radius:8px;padding:12px">
    <div style="font-family:var(--font-d);font-size:9px;color:var(--purple);margin-bottom:6px">EXPO</div>
    <div style="font-size:12px;color:var(--text2);line-height:1.6">ทำให้ center stick นุ่มขึ้น ค่าสูง = center เบา edge ไว</div>
  </div>
  <div style="background:rgba(176,96,255,.07);border:1px solid rgba(176,96,255,.2);border-radius:8px;padding:12px">
    <div style="font-family:var(--font-d);font-size:9px;color:var(--purple);margin-bottom:6px">SUPER RATE</div>
    <div style="font-size:12px;color:var(--text2);line-height:1.6">เพิ่ม sensitivity ที่ edge ของ stick ค่าสูง = edge ไวมาก</div>
  </div>
</div>

<div style="background:rgba(176,96,255,.05);border:1px solid rgba(176,96,255,.15);border-radius:8px;padding:14px;margin-bottom:14px">
<div style="font-family:var(--font-d);font-size:9px;color:var(--purple);margin-bottom:8px">🎯 RECOMMENDED RATES ตาม Style</div>
<table style="width:100%;font-size:12px;color:var(--text2)">
<tr style="font-family:var(--font-d);font-size:8px;color:var(--muted)"><td>STYLE</td><td>RC RATE</td><td>EXPO</td><td>SUPER RATE</td></tr>
<tr style="border-top:1px solid rgba(255,255,255,.06)"><td style="padding:6px 0;color:var(--red)">Racing</td><td>1.8–2.2</td><td>0.0–0.2</td><td>0.5–0.7</td></tr>
<tr><td style="padding:6px 0;color:var(--green)">Freestyle</td><td>1.4–1.8</td><td>0.2–0.4</td><td>0.6–0.75</td></tr>
<tr><td style="padding:6px 0;color:var(--blue)">Cinematic</td><td>0.8–1.2</td><td>0.4–0.6</td><td>0.3–0.5</td></tr>
<tr><td style="padding:6px 0;color:var(--teal)">Proximity</td><td>1.0–1.4</td><td>0.3–0.5</td><td>0.4–0.6</td></tr>
</table>
</div>

<div style="font-size:13px;color:var(--text2);line-height:1.8;background:rgba(255,255,255,.03);border-radius:7px;padding:12px">
💡 <strong>Tip:</strong> ปรับ Rates ใน OBIXConfig Doctor → Rates Visualizer เพื่อดู curve real-time ก่อนนำไปใช้งาน
</div>`},

  motor:{title:'⚙️ MOTOR & ESC CONFIG — ทุกอย่างที่ต้องรู้',body:`
<h3 style="color:var(--teal);font-family:var(--font-d);font-size:13px;margin-bottom:14px">DSHOT Protocol</h3>
<p>DSHOT คือ digital protocol สำหรับสื่อสาร FC→ESC แม่นยำกว่า Oneshot/Multishot เพราะ digital ไม่มี timing drift</p>

<div style="display:grid;grid-template-columns:1fr 1fr 1fr;gap:8px;margin:14px 0">
  <div style="padding:10px;background:rgba(0,212,200,.07);border:1px solid rgba(0,212,200,.2);border-radius:7px;text-align:center">
    <div style="font-family:var(--font-d);font-size:11px;color:var(--teal);margin-bottom:4px">DSHOT150</div>
    <div style="font-size:11px;color:var(--text2)">ESC รุ่นเก่า ช้า</div>
  </div>
  <div style="padding:10px;background:rgba(0,212,200,.07);border:1px solid rgba(0,212,200,.2);border-radius:7px;text-align:center">
    <div style="font-family:var(--font-d);font-size:11px;color:var(--teal);margin-bottom:4px">DSHOT300</div>
    <div style="font-size:11px;color:var(--text2)">ปลอดภัย สำหรับ ESC เก่า</div>
  </div>
  <div style="padding:10px;background:rgba(0,212,200,.12);border:1px solid rgba(0,212,200,.35);border-radius:7px;text-align:center">
    <div style="font-family:var(--font-d);font-size:11px;color:var(--teal);margin-bottom:4px">DSHOT600 ⭐</div>
    <div style="font-size:11px;color:var(--text2)">แนะนำสำหรับ ESC สมัยใหม่</div>
  </div>
</div>

<h4 style="font-family:var(--font-d);font-size:10px;letter-spacing:.14em;color:var(--muted);margin:16px 0 10px">BIDIRECTIONAL DSHOT & RPM FILTER</h4>
<div style="background:rgba(255,187,0,.06);border:1px solid rgba(255,187,0,.18);border-radius:8px;padding:14px;margin-bottom:14px">
<div style="font-size:13px;color:var(--text2);line-height:1.8">
Bidirectional DSHOT เปิด telemetry จาก ESC→FC ทำให้ FC รู้ RPM จริงของแต่ละ motor และสร้าง RPM filter ที่แม่นยำ<br><br>
<strong>ESC ที่รองรับ:</strong> BLHeli_32 (v32.7+), AM32, Bluejay, EXC-32<br>
<strong>ESC ที่ไม่รองรับ:</strong> BLHeli_S ต้องอัปเดตเป็น Bluejay ก่อน
</div>
</div>

<h4 style="font-family:var(--font-d);font-size:10px;letter-spacing:.14em;color:var(--muted);margin:16px 0 10px">MOTOR POLES & RPM CALCULATION</h4>
<div style="font-size:13px;color:var(--text2);line-height:1.8;background:rgba(255,255,255,.03);border-radius:7px;padding:12px">
RPM = (eRPM ÷ motor_poles/2) × 60<br>
Motor 5" ส่วนใหญ่ = 14 poles (7 คู่แม่เหล็ก)<br>
ตรวจสอบจาก spec sheet ของ motor หรือนับแม่เหล็กภายใน<br><br>
⚠️ motor_poles ผิด = RPM filter กรองผิดความถี่ = motor ร้อนหรือ buzz
</div>`},

  safety:{title:'🛡️ SAFETY CHECKLIST — ต้องอ่านก่อน arm',body:`
<h3 style="color:var(--red);font-family:var(--font-d);font-size:13px;margin-bottom:14px">⚠️ Safety Parameters ที่ต้องตรวจทุกครั้ง</h3>

<div style="display:flex;flex-direction:column;gap:10px;margin-bottom:16px">
  <div style="background:rgba(255,51,68,.07);border:1px solid rgba(255,51,68,.25);border-radius:8px;padding:14px">
    <div style="font-family:var(--font-d);font-size:9px;color:var(--red);margin-bottom:6px">🔴 failsafe_action — สำคัญที่สุด</div>
    <div style="font-size:13px;color:var(--text2);line-height:1.7">
    <strong>DROP</strong> — ตัด motor ทันที เหมาะ FPV racing/freestyle (โดรนตกทันที ไม่บินออกไปไกล)<br>
    <strong>LAND</strong> — ลงช้าๆ เหมาะ beginner (แต่อาจลงในที่ไม่ปลอดภัย)<br>
    <strong>GPS_RESCUE</strong> — บินกลับ home point ต้องการ GPS และ home point set ก่อนบิน
    </div>
  </div>
  <div style="background:rgba(255,51,68,.07);border:1px solid rgba(255,51,68,.2);border-radius:8px;padding:14px">
    <div style="font-family:var(--font-d);font-size:9px;color:var(--red);margin-bottom:6px">🔴 failsafe_delay — ค่าแนะนำ 4–6</div>
    <div style="font-size:13px;color:var(--text2);line-height:1.7">
    ค่า 1 unit = 0.1 วินาที (ค่า 4 = 0.4 วินาที)<br>
    ต่ำเกิน → false trigger จาก RF glitch<br>
    สูงเกิน → โดรนบินออกไปไกลก่อน failsafe
    </div>
  </div>
  <div style="background:rgba(255,187,0,.06);border:1px solid rgba(255,187,0,.2);border-radius:8px;padding:14px">
    <div style="font-family:var(--font-d);font-size:9px;color:var(--amber);margin-bottom:6px">⚠️ motor_stop — แนะนำ OFF</div>
    <div style="font-size:13px;color:var(--text2);line-height:1.7">
    <strong>OFF (แนะนำ)</strong> — motor หมุนช้าตลอดเมื่อ armed ปลอดภัยกว่า<br>
    <strong>ON</strong> — motor หยุดสนิทตอน throttle 0 อันตราย: ถ้า re-arm กลางอากาศ motor spin กะทันหัน
    </div>
  </div>
  <div style="background:rgba(255,187,0,.06);border:1px solid rgba(255,187,0,.2);border-radius:8px;padding:14px">
    <div style="font-family:var(--font-d);font-size:9px;color:var(--amber);margin-bottom:6px">⚠️ dshot_bidir — ต้องเข้ากันกับ ESC</div>
    <div style="font-size:13px;color:var(--text2);line-height:1.7">
    ถ้าเปิด Bidir แต่ ESC ไม่รองรับ → motor จะ desync ทันที<br>
    ตรวจสอบ ESC firmware version ก่อนเปิดเสมอ
    </div>
  </div>
</div>

<div style="background:rgba(0,255,136,.06);border:1px solid rgba(0,255,136,.2);border-radius:8px;padding:16px">
<div style="font-family:var(--font-d);font-size:9px;color:var(--green);margin-bottom:10px">✅ PRE-FLIGHT CHECKLIST ก่อน arm ทุกครั้ง</div>
<div style="font-size:13px;color:var(--text2);line-height:2.1">
☐ Test failsafe: ปิด TX แล้วตรวจว่า motor หยุดหรือ land ตามที่ตั้ง<br>
☐ ตรวจ motor_poles ถูกต้องสำหรับ motor ของคุณ<br>
☐ ถ้าเปลี่ยน DSHOT protocol ทำ motor test บน bench ก่อน<br>
☐ Hover test ในที่โล่ง ก่อนบินเต็มที่เสมอ<br>
☐ ดู motor temp หลัง hover test ควร &lt;60°C
</div>
</div>`}
};

function openLearn(t){
  const c=LEARN_CONTENT[t]; if(!c)return;
  $('learnTitle').textContent=c.title;
  $('learnBody').innerHTML=c.body;
  $('learnModal').style.display='block';
  document.body.style.overflow='hidden';
}
function closeLearn(){ $('learnModal').style.display='none'; document.body.style.overflow='' }

document.addEventListener('keydown',e=>{ if(e.key==='Escape'){ closeLearn(); closeParam() } });


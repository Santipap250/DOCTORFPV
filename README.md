# 🚀 ConfigDoctor
## FPV Drone Configuration Analyzer

**ConfigDoctor** คือเว็บเครื่องมือสำหรับช่วยวิเคราะห์และตรวจสอบการตั้งค่า (Configuration) ของโดรน FPV และระบบที่เกี่ยวข้อง  
เพื่อช่วยให้ผู้ใช้สามารถปรับแต่ง แก้ไข และเข้าใจค่าต่าง ๆ ได้ง่ายขึ้น

โปรเจกต์นี้ถูกออกแบบมาเพื่อรองรับทั้ง **มือใหม่** และ **นักบิน FPV ระดับโปร**  
โดยมุ่งเน้นให้การตั้งค่าโดรนเป็นเรื่องที่เข้าใจง่ายขึ้น ลดความผิดพลาด และช่วยให้การจูนโดรนมีประสิทธิภาพมากขึ้น

---

## 🌐 Live Website

https://configdoctor.vercel.app
https://configdoctor.onrender.com

---

## ✨ Features

### 🔧 Drone Configuration Analysis
ตรวจสอบค่าการตั้งค่าโดรน เช่น

- Motor KV
- Frame Size
- Battery Type
- PID Configuration
- Flight Controller Settings

ระบบจะช่วยวิเคราะห์และแนะนำค่าที่เหมาะสมกับการใช้งาน

---

### 📊 Drone Performance Calculation
คำนวณข้อมูลสำคัญของโดรน เช่น

- Thrust Ratio
- Estimated Flight Time
- Battery Efficiency
- Motor Performance

---

### 🧠 Smart Suggestion System
ระบบแนะนำค่าที่เหมาะสมตามสถานการณ์ใช้งาน เช่น

- PID Tuning
- Motor Compatibility
- Battery Configuration
- Frame Recommendation

---

### 🪖 Military Mode (Experimental)
โหมดพิเศษสำหรับการวิเคราะห์ระบบโดรนขั้นสูง

คุณสมบัติหลัก:

- Drone System Analysis
- Flight Assessment
- Pre-flight Checklist
- Simulation Tools

> ⚠️ โหมดนี้อยู่ในขั้นทดลอง

---

### 📱 Mobile Friendly
เว็บไซต์ถูกออกแบบให้ใช้งานได้ดีบนทุกอุปกรณ์ เช่น

- โทรศัพท์มือถือ
- แท็บเล็ต
- คอมพิวเตอร์

---

## 🖥️ Technology Stack

### Frontend
- HTML5
- CSS3
- JavaScript

### Backend
- Python
- Flask

### Hosting
- Render

### Version Control
- GitHub

---

## 📂 Project Structure

```text
configdoctor
│
├── app.py                 # Main Flask app — routes, security config, extensions
├── core.py                # Shared analysis/DB logic (no Flask dependency)
├── requirements.txt
├── README.md / SETUP.md
│
├── analyzer/               # Domain analysis modules (PID, blackbox, prop, filters, CLI...)
├── blueprints/              # Flask blueprints, grouped by tool category
├── logic/
│   ├── tool_registry.py     # single source of truth for all 30 tools
│   └── firmware_compat.py   # Betaflight version → CLI parameter mapping
│
├── templates/               # Jinja2 templates (base.html + 40+ pages)
│   └── partials/            # nav, footer, OG/JSON-LD tags, etc.
│
└── static/
    ├── css/
    │   ├── tokens.css        # canonical design tokens
    │   └── patterns.css      # reusable UI component library
    ├── js/
    └── img/
```

---
🔮 Future Features
แผนพัฒนาต่อจากนี้

- Firmware-version input in the UI (the analyzer already generates version-correct CLI internally — see `logic/firmware_compat.py` — but no page lets you pick a firmware version yet)
- PostgreSQL option for multi-worker deployments (currently SQLite + WAL)
- More device presets in the CLI Surgeon / diff library

👨‍💻 Developer
Developed by
SanTiPapHacker
GitHub
https://github.com/Santipap250⁠�
Project
OBIX Config Lab
ConfigDoctor AI
© Copyright
Copyright © 2026 Santipap.
All rights reserved.
This software, source code, design, graphics, documentation, and related materials are the intellectual property of Santipap.
Unauthorized copying, modification, distribution, resale, reverse engineering, or commercial use of this project without written permission is prohibited.์

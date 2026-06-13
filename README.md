# HydroSplit Pro Condominium ⚡

[![Vercel Deployment](https://img.shields.io/badge/Vercel-Deployed-black?style=flat-square&logo=vercel)](https://vercel.com)
[![LLM Engine](https://img.shields.io/badge/AI--Engine-Llama%204%20Scout-cyan?style=flat-square)](https://groq.com)
[![License](https://img.shields.io/badge/License-MIT-green?style=flat-square)](LICENSE)

**HydroSplit Pro** is an enterprise-grade web application designed for the auditing, balancing, and dynamic distribution of condominium water expenses based on real individual sub-meter readings.

By integrating state-of-the-art Multimodal Vision-LLMs, the application scans water bill images, automatically extracts complex cost matrices (including fixed quotes, regional taxes, and equalization fees), and computes millimeter-accurate expense splits for each tenant instantly.

---

## ✨ Key Features

* **Vision-AI OCR Engine:** Native semantic data extraction powered by **Llama 4 Scout** (via Groq Cloud API). Seamlessly parses complex Italian water bill structures and sequentially extracts sequential equalization adjustments (*Oneri Perequazione*).
* **Client-Side Image Optimization:** Embedded downsampling algorithm utilizing HTML5 Canvas. It automatically intercepts heavy smartphone photography captures (up to >8MB) and compresses them to <400KB before transit, bypassing cloud gateway bandwidth limits and avoiding Vercel payload drops.
* **Secure Serverless Architecture:** API endpoints routed securely via a dedicated **Vercel Serverless Function** (`/api/ocr`). Live production environment tokens are kept private on the backend server, completely isolated from client-side network exposure and protected by GitHub Push Protection rules.
* **Dynamic Split Matrix:** Custom computational engine balancing proportional consumption data ($m^3$) with equitable flat-fee distributions, calculated taxes (IVA 10%), and invoice processing commissions.
* **Local Data Persistence:** Automatic saving of condominium node states and reading history using `LocalStorage` for seamless rollover calculations in subsequent billing cycles.
* **Print-Ready Export:** Tailored print-media CSS layouts for clean, professional PDF receipts ready to be shared with tenants.

---

## 🛠️ Tech Stack

* **Frontend:** Vanilla JavaScript (ES6+), HTML5, CSS3 (Custom Properties & Glassmorphism UI layout).
* **Backend Runtime / Hosting:** Vercel Serverless Functions (Node.js engine).
* **AI Inference Protocol:** Groq Cloud Vision Endpoint (`meta-llama/llama-4-scout-17b-16e-instruct`).

---

## 📦 Project Directory Blueprint

```text
hydrosplit-pro/
├── api/
│   └── ocr.js          # Serverless Function (API Key shielding & Groq proxy proxy)
├── app.js              # Core UI orchestration, client Canvas compression & splitting logic
├── index.html          # Responsive user interface entry-point
├── style.css           # Global layout sheets (Dark theme styling & Print media rules)
└──
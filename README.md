# AI-Powered FMEA Tool

An intelligent, modular web-based tool for generating FMEA (Failure Mode and Effects Analysis) worksheets using AI. Supports multiple AI providers (Claude, Gemini, Groq, Ollama), cloud storage via Supabase, and multi-user authentication.

**Version:** 1.2.0 | **Built:** 04/28/2026 08:06:52 UTC

---

## What's New in 1.2.0

- **Supabase cloud storage** — projects, incidents, and API keys persist across devices and browser clears
- **Multi-user authentication** — email/password signup and login via Supabase Auth
- **Google SSO** — sign in with your Google account
- **Groq TPM limits** — model dropdown shows tokens-per-minute limit and safe document window per model
- **Simplified document range control** — single window-size input with draggable slider spanning the full document
- **Active model badge** — shows currently selected provider and model next to the Analyze button
- **Groq set as default provider** — fastest free-tier option pre-selected
- **Default model: llama-3.1-8b-instant**

---

## Features

### 🤖 Multi-Provider AI Support
- **Groq** *(default)* — ultra-fast free tier; models sorted by TPM limit with safe window shown
- **Claude (Anthropic)** — advanced FMEA analysis
- **Gemini (Google)** — cost-effective alternative
- **Ollama** — run models locally, completely free

### 🔐 Authentication & Cloud Storage
- Email/password signup and login (Supabase Auth)
- **Google SSO** — one-click sign-in
- All projects, incidents, and settings stored in Supabase (survive browser clears)
- API keys encrypted at rest in cloud database
- Row Level Security — each user sees only their own data

### 📄 Document Analysis
- Upload TXT/PDF files or paste document text
- **Document range control**: window-size input + draggable slider to scroll through any part of the document
- Per-model TPM limit display: know the safe window size before you hit an error
- Real-time token cost estimation

### 📋 FMEA Worksheet
- Process Step, Failure Mode, Effect, Cause
- Severity (S), Occurrence (O), Detection (D) ratings (1-10)
- RPN (Risk Priority Number) auto-calculation
- Action Priority (AP) badge — AIAG/VDA standard (H / M / L)
- Recommended actions, owners, due dates, completion %
- **Two view modes:** Simplified and Advanced (with revised ratings, prevention/detection controls)
- Hide/show Cause and Action columns

### ⚠️ Incident Tracking
- Log incidents linked to FMEA failure modes
- File attachments
- Incident reports and CSV export

### 📊 Reporting & Export
- **PDF report** — project summary with FMEA table and KPIs
- **All Projects Report** — cross-project comparison
- **CSV Export** — open in Excel
- **JSON Import/Export** — full backup and restore
- **RPN Donut Chart** — visual risk distribution

---

## Quick Start

### 1. Open the Tool
Open `index.html` in your browser (or serve via a local web server).

### 2. Create an Account
- Click **Don't have an account? Sign up**
- Enter your email and password, confirm your email, then sign in
- Or use **Sign in with Google**

### 3. Create a Project
- Click **New Project** on the dashboard
- Enter project details (name, company, scope, etc.)
- Open Settings (⚙) to choose AI provider and paste API key

### 4. Upload Documents & Analyze
- Upload a TXT/PDF or paste text in the Upload tab
- Adjust **Window size** in the Range Control if needed (default 20,000 chars ≈ 5,000 tokens)
- Drag the slider to choose which part of the document to analyze
- Click **🔍 Analyze & Generate FMEA**
- Review and accept generated failure modes

### 5. Add Actions & Export
- Fill in recommended actions, owners, due dates
- Export as PDF or CSV when ready

---

## AI Provider Setup

### Groq *(recommended — free)*
1. Get a free API key at [console.groq.com](https://console.groq.com)
2. Open Project Settings (⚙) → enter key → **Load Models**
3. Models are sorted by TPM limit (highest first); each shows safe window size
4. Best free-tier models for large documents: **gemma2-9b-it** / **gemma-7b-it** (15,000 TPM → ~56k chars)

### Claude (Anthropic)
1. Get credits at [console.anthropic.com](https://console.anthropic.com)
2. Enter API key in Project Settings
3. Cost: ~$3/1M input, $15/1M output tokens

### Gemini (Google)
1. Get free $300 credits at [console.cloud.google.com](https://console.cloud.google.com)
2. Enable Generative AI API, create an API key
3. Cost: ~$1.25/1M input, $5/1M output tokens

### Ollama *(local, free)*
1. Download from [ollama.ai](https://ollama.ai) and run `ollama serve`
2. Pull a model: `ollama pull mistral`
3. Select Ollama in Settings, enter model name

---

## Groq TPM Limits (Free Tier)

| Model | TPM Limit | Safe Window |
|---|---|---|
| gemma2-9b-it | 15,000 | ~56k chars |
| gemma-7b-it | 15,000 | ~56k chars |
| llama-3.2-1b-preview | 7,000 | ~24k chars |
| llama-3.2-3b-preview | 7,000 | ~24k chars |
| llama-3.1-8b-instant | 6,000 | ~20k chars |
| llama-3.3-70b-versatile | 6,000 | ~20k chars |
| mixtral-8x7b-32768 | 5,000 | ~16k chars |

---

## File Structure

```
./
├── index.html              # Main HTML shell
├── css/
│   └── styles.css          # All styling
├── js/
│   ├── supabase.js         # Supabase client, auth helpers, encryption
│   ├── utils.js            # Shared state, storage abstraction, helpers
│   ├── auth.js             # Login, signup, Google SSO, session management
│   ├── projects.js         # Project CRUD, settings, Groq model/TPM info
│   ├── table.js            # FMEA table rendering, range control, file handling
│   ├── analyze.js          # AI analysis, cost estimation, multi-provider support
│   ├── incidents.js        # Incident logging, linking, export
│   ├── reports.js          # PDF/CSV generation, KPIs
│   └── export.js           # JSON export/import
├── supabase-schema.sql     # Database schema and RLS policies
└── README.md               # This file
```

---

## Technology Stack

- **Frontend**: Vanilla JavaScript (ES5-compatible, no frameworks, no build step)
- **Auth & Storage**: Supabase (PostgreSQL + Row Level Security)
- **AI APIs**: Groq, Anthropic, Google Generative AI, Ollama
- **Export**: HTML/Canvas (PDF), CSV, JSON

---

## Troubleshooting

### "Document too large for this model's free-tier TPM limit"
- Reduce **Window size** in the Range Control (try 16,000 chars)
- Or switch to **gemma2-9b-it** (15,000 TPM) in Settings → Load Models

### "API Error: Invalid API Key"
- Open Settings (⚙), re-enter your key, and click Save
- Make sure the correct provider is selected

### "Ollama not running"
- Run `ollama serve` in a terminal before using the tool

---

## License

Internal tool. Created by Andrzej Grzegorczyk.

---

**Version:** 1.2.0 | **Built:** 04/28/2026 08:06:52 UTC

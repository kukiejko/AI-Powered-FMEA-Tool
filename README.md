# FMEA Tool - AI-Powered FMEA Generator

An intelligent, modular web-based tool for generating FMEA (Failure Mode and Effects Analysis) worksheets using AI. Supports multiple AI providers (Claude, Gemini, Groq, Ollama) and provides comprehensive incident tracking, analysis, and reporting.

**Version:** 1.1.1 | **Built:** 04/27/2026 18:47:42 UTC

## Features

### 🤖 Multi-Provider AI Support
- **Claude (Anthropic)** - Full-featured FMEA analysis with advanced capabilities
- **Gemini (Google)** - Cost-effective alternative ($1.25/M input, $5/M output)
- **Groq** - Ultra-fast free tier with large language models
- **Ollama** - Run models locally on your machine (completely free)

### 📄 Document Analysis
- Upload TXT/PDF files or paste document text
- **Document range control**: Skip first N characters, analyze custom portions
- Intelligent document chunking to prevent token limit errors
- Real-time token cost estimation

### 📋 FMEA Worksheet
- Comprehensive failure mode tracking with:
  - Process Step, Failure Mode, Effect, Cause
  - Severity (S), Occurrence (O), Detection (D) ratings (1-10)
  - RPN (Risk Priority Number) calculation
  - Action Priority (AP) badge (AIAG/VDA standard)
  - Recommended actions, owners, due dates
  - Status tracking and completion percentage
- **Two view modes:**
  - **Simplified**: Essential fields for quick analysis
  - **Advanced**: Full FMEA methodology with revised ratings, prevention/detection controls

### ⚠️ Incident Tracking
- Log incidents linked to FMEA failure modes
- File attachments support
- Incident reports and CSV export
- Track implementation progress

### 📊 Reporting & Export
- **Project Reports**: PDF export with FMEA data and metrics
- **All Projects Report**: Compare across multiple FMEAs
- **CSV Export**: Import to Excel or other tools
- **JSON Import/Export**: Backup and version control
- **RPN Donut Chart**: Visual risk distribution
- **KPI Dashboard**: Key metrics at a glance

### 🔐 Security & Storage
- **Local browser storage**: All data stored on your device, never sent to servers
- **Per-user credentials**: Each user has separate API keys and projects
- **No account system**: Use simple username/password (default: admin/fmea2024)
- **Offline-capable**: Works without internet after initial setup

## Quick Start

### 1. Open the Tool
```
Open index.html in your web browser
```

### 2. Log In
```
Username: admin
Password: fmea2024
```

### 3. Create a Project
- Click "New Project" on the dashboard
- Enter project details (name, company, scope, etc.)
- Save and open the project

### 4. Upload Documents & Analyze
- Upload TXT files or paste document text
- (Optional) Adjust document range if needed
- Select your AI provider in ⚙ Header settings
- Enter API key for chosen provider
- Click "🔍 Analyze & Generate FMEA"
- Review and accept generated failure modes

### 5. Add Actions & Track Progress
- Fill in recommended actions
- Assign owners and due dates
- Update completion percentage
- Export as PDF or CSV when ready

## Configuration

### AI Provider Setup

#### Claude (Anthropic)
1. Get free $5 credits at [console.anthropic.com](https://console.anthropic.com)
2. Create an API key
3. Enter in Project Settings (⚙)
4. Cost: ~$3/1M input tokens, $15/1M output tokens

#### Gemini (Google)
1. Get free $300 credits at [console.cloud.google.com](https://console.cloud.google.com)
2. Enable Generative AI API
3. Create an API key
4. Enter in Project Settings (⚙)
5. Cost: ~$1.25/1M input, $5/1M output tokens

#### Groq
1. Get free API key at [console.groq.com](https://console.groq.com)
2. Enter in Project Settings (⚙)
3. Click "Refresh" to load available models
4. Select preferred model
5. Adjust "Max Output Tokens" if needed (default: 8192)
6. Cost: Free tier available

#### Ollama (Local)
1. Download from [ollama.ai](https://ollama.ai)
2. Run: `ollama serve`
3. Pull a model: `ollama pull mistral`
4. In Project Settings, select Ollama
5. Enter model name (e.g., "mistral")
6. Cost: Completely free (runs on your machine)

### Build System

Automatic version bumping and timestamp updates:

**Windows (PowerShell):**
```powershell
.\build.ps1 -Type patch    # or minor/major
```

**Cross-Platform (Node.js):**
```bash
node build.js patch        # or minor/major
```

**What it does:**
- Increments version (patch/minor/major)
- Updates compilation timestamp to current UTC
- Updates display on login screen

See [BUILD_INSTRUCTIONS.md](BUILD_INSTRUCTIONS.md) for git integration options.

## File Structure

```
./
├── index.html              # Main HTML shell
├── css/
│   └── styles.css          # All styling (425 lines)
├── js/
│   ├── utils.js            # Shared utilities, storage, UI helpers
│   ├── auth.js             # Login, logout, provider selection
│   ├── projects.js         # Project management, settings, API testing
│   ├── table.js            # FMEA table rendering, row/column ops, file handling
│   ├── analyze.js          # AI analysis, cost estimation, multi-provider support
│   ├── incidents.js        # Incident logging, linking, export
│   ├── reports.js          # PDF/CSV generation, KPIs
│   └── export.js           # JSON export/import
├── build.js                # Node.js build script (auto-versioning)
├── build.ps1               # PowerShell build script
├── README.md               # This file
├── BUILD_INSTRUCTIONS.md   # Build system documentation
└── FMEA_TOOL_MODULARIZATION_HANDOFF_2_FINAL.md  # Architecture documentation
```

## Technology Stack

- **Frontend**: Vanilla JavaScript (ES5-compatible, no frameworks)
- **Storage**: Browser localStorage (per-user, per-browser)
- **Export**: HTML/Canvas (PDF), CSV, JSON
- **AI APIs**: Anthropic, Google Generative AI, Groq, Ollama
- **Architecture**: Modular, 10 separate files, no build tool required

## Key Concepts

### Storage Abstraction
Supports both:
- **Browser localStorage** (default, standalone use)
- **Custom storage** via `window.storage` (Claude.ai integration)

### Multi-Provider Analysis
Each provider has different:
- API endpoints and request formats
- Response parsing
- Token limits and pricing
- Configuration requirements

The tool auto-detects and adapts to each provider.

### AIAG/VDA Action Priority (AP)
Standard risk assessment methodology:
- **H (High)**: Severity ≥9, or S≥7×O≥4, or S≥5×O≥7
- **M (Medium)**: Severity ≥5, specific threshold combinations
- **L (Low)**: Everything else

## Troubleshooting

### "API Error: Request Entity Too Large"
- **Cause**: Document too large for provider
- **Fix**: Reduce "Maximum characters" slider in upload panel
  - Try 50,000 or lower for Groq
  - Try 30,000 for Gemini

### "API Error: max_tokens must be ≤ 8192"
- **Cause**: Groq model limit exceeded
- **Fix**: In Project Settings, reduce "Max Output Tokens" for Groq

### "Ollama not running at localhost:11434"
- **Fix**: Run `ollama serve` in a terminal

### No version/timestamp displayed
- **Fix**: Ensure `utils.js` is loaded before page renders
- Check browser console for errors

## Data Export & Backup

### JSON (Recommended for backup)
- Full round-trip fidelity
- Includes all project settings
- Can be imported to restore data

### CSV (For Excel)
- FMEA data in spreadsheet format
- Can reimport from export

### PDF (For sharing)
- Professional project report
- Read-only, suitable for stakeholders
- Includes charts and KPIs

## Performance Notes

- **Token estimation** accounts for 4 chars ≈ 1 token
- **Cost estimation** uses current provider pricing (updated in code)
- **RPN calculation** real-time as you edit (S × O × D)
- **Document limit** prevents browser/API timeout (default 150k chars)

## Limitations

- **Single-user per browser** (separate users = different browsers/machines)
- **No cloud sync** (data stays local)
- **No offline first sync** (works offline after load, but new data is local-only)
- **No user management** (simple username/password)
- **Max document size** 150,000 characters (adjustable, API-dependent)

## Future Enhancement Ideas

- [ ] Multi-user collaboration (WebSocket-based sync)
- [ ] Cloud backup/restore
- [ ] Advanced search and filtering
- [ ] Custom RPN thresholds by industry
- [ ] Risk heat maps and trend analysis
- [ ] Integration with issue tracking (Jira, Linear)
- [ ] Mobile app (React Native)
- [ ] Automated FMEA suggestions from logs
- [ ] Real-time incident analytics

## License

Internal tool. Created by Andrzej Grzegorczyk.

## Support

For issues or feature requests, check:
- [BUILD_INSTRUCTIONS.md](BUILD_INSTRUCTIONS.md) - Build system
- [FMEA_TOOL_MODULARIZATION_HANDOFF_2.md](FMEA_TOOL_MODULARIZATION_HANDOFF_2.md) - Architecture details

### Getting Help with Providers

- **Claude**: [console.anthropic.com/docs](https://console.anthropic.com/docs)
- **Gemini**: [ai.google.dev/docs](https://ai.google.dev/docs)
- **Groq**: [console.groq.com/docs](https://console.groq.com/docs)
- **Ollama**: [ollama.ai/library](https://ollama.ai/library)

---

**Current Version:** 1.1.1 | **Last Updated:** April 27, 2026

```
ver.: 1.1.1
Built: 04/27/2026 18:47:42 UTC
```

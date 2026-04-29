# FMEA Tool - Folder Structure & File Organization

## Directory Overview

```
C:\Software\Claude\fmea_tool\
├── index.html                    (66 KB) - Main application entry point
├── fmea_tool_adv_2.html         (190 KB) - Legacy version (backup)
├── supabase-schema.sql          (8.9 KB) - Database schema
├── _config.yml                  (106 B) - Jekyll/GitHub Pages config
│
├── css/
│   └── styles.css              (34 KB) - Application styles
│
├── js/                          (356 KB total)
│   ├── utils.js                (16 KB) - Shared utilities & storage
│   ├── supabase.js             (8.3 KB) - Supabase client & encryption
│   ├── auth.js                 (14 KB) - Authentication module
│   ├── projects.js             (26 KB) - Project management
│   ├── table.js                (25 KB) - FMEA table rendering
│   ├── analyze.js              (24 KB) - AI analysis integration
│   ├── reports.js              (20 KB) - Report generation
│   ├── incidents.js            (14 KB) - Incident tracking
│   ├── export.js               (1.9 KB) - Export utilities
│   └── supabase-lib.js         (192 KB) - Supabase client library (CDN copy)
│
├── Documentation/
│   ├── README.md                      - Main documentation
│   ├── TEST_VERIFICATION_REPORT.md    - Test results (latest)
│   ├── SUPABASE_TESTING_GUIDE.md      - Supabase setup guide
│   ├── BUILD_INSTRUCTIONS.md          - Build/deploy guide
│   └── FMEA_TOOL_MODULARIZATION_HANDOFF_2_FINAL.md - Architecture docs
│
├── Build Scripts/
│   ├── build.js                 (2.3 KB) - Node.js build script
│   └── build.ps1                (2.1 KB) - PowerShell build script
│
└── .claude/                      (Local Claude workspace)
    ├── launch.json              - Preview server configuration
    └── settings.local.json      - Local development settings
```

---

## File-by-File Breakdown

### 🎨 **Frontend Entry Points**

#### `index.html` (66 KB)
- **Purpose:** Main application UI
- **Contains:**
  - Login screen (email/password + Google OAuth)
  - Dashboard (project list)
  - FMEA editor (table with rows)
  - Analysis tab (AI integration)
  - Incidents tab (tracking)
  - Reports tab (PDF export)
  - Help/Guide tabs
- **Key Features:**
  - Responsive design
  - Dark blue theme
  - Bootstrap icons
  - CryptoJS library import (`crypto-js.min.js`)
  - Supabase library (`supabase-js-4.0.2.min.js`)
- **Scripts Loaded:**
  - js/supabase-lib.js (Supabase client)
  - js/supabase.js (config + encryption)
  - js/utils.js (shared utilities)
  - js/auth.js (authentication)
  - js/projects.js (project management)
  - js/table.js (table rendering)
  - js/analyze.js (AI analysis)
  - js/reports.js (PDF reports)
  - js/incidents.js (incident tracking)
  - js/export.js (export utilities)

#### `fmea_tool_adv_2.html` (190 KB)
- **Purpose:** Legacy/backup version
- **Status:** Not actively used (reference only)
- **Note:** Kept for fallback if needed

---

### 🔐 **Authentication & Encryption**

#### `js/auth.js` (14 KB) - **MODIFIED v1.2.3**
- **Exports:** Authentication functions
- **Key Functions:**
  - `doLogin()` - Email/password login via Supabase
  - `doSignup()` - Email/password signup
  - `doLogout()` - Sign out and clear session
  - `doLoginWithGoogle()` - Google OAuth flow
  - `checkAuthSession()` - Verify logged-in user
  - `toggleSignupMode()` - UI toggle for signup
  - `updateLoginApiKeyUI()` - Dynamic UI for provider selection
- **Security:**
  - Password stored in sessionStorage (RAM-only)
  - sessionStorage cleared on logout/signout
  - OAuth redirect properly configured
  - Auth state listener for real-time updates
- **Integration:** Supabase Auth (email/password + Google OAuth)

#### `js/supabase.js` (8.3 KB) - **MODIFIED v1.2.3**
- **Exports:** Supabase config + encryption functions
- **Key Functions:**
  - `getMasterKey()` - Derives SHA256 hash from email + password
  - `encryptApiKey(key)` - AES-256 encryption with CryptoJS
  - `decryptApiKey(encrypted)` - Smart decryption (AES + base64 fallback)
  - `signupWithEmail()` - Create account via Supabase
  - `loginWithEmail()` - Login via Supabase
  - `signOutUser()` - Sign out
  - `getCurrentUser()` - Get current auth user
  - `getSession()` - Get auth session
  - `onAuthStateChanged()` - Listen to auth events
- **Encryption Details:**
  - Algorithm: AES-256 (via CryptoJS)
  - Master Key: SHA256(email + password hash)
  - Encrypted keys start with `U2FsdGVkX1` (AES salt prefix)
  - Backward compatible with base64-encoded legacy keys
- **Database Tables:**
  - `api_keys` - Stores encrypted keys per provider
  - `provider_settings` - Stores Groq model, max tokens
- **Config:**
  ```javascript
  SUPABASE_URL = 'https://eyzbfylsbicoeoszcxfs.supabase.co'
  SUPABASE_KEY = 'sb_publishable_O0rVrSLmUaV9Qg0ZcyRzEA_uRp2dNhN'
  ```

---

### 💾 **Data Storage & Abstraction**

#### `js/utils.js` (16 KB) - **MODIFIED v1.2.3**
- **Exports:** Storage abstraction + shared helpers
- **Key Objects:**
  - `Storage` - Abstract storage layer (get/set/delete)
    - Routes keys to appropriate Supabase tables
    - Fallback to localStorage for offline cache
    - Handles key parsing and validation
- **Storage Routing:**
  - `proj:*:*` → `projects` table
  - `projlist:*` → Query all projects
  - `incidents:*:*` → `incidents` table
  - `apikey:*:*` → `api_keys` table (encrypted)
  - `provider:*` → `provider_settings` table
  - `groqModel:*` → `provider_settings` table
  - `groqMaxTokens:*` → `provider_settings` table
- **Shared Functions:**
  - `newRow(data)` - Create FMEA row with defaults
  - `rpnVal(row)` - Calculate RPN (severity × occurrence × detection)
  - `rpnCls(value)` - Classify risk level (low/med/high/crit)
  - `esc(string)` - HTML escape for security
  - `parseJson(text)` - Parse JSON with fallback
  - `clamp(value, default)` - Clamp value to 1-10
- **Global State:**
  - `currentUser` - Logged-in email
  - `currentProjectId` - Active project
  - `currentMode` - 'simple' or 'advanced'
  - `currentProvider` - 'groq', 'claude', 'gemini', 'ollama'
  - `rows[]` - FMEA rows in memory
  - `fileTexts[]` - Uploaded file contents
  - `incidents[]` - Incident records

---

### 📊 **Core Application Modules**

#### `js/projects.js` (26 KB)
- **Purpose:** Project management (CRUD operations)
- **Key Functions:**
  - `loadDashboard()` - Load project list
  - `newProject()` - Create new project
  - `selectProject(id)` - Load project for editing
  - `saveProject()` - Save project to Supabase
  - `deleteProject(id)` - Delete project with confirmation
  - `exportProject()` - Export as JSON
  - `importProject()` - Import from JSON
  - `switchMode()` - Toggle simple/advanced FMEA mode
  - `setProjectMetadata()` - Update project info
- **Database Table:** `projects`
  - Fields: name, description, mode, company, customer, owner, etc.
  - RLS: User can only access own projects

#### `js/table.js` (25 KB)
- **Purpose:** FMEA table rendering and editing
- **Key Functions:**
  - `buildHeader()` - Create table header
  - `renderTable()` - Render all rows
  - `insertRow(idx)` - Insert new row at position
  - `deleteRow(idx)` - Delete row
  - `editCell(rowIdx, field, value)` - Update cell value
  - `toggleRowHeight(idx)` - Expand/collapse row
  - `adjustColWidths()` - Responsive column sizing
  - `updateRPNDisplay()` - Recalculate RPN values
- **Supports:**
  - Inline editing
  - Row expansion for longer text
  - Dynamic column hiding (Cause, Action)
  - RPN calculation and color coding
  - Drag-to-resize columns

#### `js/analyze.js` (24 KB)
- **Purpose:** AI-powered FMEA analysis
- **Key Functions:**
  - `analyzeFmea()` - Call AI API to analyze rows
  - `setSortOrder()` - Sort by RPN, severity, etc.
  - `generateSuggestions()` - Generate remedial actions
  - `explainRPN()` - Explain RPN calculations
- **Providers Supported:**
  - Claude (Anthropic) - `sk-ant-*`
  - Gemini (Google) - `AIza*`
  - Groq - `gsk_*`
  - Ollama (local) - no key needed
- **Features:**
  - Uses encrypted API keys from storage
  - Generates failure mode analysis
  - Suggests detective actions
  - Uses AI to enhance FMEA data

#### `js/incidents.js` (14 KB)
- **Purpose:** Incident tracking and logging
- **Key Functions:**
  - `renderIncidents()` - Display incidents table
  - `newIncident()` - Create incident record
  - `attachFileToIncident()` - Upload file (bytea)
  - `deleteIncident(id)` - Remove incident
  - `linkIncidentToFMEA()` - Associate with FMEA row
- **Database Table:** `incidents`
  - Fields: description, timestamp, file_data, fmea_row_id
  - RLS: User can only access own incidents

#### `js/reports.js` (20 KB)
- **Purpose:** Report generation and PDF export
- **Key Functions:**
  - `generateReport()` - Create detailed FMEA report
  - `exportPDF()` - Export as PDF (uses jsPDF)
  - `generateSummary()` - Summary statistics
  - `riskMatrix()` - Create risk severity matrix
  - `actionItems()` - List open action items
- **Report Sections:**
  - Project metadata
  - FMEA table (all rows)
  - RPN summary statistics
  - Risk matrix visualization
  - Action items with owners/due dates
  - Incident summary

#### `js/export.js` (1.9 KB)
- **Purpose:** Export utilities
- **Key Functions:**
  - `downloadJSON()` - Export project as JSON
  - `downloadCSV()` - Export FMEA rows as CSV
  - `downloadPDF()` - Export report as PDF
- **Helper:**
  - `dl(content, name, type)` - Generic download function

---

### 📚 **Database**

#### `supabase-schema.sql` (8.9 KB)
- **Purpose:** Supabase database schema definition
- **Tables Created:**
  1. `profiles` - User profiles (extends auth.users)
  2. `projects` - FMEA projects
  3. `fmea_rows` - Failure analysis records
  4. `incidents` - Incident tracking
  5. `api_keys` - Encrypted API keys
  6. `provider_settings` - Model configs (Groq)
- **Row Level Security:** RLS policies on all tables
  - Each user can only see/edit own data
  - Policy: `WHERE auth.uid() = user_id`
- **Indexes:** Created on user_id, project_id for performance
- **Constraints:** Foreign keys, CHECK constraints for RPN values

---

### 🎨 **Styling**

#### `css/styles.css` (34 KB)
- **Purpose:** Application styling and layout
- **Features:**
  - Dark blue professional theme
  - Responsive design
  - FMEA table styling
  - Modal dialogs
  - Button and form styles
  - Icon integration (Bootstrap Icons)
  - Dark mode considerations
  - Print-friendly styles for PDF export

---

### 📖 **Libraries**

#### `js/supabase-lib.js` (192 KB)
- **Purpose:** Supabase JavaScript client library
- **Version:** ~4.0.2
- **Source:** CDN copy for offline use
- **Usage:** Loaded in index.html
- **Provides:**
  - Auth methods (signUp, signInWithPassword, signInWithOAuth, signOut)
  - Database queries (select, insert, update, delete, upsert)
  - RLS enforcement
  - Real-time subscriptions (optional)

---

### 📄 **Documentation Files**

#### `README.md` (6.8 KB)
- Main project documentation
- Feature overview
- Getting started
- Deployment instructions

#### `TEST_VERIFICATION_REPORT.md` (6.6 KB)
- Comprehensive test results
- 10 passing tests documented
- Security verification checklist
- Production readiness confirmation

#### `SUPABASE_TESTING_GUIDE.md` (7.6 KB)
- Supabase setup instructions
- Database schema deployment
- RLS policy verification
- Testing procedures

#### `BUILD_INSTRUCTIONS.md` (3.9 KB)
- Local development setup
- Build process
- GitHub Pages deployment
- Troubleshooting guide

#### `FMEA_TOOL_MODULARIZATION_HANDOFF_2_FINAL.md` (15 KB)
- Architecture documentation
- Module breakdown
- Development notes
- Future enhancement suggestions

---

### 🔨 **Build & Configuration**

#### `build.js` (2.3 KB)
- Node.js build script
- Minification utilities
- Deployment helpers

#### `build.ps1` (2.1 KB)
- PowerShell build script
- Windows deployment automation

#### `_config.yml` (106 B)
- Jekyll configuration
- GitHub Pages settings
- Skip Jekyll processing flag

#### `.claude/launch.json`
- Claude Code preview server configuration
- Port 8080 configuration
- Development environment setup

---

## Statistics

| Metric | Value |
|--------|-------|
| **Total Size** | ~329 KB |
| **HTML Files** | 2 (index.html + legacy) |
| **JavaScript Files** | 10 modules |
| **CSS Files** | 1 stylesheet |
| **JavaScript Total** | 356 KB |
| **Database Schema** | 1 SQL file |
| **Documentation** | 5 markdown files |
| **Build Scripts** | 2 (Node.js + PowerShell) |

---

## Technology Stack

### Frontend
- **HTML5** - Semantic markup
- **CSS3** - Responsive design
- **JavaScript (ES6)** - Client-side logic
- **Bootstrap Icons** - UI icons
- **jsPDF** - PDF generation

### Backend/Database
- **Supabase** - PostgreSQL + Auth + RLS
- **Row Level Security** - Data isolation
- **Google OAuth** - SSO authentication

### Security
- **CryptoJS** - AES-256 encryption
- **SHA256** - Key derivation
- **sessionStorage** - Secure password storage
- **HTTPS/TLS** - Transport security

### Deployment
- **GitHub Pages** - Static hosting
- **GitHub** - Version control
- **Supabase Cloud** - Database hosting

---

## Key Features by File

| Feature | Primary File | Supporting Files |
|---------|--------------|------------------|
| Authentication | auth.js | supabase.js, utils.js |
| Data Encryption | supabase.js | utils.js |
| Project Management | projects.js | utils.js, auth.js |
| FMEA Table | table.js | utils.js |
| AI Analysis | analyze.js | utils.js, projects.js |
| Incident Tracking | incidents.js | utils.js |
| Report Generation | reports.js | table.js, utils.js |
| Data Export | export.js | utils.js |
| Database | supabase-schema.sql | supabase.js, utils.js |

---

## Notes for Developers

1. **Modular Architecture** - Each JS file is self-contained with clear responsibilities
2. **Storage Abstraction** - All data access goes through Storage.get/set/delete in utils.js
3. **RLS Enforcement** - Database enforces user data isolation automatically
4. **Encryption** - API keys encrypted before leaving client
5. **Offline Support** - localStorage cache for offline functionality
6. **Version Control** - Version (1.2.3) in utils.js, updated with each release

---

## Deployment Checklist

- ✅ Code organized in folders (css/, js/)
- ✅ Database schema ready (supabase-schema.sql)
- ✅ Documentation complete (5 markdown files)
- ✅ Build scripts ready (2 scripts)
- ✅ All tests passing (TEST_VERIFICATION_REPORT.md)
- ✅ GitHub repository synchronized
- ✅ Supabase instance configured
- ✅ Production ready 🚀

# FMEA Tool - Automatic Versioning & Build System

## Quick Start

Before deploying a new version, run the build script to automatically update version and timestamp.

### Windows (PowerShell - Recommended)

```powershell
.\build.ps1 -Type patch
```

Or use the default (patch):
```powershell
.\build.ps1
```

### Cross-Platform (Node.js)

```bash
node build.js patch
```

Or use the default (patch):
```bash
node build.js
```

## Version Types

- **patch** (default): Bug fixes, small improvements (1.0.0 → 1.0.1)
- **minor**: New features, backward compatible (1.0.0 → 1.1.0)
- **major**: Breaking changes, major releases (1.0.0 → 2.0.0)

## Examples

```powershell
# Bug fix release
.\build.ps1 -Type patch

# New feature
.\build.ps1 -Type minor

# Major version
.\build.ps1 -Type major
```

## What the Build Script Does

1. ✅ Reads current version from `js/utils.js`
2. ✅ Increments version based on type (major/minor/patch)
3. ✅ Updates `APP_VERSION` constant
4. ✅ Updates `COMPILE_TIME` to current UTC timestamp
5. ✅ Displays formatted output showing old → new version and timestamp

## Example Output

```
✅ Build successful!
📦 Version: 1.0.0 → 1.0.1 (patch)
⏰ Timestamp: 2026-04-27T14:32:45.123Z
📝 Updated: C:\Software\Claude\fmea_tool\fmea-tool\js\utils.js

   Display: ver.: 1.0.1
   Display: Built: 04/27/2026 14:32:45 UTC
```

## Integration with Git Workflow

### Option 1: Manual (Recommended for Control)

Before committing a new release:

```powershell
# Make your changes, test, etc.
git status

# Run build before commit
.\build.ps1 -Type minor  # or patch/major

# Commit with version bump
git add .
git commit -m "Release v1.1.0"
git tag v1.1.0
```

### Option 2: Pre-Commit Hook (Automatic)

Create a file `.git/hooks/pre-commit`:

**On Windows with PowerShell:**

```powershell
#!/usr/bin/env powershell
# .git/hooks/pre-commit

# Automatically bump patch version before commit
Write-Host "🔨 Running pre-commit build..."
& ".\build.ps1" -Type patch

# Exit with build script status
exit $LASTEXITCODE
```

**Make it executable (Git Bash):**
```bash
chmod +x .git/hooks/pre-commit
```

**On Unix/Mac:**

Create `.git/hooks/pre-commit`:
```bash
#!/bin/bash
node build.js patch
exit $?
```

Then make it executable:
```bash
chmod +x .git/hooks/pre-commit
```

## Workflow Examples

### Scenario 1: Bug Fix Release

```powershell
# Fix a bug
# ... edit code ...

# Run tests
# ... verify fix ...

# Build and bump patch version
.\build.ps1 -Type patch
# Output: 1.0.0 → 1.0.1

# Commit
git add .
git commit -m "Fix Groq model selection bug"
```

### Scenario 2: New Feature Release

```powershell
# Add new feature
# ... edit code ...

# Run tests
# ... verify feature ...

# Build and bump minor version
.\build.ps1 -Type minor
# Output: 1.0.1 → 1.1.0

# Commit and tag
git add .
git commit -m "Add provider selection for Groq"
git tag v1.1.0
```

### Scenario 3: Major Release

```powershell
# Significant refactor or breaking changes
# ... edit code ...

# Build and bump major version
.\build.ps1 -Type major
# Output: 1.1.0 → 2.0.0

# Commit and tag
git add .
git commit -m "Major refactor: modular architecture"
git tag v2.0.0
```

## Version Display

Users see the version on the login screen:

```
ver.: 1.0.1
Built: 04/27/2026 14:32:45 UTC
```

The version is always up-to-date because it's automatically updated before each release.

## Troubleshooting

**PowerShell Execution Policy Error?**
```powershell
Set-ExecutionPolicy -ExecutionPolicy RemoteSigned -Scope CurrentUser
```

**Node.js not installed?**
Use the PowerShell script instead (Windows native, no dependencies).

**Need to undo a version bump?**
Edit `js/utils.js` manually and change:
```javascript
var APP_VERSION = '1.0.0';  // Your desired version
var COMPILE_TIME = '2026-04-27T14:32:45.123Z';  // Current UTC time
```

## Current Version

Check the login screen or run:
```bash
grep "APP_VERSION" js/utils.js
```

# FMEA Tool Build Script (PowerShell)
# Updates version and compilation timestamp automatically
# Usage: .\build.ps1 -Type major|minor|patch
# Default: patch

param(
    [ValidateSet('major', 'minor', 'patch')]
    [string]$Type = 'patch'
)

$utilsPath = Join-Path (Split-Path $MyInvocation.MyCommand.Path) 'fmea-tool' 'js' 'utils.js'

try {
    # Read current utils.js
    $content = Get-Content $utilsPath -Raw

    # Extract current version
    if ($content -match "var APP_VERSION = '([^']+)'") {
        $currentVersion = $matches[1]
    } else {
        Write-Host "❌ Could not find APP_VERSION in utils.js" -ForegroundColor Red
        exit 1
    }

    # Parse version
    $parts = $currentVersion -split '\.'
    $major = [int]$parts[0]
    $minor = [int]$parts[1]
    $patch = [int]$parts[2]

    # Calculate new version
    switch ($Type) {
        'major' {
            $major++
            $minor = 0
            $patch = 0
        }
        'minor' {
            $minor++
            $patch = 0
        }
        'patch' {
            $patch++
        }
    }

    $newVersion = "$major.$minor.$patch"

    # Get current timestamp (ISO 8601)
    $now = [System.DateTime]::UtcNow.ToString('o')

    # Update version
    $content = $content -replace "var APP_VERSION = '[^']+'", "var APP_VERSION = '$newVersion'"

    # Update timestamp
    $content = $content -replace "var COMPILE_TIME = '[^']+'", "var COMPILE_TIME = '$now'"

    # Write back
    Set-Content $utilsPath $content -Encoding UTF8

    # Print result
    Write-Host ""
    Write-Host "✅ Build successful!" -ForegroundColor Green
    Write-Host "📦 Version: $currentVersion → $newVersion ($Type)"
    Write-Host "⏰ Timestamp: $now"
    Write-Host "📝 Updated: $utilsPath"
    Write-Host ""

    # Show formatted timestamp
    $d = [System.DateTime]::Parse($now)
    $formatted = $d.ToUniversalTime().ToString('MM/dd/yyyy HH:mm:ss')
    Write-Host "   Display: ver.: $newVersion"
    Write-Host "   Display: Built: $formatted UTC"
    Write-Host ""

} catch {
    Write-Host "❌ Build failed: $_" -ForegroundColor Red
    exit 1
}

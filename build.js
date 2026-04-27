#!/usr/bin/env node

/**
 * FMEA Tool Build Script
 * Automatically updates version and compilation timestamp
 * Usage: node build.js [major|minor|patch]
 * Default: patch (bug fix)
 */

const fs = require('fs');
const path = require('path');

const utilsPath = path.join(__dirname, 'fmea-tool', 'js', 'utils.js');

// Parse command line arguments
const versionType = process.argv[2] || 'patch';
if (!['major', 'minor', 'patch'].includes(versionType)) {
  console.error('❌ Invalid version type. Use: major, minor, or patch');
  process.exit(1);
}

try {
  // Read current utils.js
  let content = fs.readFileSync(utilsPath, 'utf8');

  // Extract current version
  const versionMatch = content.match(/var APP_VERSION = '([^']+)'/);
  if (!versionMatch) {
    console.error('❌ Could not find APP_VERSION in utils.js');
    process.exit(1);
  }

  const currentVersion = versionMatch[1];
  const [major, minor, patch] = currentVersion.split('.').map(Number);

  // Calculate new version
  let newVersion;
  if (versionType === 'major') {
    newVersion = `${major + 1}.0.0`;
  } else if (versionType === 'minor') {
    newVersion = `${major}.${minor + 1}.0`;
  } else {
    newVersion = `${major}.${minor}.${patch + 1}`;
  }

  // Get current timestamp
  const now = new Date().toISOString();

  // Update version
  content = content.replace(
    /var APP_VERSION = '[^']+'/,
    `var APP_VERSION = '${newVersion}'`
  );

  // Update timestamp
  content = content.replace(
    /var COMPILE_TIME = '[^']+';/,
    `var COMPILE_TIME = '${now}';`
  );

  // Write back
  fs.writeFileSync(utilsPath, content, 'utf8');

  // Print result
  console.log('\n✅ Build successful!');
  console.log(`📦 Version: ${currentVersion} → ${newVersion} (${versionType})`);
  console.log(`⏰ Timestamp: ${now}`);
  console.log(`📝 Updated: ${utilsPath}\n`);

  // Show formatted timestamp for reference
  const d = new Date(now);
  const formatted = d.toLocaleString('en-US', {
    year: 'numeric',
    month: '2-digit',
    day: '2-digit',
    hour: '2-digit',
    minute: '2-digit',
    second: '2-digit',
    timeZone: 'UTC'
  });
  console.log(`   Display: ver.: ${newVersion}`);
  console.log(`   Display: Built: ${formatted} UTC\n`);

} catch (error) {
  console.error('❌ Build failed:', error.message);
  process.exit(1);
}

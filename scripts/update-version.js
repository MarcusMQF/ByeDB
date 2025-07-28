#!/usr/bin/env node

const fs = require('fs');
const path = require('path');

// Configuration
const PACKAGE_JSON_PATH = path.join(__dirname, '../frontend/package.json');
const VERSION_FILE_PATH = path.join(__dirname, '../frontend/lib/version.json');

// Get current timestamp for build date
const buildDate = new Date().toISOString();

// Get commit hash from git (if available)
function getCommitHash() {
  try {
    const { execSync } = require('child_process');
    return execSync('git rev-parse --short HEAD', { encoding: 'utf8' }).trim();
  } catch (error) {
    console.warn('Could not get commit hash:', error.message);
    return 'unknown';
  }
}

// Read current version from package.json
function getCurrentVersion() {
  try {
    const packageJson = JSON.parse(fs.readFileSync(PACKAGE_JSON_PATH, 'utf8'));
    return packageJson.version;
  } catch (error) {
    console.error('Error reading package.json:', error.message);
    process.exit(1);
  }
}

// Generate build number (increment from previous or start from 1)
function getBuildNumber() {
  try {
    if (fs.existsSync(VERSION_FILE_PATH)) {
      const versionData = JSON.parse(fs.readFileSync(VERSION_FILE_PATH, 'utf8'));
      const currentBuild = parseInt(versionData.buildNumber) || 0;
      return (currentBuild + 1).toString();
    }
  } catch (error) {
    console.warn('Could not read previous version file:', error.message);
  }
  return '1';
}

// Update version information
function updateVersion() {
  const currentVersion = getCurrentVersion();
  const buildNumber = getBuildNumber();
  const commitHash = getCommitHash();

  const versionInfo = {
    version: currentVersion,
    buildNumber,
    buildDate,
    commitHash,
  };

  // Write version info to file
  fs.writeFileSync(VERSION_FILE_PATH, JSON.stringify(versionInfo, null, 2));

  // Create environment variables for build
  const envVars = {
    NEXT_PUBLIC_APP_VERSION: currentVersion,
    NEXT_PUBLIC_BUILD_NUMBER: buildNumber,
    NEXT_PUBLIC_BUILD_DATE: buildDate,
    NEXT_PUBLIC_COMMIT_HASH: commitHash,
  };

  // Write to .env.local for local development
  const envContent = Object.entries(envVars)
    .map(([key, value]) => `${key}=${value}`)
    .join('\n');

  fs.writeFileSync(path.join(__dirname, '../frontend/.env.local'), envContent);

  console.log('✅ Version updated successfully:');
  console.log(`   Version: ${currentVersion}`);
  console.log(`   Build: ${buildNumber}`);
  console.log(`   Date: ${buildDate}`);
  console.log(`   Commit: ${commitHash}`);

  return versionInfo;
}

// Run the update
if (require.main === module) {
  updateVersion();
}

module.exports = { updateVersion }; 
#!/usr/bin/env node

const fs = require('fs');
const path = require('path');

// Configuration
const PACKAGE_JSON_PATH = path.join(__dirname, '../frontend/package.json');
const VERSION_TXT_PATH = path.join(__dirname, '../frontend/lib/version_string.txt');

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
    // Read from .env.local if it exists to get previous build number
    const envPath = path.join(__dirname, '../frontend/.env.local');
    if (fs.existsSync(envPath)) {
      const envContent = fs.readFileSync(envPath, 'utf8');
      const buildNumberMatch = envContent.match(/NEXT_PUBLIC_BUILD_NUMBER=(\d+)/);
      if (buildNumberMatch) {
        const currentBuild = parseInt(buildNumberMatch[1]) || 0;
        return (currentBuild + 1).toString();
      }
    }
  } catch (error) {
    console.warn('Could not read previous build number:', error.message);
  }
  return '1';
}

// Update version information
function updateVersion() {
  const currentVersion = getCurrentVersion();
  const buildNumber = getBuildNumber();
  const commitHash = getCommitHash();

  // Write version to text file (for deployment script)
  fs.writeFileSync(VERSION_TXT_PATH, currentVersion.trim());

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

  return { currentVersion, buildNumber, buildDate, commitHash };
}

// Run the update
if (require.main === module) {
  updateVersion();
}

module.exports = { updateVersion };
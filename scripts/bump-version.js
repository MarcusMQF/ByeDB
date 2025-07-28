#!/usr/bin/env node

const fs = require('fs');
const path = require('path');

const PACKAGE_JSON_PATH = path.join(__dirname, '../frontend/package.json');

// Parse version string (e.g., "1.2.3")
function parseVersion(version) {
  const parts = version.split('.').map(Number);
  return {
    major: parts[0] || 0,
    minor: parts[1] || 0,
    patch: parts[2] || 0,
  };
}

// Format version object back to string
function formatVersion(versionObj) {
  return `${versionObj.major}.${versionObj.minor}.${versionObj.patch}`;
}

// Bump version based on type
function bumpVersion(currentVersion, type = 'patch') {
  const version = parseVersion(currentVersion);
  
  switch (type) {
    case 'major':
      version.major++;
      version.minor = 0;
      version.patch = 0;
      break;
    case 'minor':
      version.minor++;
      version.patch = 0;
      break;
    case 'patch':
    default:
      version.patch++;
      break;
  }
  
  return formatVersion(version);
}

// Update package.json version
function updatePackageVersion(newVersion) {
  try {
    const packageJson = JSON.parse(fs.readFileSync(PACKAGE_JSON_PATH, 'utf8'));
    const oldVersion = packageJson.version;
    packageJson.version = newVersion;
    
    fs.writeFileSync(PACKAGE_JSON_PATH, JSON.stringify(packageJson, null, 2) + '\n');
    
    console.log(`✅ Version updated: ${oldVersion} → ${newVersion}`);
    return newVersion;
  } catch (error) {
    console.error('❌ Error updating package.json:', error.message);
    process.exit(1);
  }
}

// Main function
function main() {
  const args = process.argv.slice(2);
  const bumpType = args[0] || 'patch';
  
  if (!['major', 'minor', 'patch'].includes(bumpType)) {
    console.error('❌ Invalid bump type. Use: major, minor, or patch');
    process.exit(1);
  }
  
  try {
    const packageJson = JSON.parse(fs.readFileSync(PACKAGE_JSON_PATH, 'utf8'));
    const currentVersion = packageJson.version;
    const newVersion = bumpVersion(currentVersion, bumpType);
    
    updatePackageVersion(newVersion);
    
    console.log(`\n📝 Next steps:`);
    console.log(`   1. Commit the version change: git add . && git commit -m "Bump version to ${newVersion}"`);
    console.log(`   2. Run deployment: ./deploy_merge.sh`);
    console.log(`   3. The sidebar will show v${newVersion} after deployment`);
    
  } catch (error) {
    console.error('❌ Error:', error.message);
    process.exit(1);
  }
}

if (require.main === module) {
  main();
}

module.exports = { bumpVersion, updatePackageVersion }; 
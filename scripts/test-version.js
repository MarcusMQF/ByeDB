#!/usr/bin/env node

const fs = require('fs');
const path = require('path');

// Test the version system
function testVersionSystem() {
  console.log('🧪 Testing Version System...\n');

  // 1. Test package.json version
  const packageJsonPath = path.join(__dirname, '../frontend/package.json');
  const packageJson = JSON.parse(fs.readFileSync(packageJsonPath, 'utf8'));
  console.log(`✅ Package.json version: ${packageJson.version}`);

  // 2. Test next.config.mjs reads package.json correctly
  const nextConfigPath = path.join(__dirname, '../frontend/next.config.mjs');
  const nextConfigContent = fs.readFileSync(nextConfigPath, 'utf8');
  
  if (nextConfigContent.includes('packageJson.version')) {
    console.log('✅ Next.config.mjs reads package.json version correctly');
  } else {
    console.log('❌ Next.config.mjs does not read package.json version');
  }

  // 3. Test version.ts fallback
  const versionTsPath = path.join(__dirname, '../frontend/lib/version.ts');
  const versionTsContent = fs.readFileSync(versionTsPath, 'utf8');
  
  if (versionTsContent.includes('process.env.NEXT_PUBLIC_APP_VERSION')) {
    console.log('✅ Version.ts uses NEXT_PUBLIC_APP_VERSION correctly');
  } else {
    console.log('❌ Version.ts does not use NEXT_PUBLIC_APP_VERSION');
  }

  // 4. Test update-version.js
  try {
    const { updateVersion } = require('./update-version.js');
    const result = updateVersion();
    console.log(`✅ Update-version.js works: ${result.currentVersion}`);
  } catch (error) {
    console.log(`❌ Update-version.js failed: ${error.message}`);
  }

  // 5. Test manual bump script
  try {
    const { bumpVersion } = require('./bump-version.js');
    const testVersion = bumpVersion('1.9.0', 'patch');
    console.log(`✅ Bump-version.js works: 1.9.0 → ${testVersion}`);
  } catch (error) {
    console.log(`❌ Bump-version.js failed: ${error.message}`);
  }

  console.log('\n📋 Version System Summary:');
  console.log(`   - Main version source: package.json (${packageJson.version})`);
  console.log(`   - Display: sidebar shows v${packageJson.version}`);
  console.log(`   - Manual bump: npm run version:patch/minor/major`);
  console.log(`   - Build info: npm run version:update`);
  console.log(`   - No auto-bump: manual version management only`);
}

if (require.main === module) {
  testVersionSystem();
}

module.exports = { testVersionSystem };
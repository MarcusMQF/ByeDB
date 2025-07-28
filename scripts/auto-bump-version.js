#!/usr/bin/env node

const fs = require('fs');
const path = require('path');
const { execSync } = require('child_process');

const PACKAGE_JSON_PATH = path.join(__dirname, '../frontend/package.json');
const VERSION_JSON_PATH = path.join(__dirname, '../frontend/lib/version.json');

// Parse version string (e.g., "2.0.0")
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

// Analyze git commits to determine version bump type
function analyzeCommits(sinceCommitHash = null, lastVersion = null) {
  try {
    let commits;

    const commitRange = sinceCommitHash
      ? `${sinceCommitHash}..HEAD`
      : lastVersion
      ? `v${lastVersion}..HEAD`
      : null;

    try {
      if (commitRange) {
        commits = execSync(`git log ${commitRange} --oneline`, { encoding: 'utf8' }).trim();
      } else {
        commits = execSync('git log -10 --oneline', { encoding: 'utf8' }).trim();
      }
    } catch (error) {
      commits = execSync('git log -10 --oneline', { encoding: 'utf8' }).trim();
    }

    if (!commits) {
      console.log('No new commits found, no version bump needed');
      return null;
    }

    const commitLines = commits.split('\n').filter(line => line.trim());

    // Analyze commit messages for version bump indicators
    let hasBreakingChanges = false;
    let hasNewFeatures = false;
    let hasBugFixes = false;

    for (const commit of commitLines) {
      const message = commit.toLowerCase();

      // Check for breaking changes
      if (
        message.includes('breaking') ||
        message.includes('major') ||
        message.includes('!feat') ||
        message.includes('!fix') ||
        message.includes('!refactor') ||
        message.includes('!perf') ||
        message.includes('!docs') ||
        message.includes('!style') ||
        message.includes('!test') ||
        message.includes('!chore') ||
        message.includes('!ci') ||
        message.includes('!build') ||
        message.includes('!revert')
      ) {
        hasBreakingChanges = true;
      }

      // Check for new features
      if (
        message.includes('feat') ||
        message.includes('feature') ||
        message.includes('add') ||
        message.includes('new') ||
        message.includes('implement')
      ) {
        hasNewFeatures = true;
      }

      // Check for bug fixes
      if (
        message.includes('fix') ||
        message.includes('bug') ||
        message.includes('patch') ||
        message.includes('resolve') ||
        message.includes('correct')
      ) {
        hasBugFixes = true;
      }
    }

    // Determine bump type based on commit analysis
    if (hasBreakingChanges) {
      return 'major';
    } else if (hasNewFeatures) {
      return 'minor';
    } else if (hasBugFixes) {
      return 'patch';
    } else {
      return 'patch'; // Default fallback
    }
  } catch (error) {
    console.warn('Could not analyze commits:', error.message);
    return 'patch'; // Default fallback
  }
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
  try {
    const packageJson = JSON.parse(fs.readFileSync(PACKAGE_JSON_PATH, 'utf8'));
    const versionJson = JSON.parse(fs.readFileSync(VERSION_JSON_PATH, 'utf8'));

    const currentVersion = packageJson.version;
    const sinceCommitHash = versionJson.commitHash;

    console.log(`Current version: ${currentVersion}`);
    console.log(`Last build commit: ${sinceCommitHash}`);
    console.log('Analyzing commits to determine version bump type...');

    const bumpType = analyzeCommits(sinceCommitHash, currentVersion);

    if (!bumpType) {
      console.log('No version bump needed');
      return;
    }

    const newVersion = bumpVersion(currentVersion, bumpType);

    console.log(`Detected ${bumpType} changes, bumping version...`);
    updatePackageVersion(newVersion);

    console.log(`\n📝 Next steps:`);
    console.log(`   1. Review the version change: ${currentVersion} → ${newVersion}`);
    console.log(`   2. Commit the version change: git add . && git commit -m "Bump version to ${newVersion}"`);
    console.log(`   3. Run deployment: ./deploy_merge.sh`);
    console.log(`   4. The sidebar will show v${newVersion} after deployment`);

  } catch (error) {
    console.error('❌ Error:', error.message);
    process.exit(1);
  }
}

if (require.main === module) {
  main();
}

module.exports = { analyzeCommits, bumpVersion, updatePackageVersion };

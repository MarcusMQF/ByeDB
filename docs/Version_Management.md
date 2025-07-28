# Version Management System

This document explains how the automatic version management system works in ByeDB.

## Overview

The version management system automatically updates version information during deployment and displays it in the sidebar. This ensures that:

- Version numbers are updated only on deployment, not on every commit
- **Automatic version bumping** based on commit message analysis
- Build numbers increment automatically with each deployment
- Version information is visible to users in the sidebar
- Version history is tracked with commit hashes and build dates

## How It Works

### 1. Version Display
The version is displayed in the sidebar footer showing the current version number (e.g., "v0.1.0").

### 2. Automatic Version Updates
When you run `./deploy_merge.sh`, the system:
1. **Analyzes commit messages** to determine version bump type (major/minor/patch)
2. **Auto-bumps version** based on commit analysis
3. Updates the build number (increments from previous deployment)
4. Captures the current commit hash
5. Records the build timestamp
6. Creates environment variables for the build process

### 3. Version Information Sources
The system uses multiple sources for version information:
- **Version**: From `frontend/package.json` (manually updated)
- **Build Number**: Auto-incremented on each deployment
- **Build Date**: Current timestamp when deployment runs
- **Commit Hash**: Current git commit hash

## Usage

### Automatic Version Updates (Recommended)
The system automatically determines version bumps based on commit messages:

```bash
# Deploy with automatic version bumping
./deploy_merge.sh
```

The system analyzes your commit messages and bumps:
- **Major** (2.0.0 → 3.0.0): Breaking changes
- **Minor** (2.0.0 → 2.1.0): New features  
- **Patch** (2.0.0 → 2.0.1): Bug fixes

### Manual Version Updates
To manually override the automatic version bumping:

```bash
# Bump patch version (2.0.0 → 2.0.1)
npm run version:patch

# Bump minor version (2.0.0 → 2.1.0)
npm run version:minor

# Bump major version (2.0.0 → 3.0.0)
npm run version:major

# Test automatic version bumping
npm run version:auto
```

### Deployment Process
1. **Make your changes** and commit with appropriate messages (see Commit Message Guide)
2. **Deploy**: `./deploy_merge.sh` (automatically bumps version based on commits)
3. The sidebar will automatically show the new version

### Commit Message Examples
```bash
# This will trigger a minor version bump (2.0.0 → 2.1.0)
git commit -m "feat: Add dark mode support"

# This will trigger a patch version bump (2.0.0 → 2.0.1)  
git commit -m "fix: Resolve login bug"

# This will trigger a major version bump (2.0.0 → 3.0.0)
git commit -m "breaking: Remove deprecated API"
```

### Manual Version Update
To manually update build information without changing version:

```bash
npm run version:update
```

## File Structure

```
scripts/
├── bump-version.js      # Manual version bumping
├── auto-bump-version.js # Automatic version bumping based on commits
├── update-version.js    # Automatic version updates during deployment

frontend/
├── lib/
│   ├── version.ts       # Version management utilities
│   └── version.json     # Current version info (auto-generated)
├── package.json         # Source of version number
└── .env.local          # Environment variables (auto-generated)
```

## Environment Variables

The system creates these environment variables during deployment:

- `NEXT_PUBLIC_APP_VERSION`: Version from package.json
- `NEXT_PUBLIC_BUILD_NUMBER`: Auto-incremented build number
- `NEXT_PUBLIC_BUILD_DATE`: ISO timestamp of build
- `NEXT_PUBLIC_COMMIT_HASH`: Short git commit hash

## Development vs Production

- **Development**: Shows default version (v2.0.0) with build number 1
- **Production**: Shows actual version with incremented build numbers

## Troubleshooting

### Version not updating in sidebar
1. Check if `.env.local` exists in frontend directory
2. Verify environment variables are set correctly
3. Rebuild the application after deployment

### Build number not incrementing
1. Check if `frontend/lib/version.json` exists
2. Ensure the deployment script has write permissions
3. Verify Node.js is available during deployment

### Git commit hash not available
The system will show "unknown" if git is not available or not a git repository. This doesn't affect functionality. 
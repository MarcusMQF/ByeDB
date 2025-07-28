#!/bin/bash

set -e  # Exit immediately on any error

echo "Deploying code from branch 'SC'..."

# Auto-bump version based on commit analysis
echo "🔄 Analyzing commits and auto-bumping version..."
/mnt/d/Program\ Files/nodejs/node.exe scripts/auto-bump-version.js

# Update version information
echo "🔄 Updating version information..."
/mnt/d/Program\ Files/nodejs/node.exe scripts/update-version.js

VERSION=$(cat frontend/lib/version_string.txt)

echo "Extracted version from text file: $VERSION"

# Add the modified version files to staging
git add frontend/lib/version_string.txt
git add frontend/lib/version.json
git add frontend/package.json
git commit -m "version $VERSION"
git push

# Checkout backend-deploy and merge SC
echo "Checking out backend-deploy..."
git checkout backend-deploy
echo "Merging SC into backend-deploy..."
git merge SC
echo "Pushing backend-deploy..."
git push

# Checkout frontend-deploy and merge SC
echo "Checking out frontend-deploy..."
git checkout frontend-deploy
echo "Merging SC into frontend-deploy..."
git merge SC
echo "Pushing frontend-deploy..."
git push

# Return to SC branch
echo "Returning to SC branch..."
git checkout SC

echo "✅ Deployment merge complete with version update: $VERSION"
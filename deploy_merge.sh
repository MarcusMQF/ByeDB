#!/bin/bash

set -e  # Exit immediately on any error

echo "Deploying code from branch 'SC'..."

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

echo "✅ Deployment merge complete."


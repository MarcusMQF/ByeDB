#!/bin/bash

set -e  # Exit immediately on any error

# Checkout backend-deploy and merge main
echo "Checking out backend-deploy..."
git checkout backend-deploy
echo "Merging main into backend-deploy..."
git merge main
echo "Pushing backend-deploy..."
git push

# Checkout frontend-deploy and merge main
echo "Checking out frontend-deploy..."
git checkout frontend-deploy
echo "Merging main into frontend-deploy..."
git merge main
echo "Pushing frontend-deploy..."
git push

# Return to main branch
echo "Returning to main branch..."
git checkout main

echo "✅ Deployment merge complete"
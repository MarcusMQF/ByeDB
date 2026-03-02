git remote set-url deploy https://github.com/stanX19/ByeDB.git

# Checkout backend-deploy and merge main
echo "Checking out backend-deploy..."
git checkout backend-deploy
echo "Merging main into backend-deploy..."
git merge main
echo "Pushing backend-deploy..."
git push -u deploy backend-deploy

# Checkout frontend-deploy and merge main
echo "Checking out frontend-deploy..."
git checkout frontend-deploy
echo "Merging main into frontend-deploy..."
git merge main
echo "Pushing frontend-deploy..."
git push -u deploy frontend-deploy

# Return to main branch
echo "Returning to main branch..."
git checkout main

echo "✅ Deployment setup complete"
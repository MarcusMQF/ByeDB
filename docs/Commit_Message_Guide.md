# Commit Message Guide for Automatic Version Bumping

This guide explains how to write commit messages so that the automatic version bumping system can correctly determine whether to bump major, minor, or patch versions.

## How It Works

The automatic version bumping system analyzes your commit messages since the last version to determine the appropriate version bump:

- **Major Version** (2.0.0 → 3.0.0): Breaking changes
- **Minor Version** (2.0.0 → 2.1.0): New features
- **Patch Version** (2.0.0 → 2.0.1): Bug fixes and improvements

## Commit Message Keywords

### Major Version Bumps (Breaking Changes)
Use these keywords in your commit messages to trigger a major version bump:

```
breaking: Remove deprecated API
major: Change database schema
!feat: New feature with breaking changes
!fix: Fix that breaks existing functionality
!refactor: Refactor that changes public API
!perf: Performance change that breaks compatibility
!docs: Documentation change that affects API
!style: Style change that affects output
!test: Test change that affects behavior
!chore: Chore that breaks something
!ci: CI change that affects deployment
!build: Build change that affects output
!revert: Revert that breaks something
```

### Minor Version Bumps (New Features)
Use these keywords for new features that don't break existing functionality:

```
feat: Add new chat functionality
feature: Implement user authentication
add: Add export to CSV feature
new: New dashboard widget
implement: Implement real-time updates
```

### Patch Version Bumps (Bug Fixes)
Use these keywords for bug fixes and improvements:

```
fix: Fix login bug
bug: Resolve data loading issue
patch: Fix typo in error message
resolve: Resolve memory leak
correct: Correct calculation error
```

## Examples

### Major Version Examples
```bash
git commit -m "breaking: Remove old API endpoints"
git commit -m "major: Change authentication flow"
git commit -m "!feat: Redesign database schema"
```

### Minor Version Examples
```bash
git commit -m "feat: Add dark mode support"
git commit -m "feature: Implement user profiles"
git commit -m "add: Export data to Excel"
```

### Patch Version Examples
```bash
git commit -m "fix: Resolve login timeout issue"
git commit -m "bug: Fix chart rendering bug"
git commit -m "patch: Update error messages"
```

## Automatic Detection Logic

The system analyzes commit messages in this order:

1. **Breaking Changes**: If any commit contains breaking change keywords → **Major bump**
2. **New Features**: If any commit contains feature keywords → **Minor bump**
3. **Bug Fixes**: If any commit contains fix keywords → **Patch bump**
4. **Default**: If no specific keywords found → **Patch bump**

## Best Practices

1. **Be Specific**: Use clear, descriptive commit messages
2. **Use Keywords**: Include the appropriate keywords for version detection
3. **One Change Per Commit**: Keep commits focused on single changes
4. **Consistent Format**: Follow a consistent commit message format

## Manual Override

If you need to manually control version bumping:

```bash
# Manual patch bump
npm run version:patch

# Manual minor bump
npm run version:minor

# Manual major bump
npm run version:major
```

## Testing Your Commit Messages

You can test how your commit messages will be interpreted:

```bash
# Run auto-bump to see what version change would be made
npm run version:auto
```

This will show you what type of version bump would be triggered by your recent commits. 
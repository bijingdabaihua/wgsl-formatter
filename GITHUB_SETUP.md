# GitHub Setup Guide

## Initial Setup

### 1. Create GitHub Repository

If you haven't already created the repository:

1. Go to https://github.com/new
2. Repository name: `wgsl-formatter`
3. Description: `VSCode extension for formatting WebGPU Shading Language (WGSL) files`
4. Choose: Public
5. Don't initialize with README (we already have one)
6. Click "Create repository"

### 2. Push to GitHub

```bash
# Initialize git (if not already done)
git init

# Add all files
git add .

# Create initial commit
git commit -m "Initial commit: WGSL Formatter v0.1.0"

# Add remote repository
git remote add origin https://github.com/bijingdabaihua/wgsl-formatter.git

# Push to GitHub
git branch -M main
git push -u origin main
```

### 3. Configure Repository Settings

1. Go to your repository on GitHub
2. Click "Settings"
3. Under "General":
   - Add topics: `vscode-extension`, `wgsl`, `webgpu`, `formatter`, `shader`
   - Add description: `VSCode extension for formatting WebGPU Shading Language (WGSL) files`

## GitHub Actions Setup

The repository includes GitHub Actions workflows that will automatically:
- Run tests on every push/PR
- Create releases when you push a tag
- Publish to VSCode Marketplace (requires PAT)

### Setting up Marketplace Publishing

To enable automatic publishing to VSCode Marketplace:

1. Create a Personal Access Token (PAT) at https://dev.azure.com/
2. Go to your GitHub repository settings
3. Navigate to "Secrets and variables" → "Actions"
4. Click "New repository secret"
5. Name: `VSCE_PAT`
6. Value: Your Personal Access Token
7. Click "Add secret"

Now when you create a release, it will automatically publish to the marketplace!

## Creating Releases

### Manual Release

```bash
# Update version in package.json
npm version patch  # or minor/major

# Update CHANGELOG.md with changes

# Commit changes
git add .
git commit -m "chore: bump version to 0.1.1"

# Create and push tag
git tag v0.1.1
git push origin main --tags
```

### Using Release Script

```bash
# On Unix/Mac
./scripts/release.sh

# On Windows
.\scripts\release.ps1
```

The script will:
1. Prompt for version bump type (patch/minor/major)
2. Update package.json
3. Update CHANGELOG.md
4. Create git commit and tag
5. Push to GitHub

## Repository Maintenance

### Updating Dependencies

```bash
# Check for outdated packages
npm outdated

# Update all dependencies
npm update

# Update specific package
npm update <package-name>
```

### Running CI Locally

Before pushing, ensure tests pass:

```bash
# Run all tests
npm test

# Check code style
npm run lint

# Type check
npm run typecheck

# Build extension
npm run build
```

## Branch Protection (Optional)

To protect the main branch:

1. Go to repository "Settings" → "Branches"
2. Click "Add rule"
3. Branch name pattern: `main`
4. Enable:
   - Require pull request reviews before merging
   - Require status checks to pass before merging
   - Require branches to be up to date before merging
5. Click "Create"

## Issue Templates (Optional)

Create `.github/ISSUE_TEMPLATE/` directory with templates:

- `bug_report.md` - For bug reports
- `feature_request.md` - For feature requests

## Pull Request Template (Optional)

Create `.github/PULL_REQUEST_TEMPLATE.md` with a template for PRs.

## Useful Commands

```bash
# Clone repository
git clone https://github.com/bijingdabaihua/wgsl-formatter.git

# Create new branch
git checkout -b feature/my-feature

# Push branch
git push origin feature/my-feature

# Pull latest changes
git pull origin main

# View commit history
git log --oneline

# Check status
git status
```

## Next Steps

After pushing to GitHub:

1. ✅ Verify GitHub Actions are running
2. ✅ Add repository topics and description
3. ✅ Create first release (v0.1.0)
4. ✅ Set up VSCE_PAT secret for automatic publishing
5. ✅ Share repository link with users

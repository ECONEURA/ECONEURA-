#!/bin/bash
# Quick validation script for ECONEURA CI/CD setup

set -euo pipefail

echo "🔍 ECONEURA CI/CD Validation"
echo "=============================="

# Check if we're in a git repo
if [ ! -d .git ]; then
    echo "❌ Not a git repository"
    exit 1
fi

# Get repo info
REMOTE_URL="$(git remote get-url origin 2>/dev/null || true)"
if [[ "$REMOTE_URL" =~ github.com[:/](.+)/(.+)(\.git)?$ ]]; then
    GH_OWNER="${BASH_REMATCH[1]}"
    GH_REPO="${BASH_REMATCH[2]%.git}"
    echo "✅ Repository: ${GH_OWNER}/${GH_REPO}"
else
    echo "⚠️  GitHub remote not detected"
    GH_OWNER=""
    GH_REPO=""
fi

# Check workflows
echo ""
echo "📋 Checking Workflows:"
WORKFLOWS=("deploy-web.yml" "deploy-api.yml" "ci-smoke.yml" "ci.yml")
for workflow in "${WORKFLOWS[@]}"; do
    if [ -f ".github/workflows/$workflow" ]; then
        echo "  ✅ $workflow"
    else
        echo "  ❌ $workflow missing"
    fi
done

# Check project structure
echo ""
echo "📁 Checking Project Structure:"
DIRS=("apps/web" "apps/api_py" "packages/shared" "packages/configs")
for dir in "${DIRS[@]}"; do
    if [ -d "$dir" ]; then
        echo "  ✅ $dir/"
    else
        echo "  ❌ $dir/ missing"
    fi
done

# Check key files
echo ""
echo "📄 Checking Key Files:"
FILES=("apps/web/package.json" "apps/api_py/server.py" "package.json" "pnpm-workspace.yaml")
for file in "${FILES[@]}"; do
    if [ -f "$file" ]; then
        echo "  ✅ $file"
    else
        echo "  ❌ $file missing"
    fi
done

# Check for GitHub CLI and secrets (if available)
echo ""
echo "🔐 Checking GitHub Secrets:"
if command -v gh >/dev/null 2>&1 && [ -n "$GH_OWNER" ] && [ -n "$GH_REPO" ]; then
    echo "  GitHub CLI detected, checking secrets..."
    
    REQUIRED_SECRETS=("AZURE_WEBAPP_PUBLISH_PROFILE_WEB" "AZURE_WEBAPP_PUBLISH_PROFILE_API")
    MISSING_SECRETS=()
    
    for secret in "${REQUIRED_SECRETS[@]}"; do
        if gh secret list -R "${GH_OWNER}/${GH_REPO}" | grep -q "^$secret"; then
            echo "  ✅ $secret"
        else
            echo "  ❌ $secret missing"
            MISSING_SECRETS+=("$secret")
        fi
    done
    
    if [ ${#MISSING_SECRETS[@]} -gt 0 ]; then
        echo ""
        echo "⚠️  Missing secrets: ${MISSING_SECRETS[*]}"
        echo "   Go to: https://github.com/${GH_OWNER}/${GH_REPO}/settings/secrets/actions"
        echo "   Add the publish profiles from Azure Portal > App Service > Get Publish Profile"
    fi
else
    echo "  ⚠️  GitHub CLI not available or repo not detected"
    echo "   Install 'gh' CLI and run 'gh auth login' to check secrets automatically"
fi

# Check Azure CLI (optional)
echo ""
echo "☁️  Azure CLI:"
if command -v az >/dev/null 2>&1; then
    echo "  ✅ Azure CLI available"
    if az account show >/dev/null 2>&1; then
        echo "  ✅ Azure CLI authenticated"
    else
        echo "  ⚠️  Azure CLI not authenticated (run 'az login')"
    fi
else
    echo "  ⚠️  Azure CLI not available (install for easier setup)"
fi

echo ""
echo "🎯 Next Steps:"
echo "1. Ensure all missing secrets are added to GitHub repository"
echo "2. Push changes to main/develop branch to trigger workflows"
echo "3. Monitor GitHub Actions for deployment status"
echo "4. Check deployed apps:"
echo "   - Web: https://econeura-web-dev.azurewebsites.net"
echo "   - API: https://econeura-api-dev.azurewebsites.net/api/health"
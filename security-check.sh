#!/bin/bash

# 🔐 Security Validation Script for WebNote
echo "🔐 WebNote Security Validation"
echo "=============================="

# Check if sensitive files are properly ignored
echo "📁 Checking .gitignore configuration..."

if git check-ignore server/config.env >/dev/null 2>&1; then
    echo "✅ server/config.env is properly ignored"
else
    echo "❌ WARNING: server/config.env is NOT ignored by Git!"
fi

if git check-ignore server/.env >/dev/null 2>&1; then
    echo "✅ server/.env is properly ignored"
else
    echo "❌ WARNING: server/.env is NOT ignored by Git!"
fi

if git check-ignore client/.env >/dev/null 2>&1; then
    echo "✅ client/.env is properly ignored"
else
    echo "❌ WARNING: client/.env is NOT ignored by Git!"
fi

# Check if any tracked files contain potential secrets
echo ""
echo "🔍 Scanning for potential secrets in tracked files..."

SECRET_PATTERNS="mongodb+srv|jwt_secret|session_secret|google_client_secret|password|api_key"

if git grep -i "$SECRET_PATTERNS" -- '*.js' '*.json' '*.md' '*.yaml' '*.yml' '*.env*' 2>/dev/null | grep -v "your-" | grep -v "example" | grep -v "template"; then
    echo "❌ WARNING: Potential secrets found in tracked files!"
    echo "   Please review the above results and remove any real secrets."
else
    echo "✅ No obvious secrets found in tracked files"
fi

# Check git history for sensitive files
echo ""
echo "📚 Checking Git history for sensitive file commits..."

if git log --name-only --pretty=format: | grep -E "(config\.env|\.env)$" | grep -v "example" >/dev/null; then
    echo "❌ WARNING: Sensitive files found in Git history!"
    echo "   Consider using git filter-branch or BFG Repo-Cleaner to remove them."
    echo "   More info: https://docs.github.com/en/authentication/keeping-your-account-and-data-secure/removing-sensitive-data-from-a-repository"
else
    echo "✅ No sensitive files found in recent Git history"
fi

echo ""
echo "🎯 Security Recommendations:"
echo "1. Rotate ALL secrets that were exposed (MongoDB, JWT, Session, Google OAuth)"
echo "2. Update environment variables in your Render deployment"
echo "3. Never commit real secrets to version control"
echo "4. Use the provided config.env.example as a template"
echo "5. Run this script before making your repository public"

echo ""
echo "📖 For detailed setup instructions, see: SECURITY_SETUP.md"

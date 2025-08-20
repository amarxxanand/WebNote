#!/bin/bash

# Quick fix for encryption key mismatch
echo "🔧 Fixing Encryption Key Issues"
echo "==============================="

# Check the current user's setup
echo "1. Current encryption status:"
grep -n "encryptionEnabled.*true" client/src/contexts/AuthContext.js

echo
echo "2. Recommend clearing user data to reinitialize encryption keys:"
echo "   - Open browser DevTools (F12)"
echo "   - Go to Application/Storage tab"
echo "   - Clear localStorage for http://localhost:3000"
echo "   - Refresh and login again"

echo
echo "3. This will force a fresh encryption setup with consistent keys"

echo
echo "🔧 Alternative: Reset specific user encryption data"
echo "   Run this in browser console after login:"
echo "   localStorage.removeItem('encryptionInitialized');"
echo "   location.reload();"

# 🔐 Security Setup Guide

## ⚠️ IMPORTANT: Environment Variables Setup

This project requires several environment variables to be configured. **NEVER** commit actual secrets to Git.

### Local Development Setup

1. **Copy the example configuration:**
   ```bash
   cp server/config.env.example server/config.env
   ```

2. **Update `server/config.env` with your actual values:**
   ```env
   # MongoDB Configuration
   MONGODB_URI=your-actual-mongodb-connection-string
   
   # JWT Configuration (generate a strong 64+ character secret)
   JWT_SECRET=your-actual-jwt-secret-here
   
   # Session Configuration (generate a strong 64+ character secret)
   SESSION_SECRET=your-actual-session-secret-here
   
   # Google OAuth Configuration
   GOOGLE_CLIENT_ID=your-actual-google-client-id
   GOOGLE_CLIENT_SECRET=your-actual-google-client-secret
   ```

### Production Deployment (Render)

Set these environment variables in your Render dashboard:

- `MONGODB_URI` - Your MongoDB Atlas connection string
- `JWT_SECRET` - Strong secret key (64+ characters)
- `SESSION_SECRET` - Strong secret key (64+ characters)  
- `GOOGLE_CLIENT_ID` - Google OAuth Client ID
- `GOOGLE_CLIENT_SECRET` - Google OAuth Client Secret
- `NODE_ENV` - Set to `production`

### Generating Secure Secrets

For JWT_SECRET and SESSION_SECRET, use:
```bash
# Generate a 64-character random secret
node -e "console.log(require('crypto').randomBytes(32).toString('hex'))"
```

## Security Checklist

- [ ] `server/config.env` contains only template values
- [ ] `server/.env` is not tracked by Git
- [ ] `client/.env` is not tracked by Git
- [ ] All secrets are set in Render environment variables
- [ ] `.gitignore` includes all environment files
- [ ] No hardcoded secrets in source code

## 🚨 If Secrets Were Exposed

If you accidentally committed secrets:

1. **Immediately rotate all exposed secrets:**
   - Generate new JWT_SECRET and SESSION_SECRET
   - Regenerate Google OAuth credentials
   - Update MongoDB connection string if it contains passwords

2. **Update all deployment environments with new secrets**

3. **Consider the repository compromised until secrets are rotated**

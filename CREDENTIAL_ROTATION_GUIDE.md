# Credential Rotation Guide
**Date:** November 5, 2025
**Priority:** 🔴 CRITICAL - Must be done before production deployment
**Status:** Ready for Execution

---

## ⚠️ SECURITY ALERT

**CRITICAL:** Production credentials were found exposed in `.env.local` during the security audit. These credentials MUST be rotated immediately before any production deployment.

**Exposed Credentials:**
- ❌ Supabase URL (Public, but confirms project)
- ❌ Supabase Anon Key (Public client key)
- ❌ **Supabase Service Role Key** 🔴 CRITICAL - Has admin access to database
- ❌ **GLM API Key** 🔴 CRITICAL - Costs money, could be abused

---

## Impact Assessment

### If Credentials Are Compromised

#### Supabase Service Role Key
- **Access Level:** FULL DATABASE ADMIN
- **Potential Damage:**
  - Read/modify/delete ALL user data
  - Bypass all Row Level Security (RLS) policies
  - Create/delete database tables
  - Access to all user emails, passwords (hashed), FPL data
  - Modify authentication users
- **Mitigation:** Rotate immediately

#### GLM API Key
- **Access Level:** Full API access
- **Potential Damage:**
  - Unlimited API calls = $$$ costs
  - Could drain your account balance
  - API rate limit exhaustion
- **Mitigation:** Rotate immediately

#### Supabase Anon Key
- **Access Level:** Limited (intended for client-side)
- **Potential Damage:** Low if RLS is properly configured
- **Mitigation:** Rotate for good measure

---

## Rotation Plan

### Phase 1: Preparation (15 minutes)

#### 1.1: Inventory Current Credentials

Create a checklist:
```bash
# Current credentials to rotate:
[ ] NEXT_PUBLIC_SUPABASE_URL
[ ] NEXT_PUBLIC_SUPABASE_ANON_KEY
[ ] SUPABASE_SERVICE_ROLE_KEY
[ ] API_KEY (GLM)
```

#### 1.2: Verify Access
- [ ] Access to Supabase dashboard
- [ ] Access to GLM dashboard
- [ ] Access to production deployment platform (Vercel, etc.)
- [ ] Access to git repository

### Phase 2: Supabase Credentials (30 minutes)

#### 2.1: Generate New Supabase Keys

1. **Login to Supabase Dashboard**
   ```
   https://supabase.com/dashboard
   ```

2. **Navigate to Project Settings**
   - Select your project
   - Go to Settings → API

3. **Generate New Anon Key**
   - Click "Reset" next to `anon` key
   - Copy new key immediately
   - Save to secure password manager

4. **Generate New Service Role Key**
   - ⚠️ WARNING: This will invalidate the old key immediately
   - Click "Reset" next to `service_role` key
   - Copy new key immediately
   - Save to secure password manager

5. **Verify Keys Work**
   ```bash
   # Test new anon key
   curl https://your-project.supabase.co/rest/v1/ \
     -H "apikey: NEW_ANON_KEY" \
     -H "Authorization: Bearer NEW_ANON_KEY"

   # Should return database schema info
   ```

#### 2.2: Update Local Environment

1. **Update `.env.local`**
   ```bash
   # OLD (DO NOT USE)
   # NEXT_PUBLIC_SUPABASE_URL=https://old-project.supabase.co
   # NEXT_PUBLIC_SUPABASE_ANON_KEY=old_key_here
   # SUPABASE_SERVICE_ROLE_KEY=old_service_key_here

   # NEW
   NEXT_PUBLIC_SUPABASE_URL=https://your-project.supabase.co
   NEXT_PUBLIC_SUPABASE_ANON_KEY=<NEW_ANON_KEY>
   SUPABASE_SERVICE_ROLE_KEY=<NEW_SERVICE_ROLE_KEY>
   ```

2. **Restart Development Server**
   ```bash
   # Kill current dev server
   # Restart with new credentials
   npm run dev
   ```

3. **Test Application**
   ```bash
   # Test guest login
   curl -X POST http://localhost:3000/api/auth/guest

   # Test regular signup
   curl -X POST http://localhost:3000/api/auth/signup \
     -H "Content-Type: application/json" \
     -d '{"email":"test@test.com","password":"testpass123"}'

   # All should work with new keys
   ```

### Phase 3: GLM API Key (15 minutes)

#### 3.1: Generate New GLM API Key

1. **Login to GLM Dashboard**
   ```
   https://open.bigmodel.cn/
   ```

2. **Navigate to API Keys**
   - Go to Account → API Keys
   - Click "Create New Key"
   - Name it: "FPL Advisor - Production - Nov 2025"
   - Copy new key immediately
   - Save to secure password manager

3. **Revoke Old Key**
   - Find the old API key in the list
   - Click "Revoke" or "Delete"
   - Confirm revocation

#### 3.2: Update Local Environment

1. **Update `.env.local`**
   ```bash
   # OLD (DO NOT USE)
   # API_KEY=old_glm_key_here

   # NEW
   API_KEY=<NEW_GLM_API_KEY>
   ```

2. **Test AI Advisor**
   ```bash
   # Login as guest first
   curl -X POST http://localhost:3000/api/auth/guest

   # Test AI chat (requires auth token)
   curl -X POST http://localhost:3000/api/advisor/chat \
     -H "Authorization: Bearer <TOKEN>" \
     -H "Content-Type: application/json" \
     -d '{"message":"Who should I captain this week?"}'

   # Should get GLM API response
   ```

### Phase 4: Production Deployment (30 minutes)

#### 4.1: Update Production Environment Variables

**For Vercel:**
```bash
1. Go to Vercel Dashboard
2. Select your project
3. Go to Settings → Environment Variables
4. Update each variable:
   - NEXT_PUBLIC_SUPABASE_URL (if changed)
   - NEXT_PUBLIC_SUPABASE_ANON_KEY
   - SUPABASE_SERVICE_ROLE_KEY
   - API_KEY
5. Click "Save"
```

**For Other Platforms:**
- AWS: Update in Parameter Store or Secrets Manager
- Heroku: `heroku config:set KEY=value`
- Railway: Update in project settings
- Docker: Update secrets/env files

#### 4.2: Trigger Redeployment

```bash
# Option 1: Redeploy via dashboard
# Click "Redeploy" in Vercel/platform dashboard

# Option 2: Git push
git commit --allow-empty -m "Trigger redeploy with new credentials"
git push origin main

# Option 3: CLI
vercel --prod  # For Vercel
```

#### 4.3: Verify Production

```bash
# Test production endpoints
curl https://your-app.vercel.app/api/health

curl -X POST https://your-app.vercel.app/api/auth/guest

# Should all work with new credentials
```

### Phase 5: Cleanup (15 minutes)

#### 5.1: Remove from Git History

**⚠️ CRITICAL:** Old credentials may still be in git history

```bash
# Check if .env.local is in git
git log --all --full-history -- .env.local

# If it appears in history, you need to remove it
# This requires force-pushing and is DANGEROUS

# Option 1: Use BFG Repo Cleaner (recommended)
# Download from: https://rtyley.github.io/bfg-repo-cleaner/

java -jar bfg.jar --delete-files .env.local
git reflog expire --expire=now --all
git gc --prune=now --aggressive

# Option 2: Use git filter-branch (harder)
git filter-branch --force --index-filter \
  "git rm --cached --ignore-unmatch .env.local" \
  --prune-empty --tag-name-filter cat -- --all

# Option 3: If repository is small, create a new one
# This is the safest option if unsure
```

**⚠️ WARNING:** Rewriting git history will affect all collaborators. Coordinate with your team.

#### 5.2: Update `.gitignore`

Ensure `.env.local` is properly ignored:

```bash
# .gitignore should contain:
.env*.local
.env.local
.env.development.local
.env.test.local
.env.production.local
```

#### 5.3: Verify Exclusion

```bash
# Check if .env.local is still tracked
git ls-files | grep .env

# Should return nothing

# Try to add it (should be ignored)
git add .env.local

# Should say: "The following paths are ignored by one of your .gitignore files"
```

#### 5.4: Create `.env.example`

Create a template for other developers:

```bash
# .env.example
# Copy this to .env.local and fill in your credentials

# Supabase
NEXT_PUBLIC_SUPABASE_URL=https://your-project.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=your_anon_key_here
SUPABASE_SERVICE_ROLE_KEY=your_service_role_key_here

# GLM AI
API_KEY=your_glm_api_key_here

# Next.js
NODE_ENV=development
NEXT_TELEMETRY_DISABLED=1
```

Commit `.env.example`:
```bash
git add .env.example
git commit -m "Add environment variables template"
git push
```

---

## Post-Rotation Verification

### Checklist

- [ ] All local environment variables updated
- [ ] Development server works with new credentials
- [ ] Production environment variables updated
- [ ] Production deployment successful
- [ ] All API endpoints working in production
- [ ] Old credentials revoked in all services
- [ ] `.env.local` removed from git history
- [ ] `.env.example` created and committed
- [ ] Team notified of credential rotation
- [ ] New credentials stored in password manager

### Test Production

```bash
# Health check
curl https://your-app.vercel.app/api/health

# Guest auth
curl -X POST https://your-app.vercel.app/api/auth/guest

# Signup
curl -X POST https://your-app.vercel.app/api/auth/signup \
  -H "Content-Type: application/json" \
  -d '{"email":"production-test@test.com","password":"testpass123"}'

# All should return 200 OK
```

---

## Future Prevention

### 1. Use Secret Management

**For Production:**
- AWS: AWS Secrets Manager
- GCP: Secret Manager
- Azure: Key Vault
- Vercel: Environment Variables (encrypted)

**For Local Development:**
- Never commit `.env.local`
- Use `.env.example` as template
- Store secrets in password manager (1Password, LastPass, Bitwarden)

### 2. Implement Secret Scanning

**Pre-commit Hook:**
```bash
# .husky/pre-commit
#!/bin/sh

# Check for potential secrets in staged files
if git diff --cached --name-only | grep -E "\.env\.local|\.env" | grep -v "\.env\.example"; then
  echo "❌ Error: Attempting to commit .env.local file!"
  echo "Please remove it from the commit."
  exit 1
fi

# Check for hardcoded secrets
if git diff --cached | grep -E "(supabase.*key|api.*key|secret|password)" | grep -vE "(\.env\.example|README|docs)"; then
  echo "⚠️  Warning: Potential secrets detected in commit!"
  echo "Please review carefully."
  read -p "Continue anyway? (y/n) " -n 1 -r
  echo
  if [[ ! $REPLY =~ ^[Yy]$ ]]; then
    exit 1
  fi
fi
```

**GitHub Secret Scanning:**
- Enable in Settings → Code security and analysis
- Enable secret scanning
- Enable push protection

**GitGuardian:**
- Install GitHub App
- Automatically scans for secrets
- Alerts on commits with secrets

### 3. Rotate Regularly

**Rotation Schedule:**
- Supabase Service Role Key: Every 90 days
- GLM API Key: Every 90 days
- Supabase Anon Key: Yearly (or when compromised)

**Set Calendar Reminders:**
- First rotation: March 1, 2026
- Next rotation: June 1, 2026

### 4. Monitor Usage

**Supabase:**
- Check "API Logs" for unusual activity
- Monitor database queries for suspicious patterns
- Set up alerts for admin operations

**GLM:**
- Monitor API usage and costs
- Set up billing alerts
- Review API logs for unusual patterns

---

## Emergency Procedures

### If Credentials Are Actively Being Abused

1. **IMMEDIATELY** revoke old credentials
2. Generate new credentials
3. Update production ASAP
4. Review logs for damage:
   - Supabase: Check database for unauthorized changes
   - GLM: Check API usage and costs
5. Consider database rollback if data was modified
6. Notify users if their data was accessed
7. File incident report

### If Unsure About Compromise

1. Rotate credentials anyway (better safe than sorry)
2. Review access logs
3. Monitor for unusual activity
4. Consider enabling MFA on service accounts

---

## Summary

### Time Required
- Preparation: 15 min
- Supabase rotation: 30 min
- GLM rotation: 15 min
- Production update: 30 min
- Cleanup: 15 min
- **Total: ~2 hours**

### Cost
- $0 (all rotations are free)

### Risk
- Low if done carefully
- Medium if skipped (credentials could be abused)
- High if credentials are actively compromised

---

## Completion Checklist

### Pre-Rotation
- [ ] Read this entire guide
- [ ] Have access to all required dashboards
- [ ] Backup current `.env.local` file (securely)
- [ ] Notify team of upcoming rotation

### Rotation
- [ ] Generate new Supabase anon key
- [ ] Generate new Supabase service role key
- [ ] Generate new GLM API key
- [ ] Update local `.env.local`
- [ ] Test locally
- [ ] Update production environment variables
- [ ] Deploy to production
- [ ] Test production

### Post-Rotation
- [ ] Revoke old credentials
- [ ] Remove `.env.local` from git history
- [ ] Update `.gitignore`
- [ ] Create `.env.example`
- [ ] Store new credentials in password manager
- [ ] Document rotation in team wiki
- [ ] Set calendar reminder for next rotation (90 days)

---

**Rotation Status:** ⏳ PENDING - Must be completed before production
**Next Rotation Due:** March 1, 2026 (90 days)

**CRITICAL REMINDER:** Do not deploy to production without completing this credential rotation!


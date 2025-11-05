# Quick Fix Checklist for Vercel Deployment Issues

## Immediate Actions (Do These Now!)

### 1. Update Supabase Redirect URLs (CRITICAL)
This is the #1 cause of auth issues!

1. Go to: https://app.supabase.com
2. Select your project
3. Click **Authentication** → **URL Configuration**
4. Add these URLs:

**Site URL:**
```
https://your-vercel-url.vercel.app
```

**Redirect URLs (add ALL of these):**
```
https://your-vercel-url.vercel.app/**
https://your-vercel-url.vercel.app/auth/callback
https://your-vercel-url.vercel.app/dashboard
http://localhost:3000/**
http://localhost:3000/auth/callback
```

5. Click **Save**
6. ⏰ **Wait 2-3 minutes** for changes to propagate

---

### 2. Check Vercel Environment Variables

1. Go to: https://vercel.com/dashboard
2. Select your project
3. Click **Settings** → **Environment Variables**
4. Verify ALL these exist with REAL values:

```bash
NEXT_PUBLIC_SUPABASE_URL=https://xxxxx.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=eyJhbGciOiJI...
SUPABASE_SERVICE_ROLE_KEY=eyJhbGciOiJI...
API_KEY=your_glm_api_key
```

**⚠️ Common Mistakes:**
- Values contain "your_" or "placeholder" → Replace with real values!
- URL doesn't match your Supabase project → Fix it!
- Missing any variable → Add it!

---

### 3. Redeploy with New Code

After pushing the new fixes:

1. Go to Vercel Dashboard
2. Click **Deployments**
3. Find latest deployment
4. Click **"⋯"** → **Redeploy**
5. Check **"Clear Build Cache"**
6. Click **Redeploy**

**⏰ Wait 2-3 minutes for deployment to complete**

---

### 4. Test Environment Variables

Once redeployed, visit:
```
https://your-vercel-url.vercel.app/api/test-env
```

You should see:
```json
{
  "status": "All environment variables configured ✓",
  "environment": {
    "NEXT_PUBLIC_SUPABASE_URL": "✓ Set (https://xxxxx...)",
    "NEXT_PUBLIC_SUPABASE_ANON_KEY": "✓ Set (eyJhbGci...)",
    "SUPABASE_SERVICE_ROLE_KEY": "✓ Set (eyJhbGci...)",
    "API_KEY": "✓ Set (xxxxx...)",
    "allSet": true
  }
}
```

**If any show "✗ MISSING":**
- Go back to step 2
- Add missing variables
- Redeploy again

---

### 5. Test Authentication

Test in this order:

**A. Health Check:**
Visit: `https://your-vercel-url.vercel.app/api/health`
- Should return: `{"status": "ok"}`
- NOT 404!

**B. Guest Mode:**
1. Click "Continue as Guest"
2. Should redirect to `/dashboard`
3. Should NOT redirect to `/login`

**C. Sign Up:**
1. Click "Sign Up"
2. Enter email and password
3. Should show "Account created successfully"
4. Check email for verification

**D. Sign In:**
1. Enter credentials
2. Should redirect to dashboard
3. Session should persist on refresh

---

## Still Not Working?

### Check Browser Console
1. Press **F12**
2. Go to **Console** tab
3. Look for red errors:
   - CORS errors → Check Supabase URLs
   - 404 errors → API routes not deployed
   - Auth errors → Check environment variables

### Check Vercel Function Logs
1. Go to Vercel Dashboard
2. Click **Functions** tab
3. Click on failing function
4. Look for error messages

### Common Error Solutions

**Error: "CORS policy"**
```
Fix: Update Supabase redirect URLs (Step 1 above)
Wait: 2-3 minutes for propagation
```

**Error: "404 on /api/*"**
```
Fix: Redeploy with "Clear Build Cache" checked
Verify: API routes exist in src/app/api/
```

**Error: "Supabase connection failed"**
```
Fix: Check environment variables are correct
Verify: Supabase project is not paused
Test: Can you access Supabase dashboard?
```

**Error: "Invalid API key"**
```
Fix: Check API_KEY environment variable
Verify: GLM API key is valid and has credits
```

---

## What We Fixed

The code changes I just made:

1. ✅ Added `vercel.json` - Proper Vercel configuration
2. ✅ Updated `next.config.ts` - CORS headers and optimization
3. ✅ Added `/api/test-env` - Test endpoint for env vars
4. ✅ Created troubleshooting guides

---

## Post-Fix Verification

After everything is working:

- [ ] Homepage loads
- [ ] Guest mode works
- [ ] Sign up works
- [ ] Sign in works
- [ ] Dashboard loads
- [ ] No 404 errors
- [ ] No console errors

---

## Emergency Rollback

If things get worse:

1. Go to Vercel Dashboard
2. Click **Deployments**
3. Find previous working deployment
4. Click **"⋯"** → **Promote to Production**

---

## Need Help?

**Check these files:**
- `VERCEL_TROUBLESHOOTING.md` - Detailed troubleshooting guide
- `DEPLOYMENT_GUIDE.md` - Full deployment instructions

**Common Issues:**
1. Forgot to update Supabase URLs (90% of problems)
2. Environment variables not set correctly
3. Need to wait 2-3 minutes after changes

---

**Remember:** Most deployment issues are NOT code problems - they're configuration problems!

Good luck! 🚀

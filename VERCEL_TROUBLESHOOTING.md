# Vercel Deployment Troubleshooting Guide

## Quick Fixes for Common Issues

### Issue 1: 404 Errors for API Routes

**Problem:** API routes return 404 errors
**Cause:** Vercel needs proper routing configuration

**Fix:** Create a `vercel.json` file in project root

### Issue 2: Cannot Sign In / Guest Mode Not Working

**Problem:** Authentication fails, stuck on sign-in page
**Causes:**
1. Missing environment variables
2. Supabase redirect URLs not configured
3. CORS issues

---

## Step-by-Step Fixes

### Fix #1: Check Environment Variables in Vercel

1. Go to your Vercel project dashboard
2. Click "Settings" → "Environment Variables"
3. Verify ALL these variables are set:

```
NEXT_PUBLIC_SUPABASE_URL
NEXT_PUBLIC_SUPABASE_ANON_KEY
SUPABASE_SERVICE_ROLE_KEY
API_KEY
```

**IMPORTANT:** Make sure you're using REAL values, not placeholders!

**How to verify:**
- Each variable should have a green checkmark
- Values should NOT contain "your_" or "placeholder"
- URL should be YOUR actual Supabase project URL

**If variables are missing or wrong:**
1. Add/update them in Vercel dashboard
2. Click "Redeploy" after saving

### Fix #2: Update Supabase Redirect URLs

1. Go to Supabase Dashboard: https://app.supabase.com
2. Select your project
3. Go to "Authentication" → "URL Configuration"
4. Update these fields:

**Site URL:**
```
https://your-project-name.vercel.app
```

**Redirect URLs (add these):**
```
https://your-project-name.vercel.app/**
https://your-project-name.vercel.app/auth/callback
http://localhost:3000/**
http://localhost:3000/auth/callback
```

**Replace `your-project-name` with your actual Vercel URL!**

5. Click "Save"
6. Wait 2-3 minutes for changes to propagate

### Fix #3: Check Vercel Deployment Logs

1. Go to Vercel Dashboard → Your Project
2. Click on the latest deployment
3. Click "Logs" or "Functions"
4. Look for errors in:
   - Build logs
   - Function logs (API routes)

**Common errors to look for:**
- "Environment variable not defined"
- "Supabase connection failed"
- "401 Unauthorized"

### Fix #4: Verify Build Output

In Vercel dashboard, check:
1. Build succeeded (green checkmark)
2. No TypeScript errors
3. All API routes were built

**If build failed:**
- Check build logs for specific errors
- Verify package.json has all dependencies
- Try deploying again

---

## Specific Issue Fixes

### Guest Mode Not Working

**Symptoms:**
- "Continue as Guest" redirects to sign-in
- Guest authentication fails

**Fixes:**

1. Check guest API route exists:
   - URL: `https://your-project.vercel.app/api/auth/guest`
   - Should return 201 or error message (not 404)

2. Check browser console for errors:
   - Open DevTools (F12)
   - Go to Console tab
   - Look for red error messages

3. Verify guest route in Vercel Functions:
   - Vercel Dashboard → Functions
   - Check if `/api/auth/guest` is listed

### Sign-In Stuck / Infinite Loop

**Symptoms:**
- Sign-in form submits but nothing happens
- Redirects back to sign-in page
- No error message shown

**Fixes:**

1. **Check Supabase redirect URLs** (most common issue):
   - Make sure your Vercel URL is added to Supabase redirect URLs
   - Include trailing `/**` wildcard

2. **Check browser console errors:**
   - Press F12
   - Look for CORS errors
   - Look for "Failed to fetch" errors

3. **Test API directly:**
   ```bash
   curl -X POST https://your-project.vercel.app/api/auth/login \
     -H "Content-Type: application/json" \
     -d '{"email":"test@test.com","password":"test123"}'
   ```

   Should return JSON response, not 404

4. **Clear browser cache:**
   - Press Ctrl+Shift+Delete
   - Clear cookies and cache
   - Try again

### 404 on All API Routes

**Symptoms:**
- All `/api/*` routes return 404
- Vercel shows "404: NOT_FOUND"

**Cause:** API routes not deployed correctly

**Fixes:**

1. **Check project structure:**
   - Verify `src/app/api/` folder exists
   - API routes should be in correct locations

2. **Redeploy from GitHub:**
   - Go to Vercel Dashboard
   - Click "Deployments"
   - Click "Redeploy" on latest deployment
   - Select "Redeploy with existing Build Cache cleared"

3. **Check for build errors:**
   - Review build logs
   - Fix any TypeScript errors
   - Commit and push fixes

---

## Testing Checklist

After applying fixes, test these in order:

1. **Homepage loads:**
   - Visit: `https://your-project.vercel.app`
   - Should see landing page (not 404)

2. **Guest mode works:**
   - Click "Continue as Guest"
   - Should redirect to dashboard
   - Should NOT redirect to sign-in

3. **Sign up works:**
   - Try creating new account
   - Check email for verification
   - Should receive confirmation

4. **Sign in works:**
   - Use test credentials
   - Should redirect to dashboard
   - Session should persist on refresh

5. **API routes respond:**
   - Test: `https://your-project.vercel.app/api/health`
   - Should return JSON (not 404)

---

## Advanced Debugging

### Check Vercel Function Logs

1. Vercel Dashboard → Your Project
2. Click "Functions" tab
3. Click on a specific function (e.g., `/api/auth/login`)
4. View execution logs
5. Look for errors or stack traces

### Test Environment Variables

Create a test API route to verify env vars are loaded:

```typescript
// src/app/api/test-env/route.ts
import { NextResponse } from 'next/server'

export async function GET() {
  return NextResponse.json({
    supabaseUrl: process.env.NEXT_PUBLIC_SUPABASE_URL ? '✓ Set' : '✗ Missing',
    supabaseAnon: process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY ? '✓ Set' : '✗ Missing',
    supabaseService: process.env.SUPABASE_SERVICE_ROLE_KEY ? '✓ Set' : '✗ Missing',
    apiKey: process.env.API_KEY ? '✓ Set' : '✗ Missing'
  })
}
```

Visit: `https://your-project.vercel.app/api/test-env`

All should show "✓ Set"

### Enable Detailed Error Logging

Update error handling to show more details:

```typescript
// In your API routes
catch (error) {
  console.error('Detailed error:', {
    message: error.message,
    stack: error.stack,
    env: {
      supabaseUrl: !!process.env.NEXT_PUBLIC_SUPABASE_URL,
      hasApiKey: !!process.env.API_KEY
    }
  })
}
```

---

## Still Having Issues?

### Get Help

1. **Check Vercel Status:**
   - https://www.vercel-status.com
   - Verify no outages

2. **Check Supabase Status:**
   - https://status.supabase.com
   - Verify your project is active

3. **Review Vercel Docs:**
   - https://vercel.com/docs/concepts/functions/serverless-functions
   - https://vercel.com/docs/concepts/projects/environment-variables

4. **Contact Support:**
   - Vercel Support (if on paid plan)
   - Supabase Discord: https://discord.supabase.com

### Share Error Details

When asking for help, provide:
1. Your Vercel URL
2. Screenshot of browser console errors (F12)
3. Screenshot of Vercel deployment logs
4. Specific error messages
5. What you've tried so far

---

## Prevention Tips

### Before Deploying

1. ✅ Test locally first (`npm run build && npm start`)
2. ✅ Verify all env vars are set
3. ✅ Commit all changes to GitHub
4. ✅ Check .gitignore excludes .env.local
5. ✅ Review Supabase redirect URLs

### After Deploying

1. ✅ Test guest mode immediately
2. ✅ Test sign-in/sign-up
3. ✅ Check browser console for errors
4. ✅ Test API routes directly
5. ✅ Monitor Vercel function logs

---

## Quick Reference

### Your Project URLs

**Local:**
- Frontend: http://localhost:3000
- API: http://localhost:3000/api/*

**Production:**
- Frontend: https://your-project-name.vercel.app
- API: https://your-project-name.vercel.app/api/*

### Important Endpoints to Test

- Health check: `/api/health`
- Guest auth: `/api/auth/guest`
- Login: `/api/auth/login`
- Signup: `/api/auth/signup`
- Team import: `/api/team/import`

### Vercel Commands

```bash
# Install Vercel CLI
npm i -g vercel

# Deploy from local
vercel

# Deploy to production
vercel --prod

# View logs
vercel logs
```

---

## Success Criteria

Your deployment is working when:

✅ Homepage loads without 404
✅ Guest mode creates session and shows dashboard
✅ Sign-in redirects to dashboard
✅ Sign-up creates account
✅ API routes return JSON (not 404)
✅ No console errors in browser
✅ Supabase connection works
✅ Rate limiting works
✅ AI advisor responds (if GLM API key is valid)

---

Good luck! 🚀

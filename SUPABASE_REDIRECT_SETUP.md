# Supabase Redirect URLs Configuration

## Your Vercel URL
```
https://fplaiadvisor-quhb2zwcv-ahmedmirages-projects.vercel.app
```

---

## Step-by-Step Setup

### 1. Go to Supabase Dashboard
Visit: https://app.supabase.com

### 2. Select Your Project
Click on your FPL AI Advisor project

### 3. Navigate to Authentication Settings
- Click **Authentication** in the left sidebar
- Click **URL Configuration**

---

## 4. Update Site URL

**Field:** Site URL

**Value:**
```
https://fplaiadvisor-quhb2zwcv-ahmedmirages-projects.vercel.app
```

---

## 5. Add Redirect URLs

**Field:** Redirect URLs

**Add ALL of these URLs (click "Add URL" for each):**

```
https://fplaiadvisor-quhb2zwcv-ahmedmirages-projects.vercel.app/**
```

```
https://fplaiadvisor-quhb2zwcv-ahmedmirages-projects.vercel.app/auth/callback
```

```
https://fplaiadvisor-quhb2zwcv-ahmedmirages-projects.vercel.app/dashboard
```

```
https://fplaiadvisor-quhb2zwcv-ahmedmirages-projects.vercel.app/login
```

```
http://localhost:3000/**
```

```
http://localhost:3000/auth/callback
```

---

## 6. Save Configuration

1. Click **Save** button at the bottom
2. **IMPORTANT:** Wait 2-3 minutes for changes to propagate

---

## Visual Guide

Your configuration should look like this:

**Site URL:**
```
https://fplaiadvisor-quhb2zwcv-ahmedmirages-projects.vercel.app
```

**Redirect URLs (list):**
- ✓ https://fplaiadvisor-quhb2zwcv-ahmedmirages-projects.vercel.app/**
- ✓ https://fplaiadvisor-quhb2zwcv-ahmedmirages-projects.vercel.app/auth/callback
- ✓ https://fplaiadvisor-quhb2zwcv-ahmedmirages-projects.vercel.app/dashboard
- ✓ https://fplaiadvisor-quhb2zwcv-ahmedmirages-projects.vercel.app/login
- ✓ http://localhost:3000/**
- ✓ http://localhost:3000/auth/callback

---

## After Saving

### Wait 2-3 Minutes
Supabase needs time to propagate the changes to all servers.

### Clear Browser Cache
1. Press `Ctrl + Shift + Delete`
2. Clear cookies and cache
3. Close and reopen browser

### Test Your Site

**1. Test Homepage:**
```
https://fplaiadvisor-quhb2zwcv-ahmedmirages-projects.vercel.app
```
Should load without errors

**2. Test Environment Variables:**
```
https://fplaiadvisor-quhb2zwcv-ahmedmirages-projects.vercel.app/api/test-env
```
Should show: "All environment variables configured ✓"

**3. Test Health Check:**
```
https://fplaiadvisor-quhb2zwcv-ahmedmirages-projects.vercel.app/api/health
```
Should return: `{"status": "ok"}`

**4. Test Guest Mode:**
- Go to homepage
- Click "Continue as Guest"
- Should redirect to dashboard (NOT sign-in page!)

**5. Test Sign In:**
- Go to login page
- Enter credentials
- Should redirect to dashboard
- No infinite loops!

---

## Troubleshooting

### Still Getting Errors?

**If guest mode redirects to sign-in:**
- Double-check all redirect URLs are added
- Wait 2-3 more minutes
- Clear browser cache again
- Try incognito/private mode

**If sign-in doesn't work:**
- Check Vercel environment variables are set
- Verify Supabase project is not paused
- Check browser console (F12) for errors

**If you see CORS errors:**
- Verify redirect URLs include the wildcard `/**`
- Make sure Site URL matches exactly
- No trailing slash in base URL

---

## Important Notes

⚠️ **Do NOT include trailing slash in base URL:**
- ✓ Correct: `https://fplaiadvisor-quhb2zwcv-ahmedmirages-projects.vercel.app`
- ✗ Wrong: `https://fplaiadvisor-quhb2zwcv-ahmedmirages-projects.vercel.app/`

✓ **DO include `/**` wildcard in redirect URLs:**
- This allows all routes under your domain

✓ **Keep localhost URLs for local development:**
- Allows testing on your local machine

---

## Custom Domain (Optional)

If you add a custom domain in Vercel later (e.g., `fpl-advisor.com`):

1. Add the custom domain to Supabase redirect URLs:
   ```
   https://fpl-advisor.com/**
   https://fpl-advisor.com/auth/callback
   ```

2. Update Site URL to your custom domain:
   ```
   https://fpl-advisor.com
   ```

---

## Quick Copy-Paste List

For easy copy-pasting into Supabase:

**Site URL:**
```
https://fplaiadvisor-quhb2zwcv-ahmedmirages-projects.vercel.app
```

**Redirect URL 1:**
```
https://fplaiadvisor-quhb2zwcv-ahmedmirages-projects.vercel.app/**
```

**Redirect URL 2:**
```
https://fplaiadvisor-quhb2zwcv-ahmedmirages-projects.vercel.app/auth/callback
```

**Redirect URL 3:**
```
https://fplaiadvisor-quhb2zwcv-ahmedmirages-projects.vercel.app/dashboard
```

**Redirect URL 4:**
```
https://fplaiadvisor-quhb2zwcv-ahmedmirages-projects.vercel.app/login
```

**Redirect URL 5:**
```
http://localhost:3000/**
```

**Redirect URL 6:**
```
http://localhost:3000/auth/callback
```

---

Good luck! Your site should work perfectly after these changes. 🚀

# Supabase URL Configuration for New Vercel Deployment

## Your New Vercel URL
```
https://fblaiadvisor-i7ahv8m6x-ahmedmirages-projects.vercel.app
```

---

## Step-by-Step Configuration

### 1. Go to Supabase Dashboard
Visit: https://app.supabase.com

### 2. Select Your FPL Project
Click on your FPL AI Advisor project

### 3. Navigate to Authentication Settings
- Click **Authentication** in the left sidebar
- Click **URL Configuration**

---

## 4. Update Site URL

**In the "Site URL" field, enter:**
```
https://fblaiadvisor-i7ahv8m6x-ahmedmirages-projects.vercel.app
```

⚠️ **NO trailing slash!**

---

## 5. Add Redirect URLs

**Click "Add URL" and add each of these URLs (one at a time):**

### URL 1 (Wildcard - MOST IMPORTANT)
```
https://fblaiadvisor-i7ahv8m6x-ahmedmirages-projects.vercel.app/**
```

### URL 2 (Auth Callback)
```
https://fblaiadvisor-i7ahv8m6x-ahmedmirages-projects.vercel.app/auth/callback
```

### URL 3 (Dashboard)
```
https://fblaiadvisor-i7ahv8m6x-ahmedmirages-projects.vercel.app/dashboard
```

### URL 4 (Login)
```
https://fblaiadvisor-i7ahv8m6x-ahmedmirages-projects.vercel.app/login
```

### URL 5 (Localhost - for development)
```
http://localhost:3000/**
```

### URL 6 (Localhost auth callback)
```
http://localhost:3000/auth/callback
```

---

## 6. Save Configuration

1. Click the **Save** button at the bottom
2. ⏰ **WAIT 2-3 MINUTES** for changes to propagate to all Supabase servers

---

## Final Configuration Should Look Like:

**Site URL:**
```
https://fblaiadvisor-i7ahv8m6x-ahmedmirages-projects.vercel.app
```

**Redirect URLs (list of 6):**
- ✓ `https://fblaiadvisor-i7ahv8m6x-ahmedmirages-projects.vercel.app/**`
- ✓ `https://fblaiadvisor-i7ahv8m6x-ahmedmirages-projects.vercel.app/auth/callback`
- ✓ `https://fblaiadvisor-i7ahv8m6x-ahmedmirages-projects.vercel.app/dashboard`
- ✓ `https://fblaiadvisor-i7ahv8m6x-ahmedmirages-projects.vercel.app/login`
- ✓ `http://localhost:3000/**`
- ✓ `http://localhost:3000/auth/callback`

---

## After Saving - Test Your Site

**Wait 2-3 minutes, then test these in order:**

### Test 1: Homepage Sign-In Link
Visit:
```
https://fblaiadvisor-i7ahv8m6x-ahmedmirages-projects.vercel.app
```

**Expected:** See "Already have an account? Sign In" below the buttons

---

### Test 2: Forgot Password Page
Visit:
```
https://fblaiadvisor-i7ahv8m6x-ahmedmirages-projects.vercel.app/forgot-password
```

**Expected:** Password reset form loads (no 404)

---

### Test 3: Guest Access
1. Go to homepage
2. Click **"Try as Guest"** button
3. **Expected:**
   - Creates Guest #1 (or next number)
   - Redirects to dashboard
   - Dashboard header shows "Guest #1"
   - NO redirect to sign-in page!

---

### Test 4: Sign In
1. Click "Sign In" link from homepage
2. Try to sign in with test account
3. **Expected:**
   - No infinite loop
   - Redirects to dashboard after login
   - Session persists

---

## Troubleshooting

### ❌ Guest still redirects to sign-in
**Problem:** Supabase changes haven't propagated yet
**Fix:** Wait 2 more minutes, clear browser cache, try again

### ❌ Forgot password still 404
**Problem:** Testing old deployment URL or browser cache
**Fix:** Use incognito mode with the EXACT URL above

### ❌ Still seeing errors
**Problem:** May need to clear cookies
**Fix:**
1. Press F12 → Application tab → Cookies
2. Delete all cookies for your site
3. Refresh page

---

## Quick Copy-Paste Checklist

Use this to verify you've added everything:

**Site URL (1):**
- [ ] `https://fblaiadvisor-i7ahv8m6x-ahmedmirages-projects.vercel.app`

**Redirect URLs (6):**
- [ ] `https://fblaiadvisor-i7ahv8m6x-ahmedmirages-projects.vercel.app/**`
- [ ] `https://fblaiadvisor-i7ahv8m6x-ahmedmirages-projects.vercel.app/auth/callback`
- [ ] `https://fblaiadvisor-i7ahv8m6x-ahmedmirages-projects.vercel.app/dashboard`
- [ ] `https://fblaiadvisor-i7ahv8m6x-ahmedmirages-projects.vercel.app/login`
- [ ] `http://localhost:3000/**`
- [ ] `http://localhost:3000/auth/callback`

**Saved and waited 2-3 minutes:**
- [ ] Yes

---

## Important Notes

⚠️ **Critical Points:**
1. **NO trailing slash** in base URL
2. **Must include `/**`** in wildcard URLs
3. **Must wait 2-3 minutes** after saving
4. **Use incognito mode** for testing (avoids cache)
5. **Test with exact URL** I provided above

✅ **After configuration:**
- Guest mode will work
- Sign-in will work
- Forgot password will work
- No console errors

---

Good luck! Once you've configured Supabase and waited 2-3 minutes, all issues should be resolved! 🎉

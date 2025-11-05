# FPL AI Advisor - Deployment Guide

## Deploy to Vercel (Recommended)

Vercel is the easiest and most optimized platform for Next.js applications.

### Prerequisites
- GitHub repository: https://github.com/ahmedalsaei90-lang/FPL-AI-Advisor
- Vercel account (free): https://vercel.com/signup
- Your environment variables ready (.env.local values)

### Step-by-Step Deployment

#### 1. Sign Up / Log In to Vercel
1. Go to https://vercel.com/signup
2. Sign up with your GitHub account
3. Authorize Vercel to access your GitHub repositories

#### 2. Import Your Project
1. Click "Add New Project" or "Import Project"
2. Select "Import Git Repository"
3. Find and select: `ahmedalsaei90-lang/FPL-AI-Advisor`
4. Click "Import"

#### 3. Configure Project Settings

**Framework Preset:** Next.js (should auto-detect)

**Build Settings:**
- Build Command: `npm run build`
- Output Directory: `.next` (default)
- Install Command: `npm install`

**Root Directory:** `./` (leave as root)

#### 4. Set Environment Variables

Click "Environment Variables" and add ALL variables from your `.env.local`:

```
NEXT_PUBLIC_SUPABASE_URL=your_actual_supabase_url
NEXT_PUBLIC_SUPABASE_ANON_KEY=your_actual_anon_key
SUPABASE_SERVICE_ROLE_KEY=your_actual_service_role_key
API_KEY=your_actual_glm_api_key
NEXT_TELEMETRY_DISABLED=1
NEXT_TRACE_EVENTS_DISABLED=1
NODE_OPTIONS=--max-old-space-size=4096
```

**IMPORTANT:** Use your REAL values, not the placeholder values from `.env.example`!

#### 5. Deploy
1. Click "Deploy"
2. Wait 2-5 minutes for the build to complete
3. Your site will be live at: `https://your-project-name.vercel.app`

#### 6. Configure Custom Domain (Optional)
1. Go to Project Settings → Domains
2. Add your custom domain (e.g., `fpl-advisor.com`)
3. Follow DNS configuration instructions
4. Vercel provides free SSL certificates automatically

### Post-Deployment Configuration

#### Update Supabase URL Redirects
1. Go to Supabase Dashboard → Authentication → URL Configuration
2. Add your Vercel URL to:
   - Site URL: `https://your-project-name.vercel.app`
   - Redirect URLs: `https://your-project-name.vercel.app/**`

#### Test Your Deployment
1. Visit your Vercel URL
2. Test authentication (signup/login)
3. Test guest mode
4. Test team import
5. Test AI advisor

---

## Alternative Deployment Options

### Option 2: Netlify

1. Go to https://netlify.com
2. Sign in with GitHub
3. Click "Add new site" → "Import an existing project"
4. Select your GitHub repository
5. Configure build settings:
   - Build command: `npm run build`
   - Publish directory: `.next`
6. Add environment variables
7. Deploy

### Option 3: Railway

1. Go to https://railway.app
2. Sign in with GitHub
3. Click "New Project" → "Deploy from GitHub repo"
4. Select your repository
5. Add environment variables
6. Railway will auto-detect Next.js and deploy

### Option 4: Render

1. Go to https://render.com
2. Sign in with GitHub
3. Create "New Web Service"
4. Connect your GitHub repository
5. Configure:
   - Build Command: `npm install && npm run build`
   - Start Command: `npm start`
6. Add environment variables
7. Deploy

---

## Troubleshooting

### Build Fails
- **Check environment variables**: Make sure all required vars are set
- **Check build logs**: Look for specific error messages
- **Local build test**: Run `npm run build` locally first

### Database Connection Issues
- Verify Supabase credentials are correct
- Check Supabase project is active and not paused
- Ensure SUPABASE_SERVICE_ROLE_KEY is set correctly

### API Routes Not Working
- Verify environment variables are set in production
- Check API routes are not blocked by CORS
- Review Vercel function logs

### Rate Limiting Issues
- In-memory rate limiting resets on each deployment
- Consider upgrading to Redis-based rate limiting for production
- Current setup works but resets on server restart

---

## Monitoring and Maintenance

### Vercel Dashboard
- **Analytics**: Track page views and performance
- **Logs**: View function execution logs
- **Deployments**: Manage and rollback deployments

### Environment Variables Updates
1. Go to Project Settings → Environment Variables
2. Edit or add variables
3. Redeploy for changes to take effect

### Continuous Deployment
- Every push to `main` branch automatically deploys
- Preview deployments for pull requests
- Easy rollback to previous versions

---

## Performance Optimization

### Recommended Next.js Optimizations
```typescript
// next.config.ts - Add these optimizations
const nextConfig = {
  swcMinify: true,
  images: {
    domains: ['your-image-domains.com']
  },
  experimental: {
    optimizeCss: true
  }
}
```

### Caching Strategy
- Enable Vercel Edge Caching for static assets
- Use ISR (Incremental Static Regeneration) for FPL data
- Consider Redis for rate limiting in production

---

## Security Checklist

✅ Environment variables properly set in Vercel (not in code)
✅ `.env.local` in `.gitignore` (already done)
✅ Supabase RLS policies enabled
✅ Rate limiting configured
✅ Input validation implemented
✅ HTTPS enabled (automatic with Vercel)
✅ CORS properly configured

---

## Cost Considerations

### Vercel Free Tier (Hobby)
- ✅ Unlimited deployments
- ✅ 100 GB bandwidth/month
- ✅ Automatic HTTPS
- ✅ Serverless Functions: 100 GB-Hrs
- ✅ Perfect for personal projects

### Vercel Pro ($20/month)
- Increased limits
- Team collaboration
- Better analytics
- Priority support

### External Service Costs
- **Supabase**: Free tier (500MB storage, 50,000 MAU)
- **GLM API**: Pay per token usage
- **Custom domain**: ~$10-15/year (optional)

---

## Support and Resources

- **Vercel Docs**: https://vercel.com/docs
- **Next.js Deployment**: https://nextjs.org/docs/deployment
- **Supabase Docs**: https://supabase.com/docs
- **GitHub Repository**: https://github.com/ahmedalsaei90-lang/FPL-AI-Advisor

---

## Quick Start Command Summary

```bash
# Verify your code works locally
npm run build
npm start

# Push any changes to GitHub
git add .
git commit -m "Pre-deployment updates"
git push origin main

# Deploy automatically happens on Vercel after push
```

Your site will be live within minutes! 🚀

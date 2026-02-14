# Cloudflare Pages Deployment Guide

## Prerequisites
- Cloudflare Account
- GitHub Repository (forked/pushed to GitHub)
- Wrangler CLI installed: `npm install -g wrangler`

## Deployment Steps

### Option 1: Deploy via Cloudflare Dashboard (Recommended)

1. **Push code to GitHub**
   ```bash
   git add .
   git commit -m "Initial commit"
   git push origin main
   ```

2. **Connect to Cloudflare Pages**
   - Go to [Cloudflare Dashboard](https://dash.cloudflare.com)
   - Navigate to **Pages** > **Create a project**
   - Select **Connect to Git**
   - Authorize GitHub and select this repository

3. **Configure build settings**
   - **Build command**: `npm run build`
   - **Build output directory**: `.next/public`
   - **Node.js version**: 18 or higher

4. **Environment Variables** (if needed)
   - Add any environment variables in Pages settings
   - Currently no env vars required for this app

5. Deploy automatically on each git push!

### Option 2: Deploy via Wrangler CLI

1. **Install Wrangler**
   ```bash
   npm install -g wrangler
   ```

2. **Authenticate with Cloudflare**
   ```bash
   wrangler login
   ```

3. **Create Cloudflare Pages project**
   ```bash
   wrangler pages project create mdview
   ```

4. **Deploy**
   ```bash
   npm run build
   wrangler pages deploy .next/public
   ```

5. **For continuous deployment**, connect your GitHub repo in the Cloudflare Dashboard

## Project Configuration

- **Framework**: Next.js 16 (App Router)
- **Build Command**: `npm run build`
- **Output Directory**: `.next/public`
- **Environment**: Node.js 18+

## After Deployment

1. Your app will be available at: `https://mdview.<account>.pages.dev`
2. To use a custom domain:
   - Add your domain to Cloudflare
   - In Pages settings, set up a custom domain
   - Update DNS records if needed

## Local Testing Before Deploy

```bash
npm run build
npm start
```

Visit `http://localhost:3000` to test the production build locally.

## Troubleshooting

- **Build fails**: Check the build logs in Cloudflare Pages dashboard
- **Static files not loading**: Ensure `.next/public` is the correct output directory
- **Environment variables not working**: Add them through the Cloudflare Pages UI, not in `wrangler.toml`

## Features on Cloudflare Pages

✅ Markdown parsing and preview  
✅ PDF export (client-side, no server needed)  
✅ Auto-formatting  
✅ LocalStorage persistence (works on Cloudflare Pages)  
✅ Responsive design for all devices  

All features work on Cloudflare Pages because:
- No backend database required (uses browser LocalStorage)
- No server-side processing (markdown parsing is client-side)
- PDF export is client-side using jsPDF + html2canvas

---

For more info: https://developers.cloudflare.com/pages/framework-guides/deploy-a-nextjs-site/

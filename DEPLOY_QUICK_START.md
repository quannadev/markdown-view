# Cloudflare Pages Deployment - Quick Start

## 📋 Quick Setup (3 Steps)

### Step 1: Push code to GitHub
```bash
git add .
git commit -m "Setup Cloudflare deployment"
git push origin main
```

### Step 2: Connect to Cloudflare Pages
1. Go to [Cloudflare Dashboard](https://dash.cloudflare.com)
2. Navigate to **Pages** → **Create a project** → **Connect to Git**
3. Select your GitHub repository
4. Click **Connect GitHub**

### Step 3: Configure Build Settings
- **Production branch**: `main`
- **Build command**: `npm run build`
- **Build output directory**: `.next/public`
- **Node.js version**: 18
- Click **Save and Deploy**

✅ **Done!** Your app will be live at: `https://mdview.<account>.pages.dev`

---

## 🚀 Local Deployment with Wrangler CLI

### Prerequisites
```bash
# Install Wrangler globally
npm install -g wrangler

# Authenticate with Cloudflare
wrangler login
```

### One-Command Deploy
```bash
npm run deploy:pages
```

Or use the interactive script:
```bash
./deploy.sh
```

---

## 📁 What's Configured

✅ `wrangler.toml` - Cloudflare configuration  
✅ `deploy.sh` - Automated deployment script  
✅ `package.json` - Deployment npm scripts  
✅ `.gitignore` - Excludes build artifacts  

---

## 🔗 Custom Domain (Optional)

1. Add your domain to Cloudflare
2. In Pages project settings, go to **Custom domains**
3. Add your domain
4. Update DNS records (if using external registrar)

---

## 📊 Project Stats

- **Framework**: Next.js 16 (App Router)
- **Size**: ~50 KB (gzipped assets)
- **Type**: Static + Client-Side Rendering
- **Database**: None (uses browser LocalStorage)
- **CDN**: Cloudflare Global Network

---

## ✨ Features Working on Cloudflare Pages

- ✅ Markdown parsing and preview
- ✅ PDF export (client-side)
- ✅ Auto-formatting
- ✅ Document persistence (LocalStorage)
- ✅ Responsive design
- ✅ All CLI tools and features

**Why it works**: All processing is client-side. No backend required!

---

## 🐛 Troubleshooting

| Issue | Solution |
|-------|----------|
| Build fails | Check build logs in Cloudflare dashboard |
| Assets not loading | Verify `.next/public` is the output directory |
| Deployment timeout | Increase timeout in wrangler.toml |
| Git branch not auto-deploying | Set production branch to `main` in Pages settings |

---

## 📚 Resources

- [Cloudflare Pages Docs](https://developers.cloudflare.com/pages/)
- [Next.js on Cloudflare Pages](https://developers.cloudflare.com/pages/framework-guides/deploy-a-nextjs-site/)
- [Wrangler CLI Docs](https://developers.cloudflare.com/workers/wrangler/install-and-update/)

---

## 💡 Tips

- Enable **Auto Optimization** in Pages settings for better performance
- Use **Preview Deployments** feature to test before production
- Monitor performance in **Analytics** dashboard
- Set **Environment Variables** if adding dynamic features later

---

**Status**: ✅ Ready for deployment!

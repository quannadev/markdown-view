#!/bin/bash

# Cloudflare Pages Deployment Script for mdview

set -e

echo "🚀 Cloudflare Pages Deployment Script"
echo "======================================"
echo ""

# Check if wrangler is installed
if ! command -v wrangler &> /dev/null; then
    echo "⚠️  Wrangler CLI not found. Installing globally..."
    npm install -g wrangler
fi

echo "✅ Wrangler CLI ready"
echo ""

# Build the Next.js project
echo "🔨 Building Next.js project..."
npm run build
echo "✅ Build complete"
echo ""

# Check if user is authenticated with Cloudflare
if ! wrangler whoami &> /dev/null; then
    echo "🔐 Please authenticate with Cloudflare..."
    wrangler login
fi

echo ""
echo "📤 Deploying to Cloudflare Pages..."
echo ""

# Deploy to Cloudflare Pages
wrangler pages deploy .next/public --project-name=mdview

echo ""
echo "🎉 Deployment complete!"
echo ""
echo "Next steps:"
echo "1. Visit your Cloudflare Pages dashboard to verify deployment"
echo "2. Your site will be available at: https://mdview.<account>.pages.dev"
echo "3. To use a custom domain, configure it in the Cloudflare dashboard"

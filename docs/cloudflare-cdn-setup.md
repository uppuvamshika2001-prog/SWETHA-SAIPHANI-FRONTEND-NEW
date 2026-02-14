# Cloudflare CDN Integration Guide

## Setup Steps

### 1. Add your domain to Cloudflare
1. Go to https://dash.cloudflare.com/
2. Click "Add a Site"
3. Enter your domain (e.g., swethasaiphaniclinics.com)
4. Select the Free plan (sufficient for static asset caching)
5. Update your domain's nameservers to Cloudflare's

### 2. Configure DNS
- Add an A record pointing to your server IP
- Enable the orange cloud icon (proxy through Cloudflare)

### 3. Cloudflare Page Rules (Performance)
Create the following page rules in order:

#### Rule 1: Cache Static Assets
- URL Pattern: `*yourdomain.com/assets/*`
- Settings:
  - Cache Level: Cache Everything
  - Browser Cache TTL: 30 days
  - Edge Cache TTL: 30 days

#### Rule 2: Cache Optimized Images
- URL Pattern: `*yourdomain.com/optimized/*`
- Settings:
  - Cache Level: Cache Everything
  - Browser Cache TTL: 60 days
  - Edge Cache TTL: 60 days

#### Rule 3: HTML Pages
- URL Pattern: `*yourdomain.com/*.html`
- Settings:
  - Cache Level: Standard
  - Browser Cache TTL: 1 hour

### 4. Cloudflare Speed Settings
Navigate to Speed > Optimization and enable:
- [x] Auto Minify: JavaScript, CSS, HTML
- [x] Brotli compression
- [x] Early Hints
- [x] HTTP/2
- [x] HTTP/3 (QUIC)

### 5. Cloudflare Caching Settings
Navigate to Caching > Configuration:
- Caching Level: Standard
- Browser Cache TTL: Respect Existing Headers
- Always Online: ON

### 6. Image Optimization (Cloudflare Pro feature)
If on Pro plan:
- Enable Polish (WebP conversion)
- Enable Mirage (lazy loading for images)

## _headers file (for Cloudflare Pages)
If deploying on Cloudflare Pages, create a `public/_headers` file:

```
/assets/*
  Cache-Control: public, max-age=2592000, immutable

/optimized/*
  Cache-Control: public, max-age=5184000, immutable

/*.html
  Cache-Control: public, max-age=3600

/*
  X-Content-Type-Options: nosniff
  X-Frame-Options: SAMEORIGIN
  Referrer-Policy: strict-origin-when-cross-origin
```

## Verification
After setup, verify CDN is working:
1. Open browser DevTools > Network tab
2. Check response headers for `cf-cache-status: HIT`
3. Check `cf-ray` header is present (proves Cloudflare is proxying)
4. Run: `curl -I https://yourdomain.com/optimized/swetha-saiphani-logo.webp`

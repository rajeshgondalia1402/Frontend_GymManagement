# GymPro Frontend — Production Deployment Guide (Hostinger VPS)

> **What to change** when deploying from your local development machine to a Hostinger VPS production server.

---

## 1. Environment Files — What Changes

Your project now has two env files that Vite auto-loads by mode:

| File | Loaded When | Purpose |
|------|-------------|---------|
| `.env.development` | `npm run dev` | Local development |
| `.env.production` | `npm run build` | Production build |

### `.env.development` (your current local — NO changes needed)

```env
VITE_APP_ENV=development
VITE_BACKEND_URL=http://localhost:5000
VITE_API_URL=http://localhost:5000/api/v1
VITE_PORT=3005
VITE_ENABLE_DEBUG=true
VITE_APP_TITLE=GymPro - Development
```

### `.env.production` (CHANGE these before building for production)

```env
VITE_APP_ENV=production
VITE_BACKEND_URL=https://api.yourdomain.com       # ← CHANGE to your actual backend URL
VITE_API_URL=https://api.yourdomain.com/api/v1     # ← CHANGE to your actual API URL
VITE_ENABLE_DEBUG=false
VITE_APP_TITLE=GymPro
```

> **Important:** Replace `api.yourdomain.com` with your actual domain. If your frontend and backend are on the same domain, you can use `https://yourdomain.com` for both.

---

## 2. Exactly What to Change for Production

### Step-by-step Checklist

| # | What | Where | Dev Value | Prod Value |
|---|------|-------|-----------|------------|
| 1 | Backend URL | `.env.production` → `VITE_BACKEND_URL` | `http://localhost:5000` | `https://api.yourdomain.com` |
| 2 | API URL | `.env.production` → `VITE_API_URL` | `http://localhost:5000/api/v1` | `https://api.yourdomain.com/api/v1` |
| 3 | Debug logs | `.env.production` → `VITE_ENABLE_DEBUG` | `true` | `false` |
| 4 | App title | `.env.production` → `VITE_APP_TITLE` | `GymPro - Development` | `GymPro` |

**That's it for the frontend code.** No other files need editing.

---

## 3. Build & Deploy Commands

### On your local machine (build for production)

```bash
# This reads .env.production automatically
npm run build
```

This creates a `dist/` folder with static HTML/CSS/JS files.

### On Hostinger VPS

1. **Upload the `dist/` folder** to your VPS (via SCP, SFTP, or Git).

2. **Serve with Nginx** (recommended). Create an Nginx config:

```nginx
server {
    listen 80;
    server_name yourdomain.com www.yourdomain.com;

    root /var/www/gympro/frontend/dist;
    index index.html;

    # Handle SPA routing — all routes go to index.html
    location / {
        try_files $uri $uri/ /index.html;
    }

    # Cache static assets
    location ~* \.(js|css|png|jpg|jpeg|gif|svg|ico|woff|woff2|ttf|eot)$ {
        expires 1y;
        add_header Cache-Control "public, immutable";
    }

    # Proxy API requests to backend (if same domain)
    location /api/ {
        proxy_pass http://localhost:5000;
        proxy_http_version 1.1;
        proxy_set_header Upgrade $http_upgrade;
        proxy_set_header Connection 'upgrade';
        proxy_set_header Host $host;
        proxy_set_header X-Real-IP $remote_addr;
        proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
        proxy_set_header X-Forwarded-Proto $scheme;
        proxy_cache_bypass $http_upgrade;
    }
}
```

3. **Enable HTTPS with Let's Encrypt** (free SSL):

```bash
sudo apt install certbot python3-certbot-nginx
sudo certbot --nginx -d yourdomain.com -d www.yourdomain.com
```

---

## 4. Domain Setup Options

### Option A: Same domain (recommended for simplicity)

```
Frontend: https://yourdomain.com
Backend:  https://yourdomain.com/api/v1  (proxied via Nginx)
```

`.env.production`:
```env
VITE_BACKEND_URL=https://yourdomain.com
VITE_API_URL=https://yourdomain.com/api/v1
```

### Option B: Separate subdomains

```
Frontend: https://app.yourdomain.com
Backend:  https://api.yourdomain.com
```

`.env.production`:
```env
VITE_BACKEND_URL=https://api.yourdomain.com
VITE_API_URL=https://api.yourdomain.com/api/v1
```

> If using separate domains, make sure CORS is configured on your backend to allow requests from the frontend domain.

---

## 5. Backend Environment (for reference)

Your backend also needs environment changes for production. Key things:

| Setting | Dev | Prod |
|---------|-----|------|
| `NODE_ENV` | `development` | `production` |
| `PORT` | `5000` | `5000` (or any, Nginx proxies to it) |
| `DATABASE_URL` | Local DB connection | Production DB connection |
| `CORS_ORIGIN` | `http://localhost:3005` | `https://yourdomain.com` |
| `JWT_SECRET` | dev secret | Strong random secret |
| R2/S3 credentials | dev keys | production keys |

---

## 6. Quick Deployment Flow

```
LOCAL MACHINE                         HOSTINGER VPS
─────────────                         ─────────────
1. Edit .env.production               
   (set your domain URLs)             

2. npm run build                      
   → creates dist/ folder             

3. Upload dist/ to VPS ──────────────→ 4. Place in /var/www/gympro/frontend/dist

                                       5. Configure Nginx (see Section 3)

                                       6. Setup SSL (certbot)

                                       7. Start backend (pm2 start)

                                       8. sudo systemctl reload nginx

                                       ✅ Live at https://yourdomain.com
```

---

## 7. File Structure on VPS

```
/var/www/gympro/
├── frontend/
│   └── dist/           ← Built frontend files (from npm run build)
│       ├── index.html
│       ├── assets/
│       │   ├── index-xxxx.js
│       │   └── index-xxxx.css
│       └── ...
├── backend/
│   ├── .env            ← Backend production env vars
│   ├── src/
│   ├── package.json
│   └── ...
└── nginx/
    └── gympro.conf     ← Nginx config (symlinked to /etc/nginx/sites-enabled/)
```

---

## 8. Troubleshooting

| Problem | Cause | Fix |
|---------|-------|-----|
| Blank page after deploy | SPA routing not configured | Add `try_files $uri $uri/ /index.html;` to Nginx |
| API calls fail (CORS) | Backend doesn't allow frontend origin | Set `CORS_ORIGIN=https://yourdomain.com` in backend `.env` |
| API calls fail (404) | Wrong `VITE_API_URL` | Check `.env.production` URL matches your backend |
| Images not loading | Wrong `VITE_BACKEND_URL` | Ensure it points to where your backend/R2 serves files |
| Console shows debug logs | `VITE_ENABLE_DEBUG=true` | Set to `false` in `.env.production` |

---

**Summary:** Only edit `.env.production` with your real domain URLs, run `npm run build`, upload `dist/` to VPS, configure Nginx. No code changes required.

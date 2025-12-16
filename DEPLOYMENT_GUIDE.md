# Free Hosting Options for Backend API

## Option 1: Railway (Recommended - Easiest)

### Setup:
1. Go to https://railway.app
2. Sign up with GitHub
3. Click "New Project" → "Deploy from GitHub repo"
4. Select your `bruinCoin` repository
5. Set root directory to: `backend`
6. Railway will auto-detect Node.js and deploy

### Environment Variables:
Add these in Railway dashboard:
- `SUPABASE_URL`
- `SUPABASE_ANON_KEY`
- `SUPABASE_SERVICE_ROLE_KEY`
- `PORT` (Railway sets this automatically)
- `NODE_ENV=production`

### Get Your API URL:
Railway will give you a URL like: `https://your-app.up.railway.app`

### Update Mobile App:
Set `EXPO_PUBLIC_API_URL` in `frontend/mobile/.env`:
```env
EXPO_PUBLIC_API_URL=https://your-app.up.railway.app
```

---

## Option 2: Fly.io (Good Free Tier)

### Setup:
1. Install Fly CLI: `curl -L https://fly.io/install.sh | sh`
2. Sign up: `fly auth signup`
3. In `backend/` directory, run: `fly launch`
4. Follow prompts

### Create `fly.toml` in `backend/`:
```toml
app = "your-app-name"
primary_region = "iad"

[build]

[http_service]
  internal_port = 3001
  force_https = true
  auto_stop_machines = true
  auto_start_machines = true
  min_machines_running = 0

[[vm]]
  memory_mb = 256
```

### Deploy:
```bash
cd backend
fly deploy
```

### Get URL:
`https://your-app-name.fly.dev`

---

## Option 3: Cyclic (Very Easy)

### Setup:
1. Go to https://cyclic.sh
2. Sign up with GitHub
3. Click "New App" → Select your repo
4. Set root directory: `backend`
5. Deploy!

### Environment Variables:
Add in Cyclic dashboard (same as Railway)

### Get URL:
`https://your-app.cyclic.app`

---

## Option 4: Vercel (Serverless - Good for APIs)

### Setup:
1. Install Vercel CLI: `npm i -g vercel`
2. In `backend/` directory: `vercel`
3. Follow prompts

### Create `vercel.json` in `backend/`:
```json
{
  "version": 2,
  "builds": [
    {
      "src": "express/src/server.ts",
      "use": "@vercel/node"
    }
  ],
  "routes": [
    {
      "src": "/(.*)",
      "dest": "express/src/server.ts"
    }
  ]
}
```

---

## Quick Comparison:

| Platform | Free Tier | Ease | Best For |
|----------|-----------|------|----------|
| **Railway** | $5/month credit | ⭐⭐⭐⭐⭐ | Express APIs |
| **Fly.io** | 3 shared VMs | ⭐⭐⭐⭐ | Docker/Express |
| **Cyclic** | Unlimited apps | ⭐⭐⭐⭐⭐ | Simple Express |
| **Vercel** | Generous | ⭐⭐⭐⭐ | Serverless |

## Recommendation: **Railway** or **Cyclic** (both are very easy)

# Deployment Guide

## Prerequisites
- A host that supports Docker containers **with WebSocket support** (Railway, Render, Fly.io, a VPS, etc.)
- **Not Vercel/Netlify** — they don't support long-lived WebSocket connections, which the wisp proxy requires.

## Quick Deploy

### Railway
1. Connect your repo to Railway
2. Railway auto-detects the Dockerfile
3. Set environment variables:
   - `PORT=3000`
   - `BASE_PATH=/`
4. Deploy

### Render
1. Create a new "Web Service" from your repo
2. Select "Docker" as the runtime
3. Set environment variables:
   - `PORT=3000` (Render sets this automatically)
   - `BASE_PATH=/`

### Fly.io
```bash
fly launch --dockerfile Dockerfile
fly deploy
```

### Any VPS with Docker
```bash
docker build -t puff-desktop .
docker run -p 3000:3000 -e PORT=3000 -e BASE_PATH=/ puff-desktop
```

## Environment Variables

| Variable | Required | Default | Description |
|----------|----------|---------|-------------|
| `PORT` | Yes | — | Port the server listens on |
| `BASE_PATH` | Yes | — | Base path for the frontend (`/` for root deployment) |

## How It Works

1. **Frontend** (puff-desktop) builds to static files served by the API server
2. **Wisp proxy** runs on the same server at `/wisp/` (WebSocket)
3. **Scramjet** service worker in the browser intercepts requests and routes them through the wisp proxy
4. The built-in browser app can now load any website without iframe restrictions

## Architecture

```
Browser → Scramjet Service Worker → Bare-Mux Transport → Wisp WebSocket → Internet
```

The single Docker container serves:
- Static frontend files (HTML/CSS/JS)
- REST API at `/api/`
- Wisp WebSocket proxy at `/wisp/`

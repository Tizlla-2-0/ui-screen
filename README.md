# UI Screen & Task Manager

Tizlla UI screen + sub-task tracker.

**Live:** https://tizlla-2-0.github.io/ui-screen/

Data is stored in the cloud (Cloudflare KV) so desktop and mobile stay in sync. Task data is not kept in browser localStorage.

## Login

Use the app credentials configured in the project.

## Local development

```bash
npm install
npm run dev:web
```

Optional `.env.local`:

```bash
VITE_API_BASE=https://ui-screen-api.prateektomar005.workers.dev
```

## API worker

The sync API lives in [`worker/`](worker/) (Cloudflare Worker + KV).

```bash
cd worker
wrangler deploy
```

## Deploy (GitHub Pages)

Push to `main`. Actions builds and deploys the static app.

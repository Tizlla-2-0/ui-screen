# UI Screen & Task Manager

Lightweight tracker for UI screens and their sub-tasks — like a small Jira board focused on screens.

**Live:** https://prateektomar.github.io/ui-screen-task-manager/  
*(Sign in with the credentials configured in the app.)*

Data is stored in your browser (`localStorage`), seeded from [`public/store.json`](public/store.json) on first visit.

## Requirements

- Node.js 18+

## Setup

```bash
npm install
```

## Run locally

```bash
npm run dev:web
```

Open [http://localhost:5173](http://localhost:5173).

> Optional: `npm run dev` still starts the old Express API + Vite if you want file-based `data/store.json` syncing locally. The hosted GitHub Pages build uses browser storage only.

## Features

- Login gate (session in `localStorage`)
- Create, edit, and delete **screens** (name, description, status, priority)
- Add, edit, and delete **sub-tasks** under each screen
- Sub-task progress (`done/total`)
- Filter screens by name, status, or priority

## Scripts

| Script | Description |
|--------|-------------|
| `npm run dev:web` | Vite web UI (uses browser storage) |
| `npm run build` | Production build for GitHub Pages |
| `npm run preview` | Preview the production build |
| `npm run dev` | Optional: API + web together |
| `npm run lint` | Lint |

## Deploy (GitHub Pages)

Push to `main`. The workflow in [`.github/workflows/deploy-pages.yml`](.github/workflows/deploy-pages.yml) builds and deploys automatically.

In the repo: **Settings → Pages → Source: GitHub Actions**.

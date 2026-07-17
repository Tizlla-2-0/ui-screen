# UI Screen & Task Manager

Tizlla UI screen + sub-task tracker.

**Live:** https://tizlla-2-0.github.io/ui-screen/

Data is stored in [`data/store.json`](data/store.json) in this repo (synced via the GitHub API), so desktop and mobile share the same board.

## Login

Use the app credentials configured in the project.

## Local development

```bash
npm install
npm run dev:web
```

Create a `.env.local` file:

```bash
VITE_GITHUB_OWNER=Tizlla-2-0
VITE_GITHUB_REPO=ui-screen
VITE_GITHUB_TOKEN=github_pat_...
```

Use a **fine-grained PAT** with access only to `Tizlla-2-0/ui-screen` and **Contents: Read and write**.

## Deploy

Push to `main`. GitHub Actions builds and deploys Pages.

Set repo secret `VITE_GITHUB_TOKEN` (same fine-grained PAT) so saves work in production.

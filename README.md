# Leadflow - Lead Manager

A full-stack lead tracking app built with React, Vite, Express, and SQLite.

## Run locally

Requirements: Node.js 22.5 or newer.

```bash
npm install
npm start
```

The app and API run together on `http://localhost:3001`.

## Deploy to Render

This repository includes `render.yaml` for a Render Blueprint deployment.

1. Push this repository to GitHub.
2. Open Render and select **New > Blueprint**.
3. Select this repository and approve the persistent SQLite disk.
4. Open the generated `*.onrender.com` URL.

SQLite is stored at `/var/data/leads.db` on the attached Render disk.

## Scripts

- `npm run dev` - run the Vite frontend and API in development
- `npm run build` - build the frontend
- `npm start` - run the production server
- `npm test` - run API tests

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
3. Select this repository and deploy the free web service.
4. Open the generated `*.onrender.com` URL.

The free-tier configuration stores SQLite at `/tmp/leads.db`. Render's free service
does not provide persistent disk storage, so lead data may be lost during restarts
or redeploys. For persistent data, use a paid Render service with a mounted disk.

## Scripts

- `npm run dev` - run the Vite frontend and API in development
- `npm run build` - build the frontend
- `npm start` - run the production server
- `npm test` - run API tests

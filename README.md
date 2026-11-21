# Leadflow — Lead Manager

A lightweight full-stack lead tracker built for the Meru Technosoft Full Stack Developer screening assignment. It keeps lead capture, follow-up status, and a quick pipeline overview in one responsive workspace.

## Tech stack

- **Frontend:** React 18, Vite, Lucide icons, CSS
- **Backend:** Node.js, Express
- **Database:** SQLite via Node's built-in `node:sqlite` module
- **Tests:** Node's built-in test runner and `fetch`

SQLite was chosen to keep local setup simple and persistent without requiring a separate database server or native addon. The API and frontend are served together in production; Vite proxies API requests during development.

## Features

- Create, edit, and delete leads with a confirmation before deletion
- Required name, email, phone, company, source, and status fields
- Frontend and backend validation for required fields, email, phone, source, and status
- Search leads by name, company, or email; filter by status
- Sort by newest or name
- Dashboard counts for total, new, contacted, and qualified leads
- Responsive layout, loading/empty/error states, and success notifications

## Run locally

Requirements: Node.js 22.5+ and npm (`node:sqlite` is built into Node.js).

```bash
npm install
Copy-Item .env.example .env
npm run dev
```

The Vite frontend is at `http://localhost:5173`; the API listens on `http://localhost:3001`. The SQLite database is created automatically at `data/leads.db`. You can override the API port or database location with `PORT` and `DATABASE_PATH`; see `.env.example`.

To create and run the production build:

```bash
npm run build
npm start
```

The Express server then serves the built app and API on port `3001` (or `PORT`).

## API

| Method | Route | Description |
| --- | --- | --- |
| `GET` | `/api/health` | Health check |
| `GET` | `/api/stats` | Total and per-status counts |
| `GET` | `/api/leads?search=&status=&sort=&direction=` | List, search, filter, and sort leads |
| `GET` | `/api/leads/:id` | Get a lead |
| `POST` | `/api/leads` | Create a lead |
| `PUT` | `/api/leads/:id` | Update a lead |
| `DELETE` | `/api/leads/:id` | Delete a lead |

Invalid input returns `400` with a top-level error and field-specific messages. A missing lead returns `404`.

## Tests

```bash
npm test
```

The API tests use an isolated temporary SQLite database.

## Deploy to Render

This repository includes [`render.yaml`](render.yaml) for a Render Blueprint deployment.

1. Push this repository to GitHub.
2. In Render, choose **New > Blueprint** and select the repository.
3. Render will build the Vite app, start Express, and attach a 1 GB persistent disk for SQLite.
4. Use the generated `*.onrender.com` URL after the first deploy completes.

The Blueprint stores SQLite at `/var/data/leads.db`, so lead data remains persistent across deploys.

## Assumptions and next steps

- This is a single-user workspace; authentication and per-user access control are intentionally out of scope for the core assignment.
- Lead source options are Website, Referral, LinkedIn, Cold Call, Event, and Other. Phone validation accepts common international punctuation.
- For a longer-lived production deployment, I would add authentication and authorization, schema migrations, rate limiting, structured logging, and CI. A managed database could replace SQLite if concurrent writes or multiple application instances become necessary.

## A note on the work

I focused on making the whole capture-to-follow-up loop work cleanly rather than adding a broad feature set. The part that needed the most care was keeping validation and error behavior consistent between the form and API while still making failures understandable in the UI.

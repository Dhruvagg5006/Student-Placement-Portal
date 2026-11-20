# Student Placement Portal

A full-stack Student Placement Portal built with React, Node.js, Express, PostgreSQL, and deployed using Docker Compose with Nginx.

## Architecture

```
┌─────────────────────────────────────────┐
│          Docker Compose Network          │
│                                         │
│  ┌─────────────────────┐  ┌──────────┐  │
│  │   app (Port 80)     │  │   db     │  │
│  │  ┌───────────────┐  │  │          │  │
│  │  │  Nginx (:80)  │  │  │ Postgres │  │
│  │  │  ├─ /     → React build       │  │
│  │  │  └─ /api/ → Express (:5000)   │  │
│  │  ├───────────────┤  │  │  :5432   │  │
│  │  │ Express :5000 │◄─┼──┤(internal)│  │
│  │  └───────────────┘  │  └──────────┘  │
│  └─────────────────────┘               │
└─────────────────────────────────────────┘
```

**Two containers only:**
- `app` — Nginx + React build + Express backend
- `db` — PostgreSQL 16 Alpine

## Folder Structure

```
Student Placement Portal/
├── docker-compose.yml
├── Dockerfile
├── nginx.conf
├── .dockerignore
├── .env.example
├── .gitignore
├── README.md
├── database/
│   └── init.sql
├── backend/
│   ├── package.json
│   ├── server.js
│   ├── middleware/
│   │   └── auth.js
│   └── routes/
│       ├── auth.js
│       ├── drives.js
│       ├── applications.js
│       └── admin.js
└── frontend/
    ├── package.json
    ├── vite.config.js
    ├── index.html
    └── src/
        ├── main.jsx
        ├── App.jsx
        ├── App.css
        ├── context/
        │   └── AuthContext.jsx
        ├── components/
        │   └── Sidebar.jsx
        └── pages/
            ├── Login.jsx
            ├── Register.jsx
            ├── StudentDashboard.jsx
            └── AdminDashboard.jsx
```

## Prerequisites

- Docker Engine 20+
- Docker Compose v2+
- An AWS EC2 Ubuntu instance (or any Linux server)
- Port 80 open in security group / firewall

## Environment Configuration

1. Copy the example env file:
   ```bash
   cp .env.example .env
   ```

2. Edit `.env` with secure values:
   ```
   DB_USER=placement_user
   DB_PASSWORD=<strong_random_password>
   DB_NAME=placement_db
   JWT_SECRET=<long_random_secret_string>
   ```

## Build Docker Images

```bash
docker compose build
```

## Start Containers

```bash
docker compose up -d
```

## Check Container Status

```bash
docker compose ps
```

Both `app` and `db` should show as running.

## View Logs

```bash
# All logs
docker compose logs -f

# App only
docker compose logs -f app

# Database only
docker compose logs -f db
```

## Stop Containers

```bash
docker compose down
```

> **Warning:** Do NOT use `docker compose down -v` during normal shutdown — the `-v` flag deletes the database volume and all data.

## Restart Containers

```bash
docker compose restart
```

Or rebuild and restart:
```bash
docker compose down
docker compose build
docker compose up -d
```

## Access the Application

Open in a browser:
```
http://<EC2-PUBLIC-IP>
```

- **Student login:** Register a new account via the registration page
- **Admin login:** Check "Login as Admin" checkbox
  - Email: `admin@placement.com`
  - Password: `admin123`

## Verify PostgreSQL Connectivity

```bash
docker compose exec app sh -c "wget -qO- http://localhost:5000/api/health"
```

Should return: `{"status":"ok","database":"connected"}`

## Persistent Volumes

Data is stored in a Docker named volume `pgdata`. It survives `docker compose down` but is deleted by `docker compose down -v`.

Check volumes:
```bash
docker volume ls
```

## Troubleshooting

| Problem | Solution |
|---------|----------|
| `app` exits immediately | Check logs: `docker compose logs app` |
| Database connection refused | Ensure `db` is healthy: `docker compose ps` |
| Port 80 already in use | Stop other services on port 80 or change the port mapping |
| Frontend shows blank page | Rebuild: `docker compose build --no-cache` |
| Cannot connect from browser | Check EC2 security group allows inbound port 80 |
| Forgot admin password | Delete volume and restart: `docker compose down -v && docker compose up -d` |

## Default Admin Credentials

| Field | Value |
|-------|-------|
| Email | admin@placement.com |
| Password | admin123 |

> Change these in production by updating `database/init.sql` before first run.

## API Endpoints

| Method | Endpoint | Auth | Description |
|--------|----------|------|-------------|
| POST | /api/auth/register | None | Student registration |
| POST | /api/auth/login | None | Student/Admin login |
| GET | /api/drives | None | List open drives |
| POST | /api/applications | Student | Apply for a drive |
| GET | /api/applications/my | Student | My applications |
| POST | /api/admin/drives | Admin | Add a drive |
| GET | /api/admin/drives | Admin | List all drives |
| DELETE | /api/admin/drives/:id | Admin | Close a drive |
| GET | /api/admin/students | Admin | List students |
| GET | /api/admin/applications | Admin | List all applications |
| PATCH | /api/admin/applications/:id | Admin | Update app status |
| GET | /api/health | None | Health check |


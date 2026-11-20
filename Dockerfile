# Stage 1: Build frontend
FROM node:20-alpine AS frontend-build
WORKDIR /app/frontend
COPY frontend/package.json frontend/package-lock.json* ./
RUN npm install
COPY frontend/ ./
RUN npm run build

# Stage 2: Production
FROM node:20-alpine

WORKDIR /app/backend
COPY backend/package.json backend/package-lock.json* ./
RUN npm install --production
COPY backend/ ./

# Copy frontend build into backend for static serving
COPY --from=frontend-build /app/frontend/dist /app/frontend/dist

EXPOSE 5000

CMD ["node", "server.js"]

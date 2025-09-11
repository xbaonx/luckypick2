# syntax=docker/dockerfile:1

# Use Debian-based Node image to ensure native modules (e.g., sqlite3) build reliably
FROM node:18-bullseye AS deps
WORKDIR /app

# Install build tools for native modules (e.g., sqlite3)
RUN apt-get update && apt-get install -y python3 make g++ && rm -rf /var/lib/apt/lists/*

# Install dependencies separately for backend and frontend
COPY backend/package*.json ./backend/
COPY frontend/package*.json ./frontend/

RUN cd backend && npm install \
 && cd /app/frontend && npm install

# Build both apps and prune dev deps from backend
FROM deps AS build
WORKDIR /app

# Copy full sources
COPY backend ./backend
COPY frontend ./frontend

# Build backend (NestJS) and prune dev deps for production runtime
RUN cd backend && npm run build \
 && npm prune --omit=dev

# Build frontend (Vite)
RUN cd frontend && npm run build

# Runtime image
FROM node:18-bullseye AS runner
ENV NODE_ENV=production
WORKDIR /app

# Copy backend runtime files and deps
COPY --from=build /app/backend/package*.json ./backend/
COPY --from=build /app/backend/node_modules ./backend/node_modules
COPY --from=build /app/backend/dist ./backend/dist

# Copy built frontend assets (served by Nest via ServeStaticModule)
COPY --from=build /app/frontend/dist ./frontend/dist

# Ensure data directory exists for sqlite db mount
RUN mkdir -p /data

ENV PORT=3000
EXPOSE 3000

CMD ["node", "backend/dist/main.js"]

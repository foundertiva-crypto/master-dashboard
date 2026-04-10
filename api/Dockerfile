FROM node:20-alpine AS builder

WORKDIR /app

# Copy shared libraries + modules
COPY config/ ./config/
COPY lib/ ./lib/
COPY modules/ ./modules/

# Copy API package + install ALL deps (need tsc for build)
COPY api/package*.json ./api/
WORKDIR /app/api
RUN npm ci

# Copy API source and compile
COPY api/ .
RUN npx tsc

# --- Production image ---
FROM node:20-alpine

WORKDIR /app

# Copy compiled output and shared sources
COPY --from=builder /app/api/dist ./api/dist
COPY --from=builder /app/api/node_modules ./api/node_modules
COPY --from=builder /app/api/package.json ./api/package.json

# Copy DB schema for migrations
COPY db/ ./db/

WORKDIR /app/api

EXPOSE 4000

ENV NODE_ENV=production
CMD ["node", "dist/api/src/server.js"]

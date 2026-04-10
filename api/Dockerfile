FROM node:20-alpine AS builder

WORKDIR /app

# Copy root package files
COPY package*.json ./

# Install root dependencies
RUN npm ci

# Copy shared libraries + modules
COPY config/ ./config/
COPY lib/ ./lib/
COPY modules/ ./modules/

# Copy API package + install deps
COPY api/package*.json ./api/
WORKDIR /app/api
RUN npm ci

# Copy API source
COPY api/ .

# Compile TypeScript (api + lib + modules)
RUN npx tsc --skipLibCheck

# --- Production image ---
FROM node:20-alpine

WORKDIR /app

# Copy compiled output 
COPY --from=builder /app/api/dist ./api/dist
COPY --from=builder /app/api/node_modules ./api/node_modules
COPY --from=builder /app/api/package.json ./api/package.json

# Copy DB schema for migrations
COPY db/ ./db/

WORKDIR /app/api

EXPOSE 4000

ENV NODE_ENV=production
CMD ["node", "dist/api/src/server.js"]

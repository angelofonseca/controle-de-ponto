# ─────────────────────────────────────────────────────────────────────────────
# Stage 1: Base
# ─────────────────────────────────────────────────────────────────────────────
FROM node:20-alpine AS base

WORKDIR /app

RUN apk add --no-cache libc6-compat

# ─────────────────────────────────────────────────────────────────────────────
# Stage 2: Dependencies
# ─────────────────────────────────────────────────────────────────────────────
FROM base AS deps

COPY package*.json ./
RUN npm ci

# ─────────────────────────────────────────────────────────────────────────────
# Stage 3: Development
# ─────────────────────────────────────────────────────────────────────────────
FROM base AS development

COPY --from=deps /app/node_modules ./node_modules
COPY . .

EXPOSE 5173

CMD ["npm", "run", "dev", "--", "--host", "0.0.0.0"]

# ─────────────────────────────────────────────────────────────────────────────
# Stage 4: Build
# ─────────────────────────────────────────────────────────────────────────────
FROM base AS build

COPY --from=deps /app/node_modules ./node_modules
COPY . .

RUN npm run build

# ─────────────────────────────────────────────────────────────────────────────
# Stage 5: Production
# ─────────────────────────────────────────────────────────────────────────────
FROM node:20-alpine AS production

WORKDIR /app

RUN apk add --no-cache curl

ENV NODE_ENV=production

COPY --from=build /app/build ./build
COPY --from=build /app/package*.json ./

RUN npm ci --only=production && npm cache clean --force

EXPOSE 3000

HEALTHCHECK --interval=30s --timeout=10s --start-period=30s --retries=3 \
  CMD curl -f http://localhost:3000 || exit 1

CMD ["node", "build"]

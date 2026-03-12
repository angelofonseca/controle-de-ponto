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
COPY prisma ./prisma/

RUN npm ci

# ─────────────────────────────────────────────────────────────────────────────
# Stage 3: Development
# ─────────────────────────────────────────────────────────────────────────────
FROM base AS development

COPY --from=deps /app/node_modules ./node_modules
COPY . .

RUN npx prisma generate

EXPOSE 3000

CMD ["npm", "run", "start:dev"]

# ─────────────────────────────────────────────────────────────────────────────
# Stage 4: Build
# ─────────────────────────────────────────────────────────────────────────────
FROM base AS build

COPY --from=deps /app/node_modules ./node_modules
COPY . .

RUN npx prisma generate
RUN npm run build

# ─────────────────────────────────────────────────────────────────────────────
# Stage 5: Production
# ─────────────────────────────────────────────────────────────────────────────
FROM node:20-alpine AS production

WORKDIR /app

RUN apk add --no-cache libc6-compat curl

ENV NODE_ENV=production

COPY package*.json ./
COPY prisma ./prisma/

RUN npm ci --only=production && npm cache clean --force

COPY --from=build /app/dist ./dist
COPY --from=build /app/node_modules/.prisma ./node_modules/.prisma
COPY --from=build /app/node_modules/@prisma ./node_modules/@prisma

EXPOSE 3000

HEALTHCHECK --interval=30s --timeout=10s --start-period=40s --retries=3 \
  CMD curl -f http://localhost:3000/api/health || exit 1

CMD ["node", "dist/main"]

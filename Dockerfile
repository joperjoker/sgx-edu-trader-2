# =============================================================================
# SGX Edu-Trader 2.0 / 3.0 — Google Cloud Run Production Multi-Stage Dockerfile
# Region: asia-southeast1 (Singapore)
# =============================================================================

FROM node:20-alpine AS base
RUN apk add --no-cache libc6-compat

# Stage 1: Install dependencies
FROM base AS deps
WORKDIR /app
COPY package.json package-lock.json* ./
RUN npm ci

# Stage 2: Build Next.js 14 Standalone Bundle
FROM base AS builder
WORKDIR /app
COPY --from=deps /app/node_modules ./node_modules
COPY . .
ENV NEXT_TELEMETRY_DISABLED=1
ENV NODE_ENV=production
RUN npm run build

# Stage 3: Minimal Google Cloud Run Runtime Image
FROM base AS runner
WORKDIR /app
ENV NODE_ENV=production
ENV NEXT_TELEMETRY_DISABLED=1
ENV PORT=8080
ENV HOSTNAME="0.0.0.0"

RUN addgroup --system --gid 1001 nodejs && \
    adduser --system --uid 1001 nextjs

COPY --from=builder /app/public ./public
RUN mkdir -p .next .data && chown -R nextjs:nodejs .next .data

COPY --from=builder --chown=nextjs:nodejs /app/.next/standalone ./
COPY --from=builder --chown=nextjs:nodejs /app/.next/static ./.next/static

USER nextjs
EXPOSE 8080

CMD ["node", "server.js"]

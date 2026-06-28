# syntax=docker/dockerfile:1

# Stage 1: Install dependencies
FROM node:22-alpine AS deps
RUN apk add --no-cache libc6-compat openssl

WORKDIR /app

# Copy package files
COPY package*.json ./
# Copy only schema for Prisma generation (migrations not needed for build)
COPY prisma/schema.prisma ./prisma/

# Install all dependencies (skip postinstall to avoid stale prisma generate)
RUN npm ci --ignore-scripts

# Generate Prisma client
RUN npx prisma generate

# Stage 2: Build application
FROM node:22-alpine AS builder
RUN apk add --no-cache libc6-compat openssl

WORKDIR /app

# Copy dependencies from deps stage
COPY --from=deps /app/node_modules ./node_modules
COPY --from=deps /app/prisma/generated ./prisma/generated

# Copy application source
COPY . .

# Set environment for build
ENV NEXT_TELEMETRY_DISABLED=1
ENV NODE_ENV=production

# Build Next.js application (standalone mode)
RUN npm run build

# Build cron scripts
RUN npm run build:cron

# Stage 3: Production runtime
FROM node:22-alpine AS runner
RUN apk add --no-cache libc6-compat openssl

WORKDIR /app

# Set production environment
ENV NODE_ENV=production
ENV NEXT_TELEMETRY_DISABLED=1
ENV PORT=3000
ENV HOSTNAME=0.0.0.0

# Create non-root user
RUN addgroup --system --gid 1001 nodejs
RUN adduser --system --uid 1001 nextjs

# Copy necessary files from builder
COPY --from=builder --chown=nextjs:nodejs /app/public ./public
RUN mkdir -p public/uploads && chown nextjs:nodejs public/uploads
COPY --from=builder --chown=nextjs:nodejs /app/package*.json ./

# Copy Prisma schema and migrations
COPY --chown=nextjs:nodejs prisma/schema.prisma ./prisma/
COPY --chown=nextjs:nodejs prisma/migrations ./prisma/migrations/

# Copy seed scripts (changes here won't invalidate Next.js build cache)
COPY --chown=nextjs:nodejs prisma/seed ./prisma/seed/

# Copy compiled cron scripts
COPY --from=builder --chown=nextjs:nodejs /app/scripts/build ./scripts/build/

# Copy standalone build
COPY --from=builder --chown=nextjs:nodejs /app/.next/standalone ./
COPY --from=builder --chown=nextjs:nodejs /app/.next/static ./.next/static

# Copy Prisma generated client
COPY --from=builder --chown=nextjs:nodejs /app/prisma/generated ./prisma/generated

# Copy entrypoint script
COPY --chmod=755 docker-entrypoint.sh ./

# Switch to non-root user before installing dependencies
USER nextjs

# Install dependencies as nextjs user
RUN npm ci --ignore-scripts

EXPOSE 3000

ENTRYPOINT ["/app/docker-entrypoint.sh"]

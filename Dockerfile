# syntax=docker/dockerfile:1

# ============================================================
# Stage 1: Dependencies
# ============================================================
FROM oven/bun:1 AS deps

WORKDIR /app

# Copy dependency manifests first for better layer caching.
COPY package.json bun.lock ./

# Install exact dependencies from lockfile.
RUN bun install --frozen-lockfile


# ============================================================
# Stage 2: Build
# ============================================================
FROM oven/bun:1 AS builder

WORKDIR /app

ENV NODE_ENV=production
ENV NEXT_TELEMETRY_DISABLED=1

# Reuse installed dependencies.
COPY --from=deps /app/node_modules ./node_modules

# Copy application source.
COPY . .

# Generate Prisma client if the project uses Prisma.
# Remove this command if db:generate is not required.
RUN bun run db:generate

# Build the Next.js application.
RUN bun run build:next


# ============================================================
# Stage 3: Production Runtime
# ============================================================
FROM oven/bun:1-slim AS runner

WORKDIR /app

ENV NODE_ENV=production
ENV NEXT_TELEMETRY_DISABLED=1
ENV HOSTNAME=0.0.0.0
ENV PORT=3000

# Install CA certificates for HTTPS connections.
USER root

RUN apt-get update \
    && apt-get install -y --no-install-recommends ca-certificates \
    && rm -rf /var/lib/apt/lists/*

# Copy standalone Next.js output.
COPY --from=builder --chown=bun:bun /app/.next/standalone ./

# Copy static assets.
COPY --from=builder --chown=bun:bun /app/.next/static ./.next/static

# Copy public assets when available.
COPY --from=builder --chown=bun:bun /app/public ./public

# Run without root privileges.
USER bun

EXPOSE 3000

CMD ["bun", "run", "server.js"]
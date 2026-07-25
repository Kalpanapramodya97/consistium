# ──────────────────────────────────────────────────────────────
# Consistium — Multi-Stage Backend Dockerfile
# ──────────────────────────────────────────────────────────────
# Stage 1: Install production dependencies only
# Stage 2: Minimal production image with security hardening
# ──────────────────────────────────────────────────────────────

# ── Stage 1: Dependency Builder ──────────────────────────────
FROM node:20-alpine AS builder

WORKDIR /usr/src/app

# Copy only package files first (layer caching optimization)
COPY package*.json ./

# Install production dependencies only — no devDependencies
RUN npm ci --omit=dev && \
  # Remove npm cache to reduce image size
  npm cache clean --force

# ── Stage 2: Production Image ────────────────────────────────
FROM node:20-alpine AS production

# OCI Image Labels
LABEL org.opencontainers.image.title="Consistium Backend" \
  org.opencontainers.image.description="Consistium Habit Tracker API — Express.js backend" \
  org.opencontainers.image.authors="Kalpana Pramodya <kalpanapramodya97@gmail.com>" \
  org.opencontainers.image.source="https://github.com/Kalpanapramodya97/consistium" \
  org.opencontainers.image.licenses="AGPL-3.0" \
  org.opencontainers.image.vendor="Consistium"

# Upgrade OS packages to patched versions and install dumb-init for proper PID 1 signal handling
# (ensures graceful shutdown — SIGTERM forwarded to Node process)
RUN apk upgrade --no-cache && apk add --no-cache dumb-init

WORKDIR /usr/src/app

# Set production environment
ENV NODE_ENV=production \
  PORT=5000

# Run as non-root user (built-in 'node' user, UID 1000)
USER node

# Copy production dependencies from builder stage
COPY --from=builder --chown=node:node /usr/src/app/node_modules ./node_modules

# Copy application source code
COPY --chown=node:node . .

EXPOSE 5000

# Health check — lets orchestrators know when the API is responsive
HEALTHCHECK --interval=15s --timeout=5s --start-period=30s --retries=5 \
  CMD wget -qO- http://0.0.0.0:5000/api/health || exit 1

# Use dumb-init as PID 1 to handle signals properly
ENTRYPOINT ["dumb-init", "--"]
CMD ["node", "server.js"]

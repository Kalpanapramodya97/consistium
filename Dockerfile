# ──────────────────────────────────────────────────────────────
# Consistium — Multi-Stage Frontend Dockerfile
# ──────────────────────────────────────────────────────────────
# Stage 1: Validate & prepare static assets
# Stage 2: Production-grade nginx with security hardening
# ──────────────────────────────────────────────────────────────

# ── Stage 1: Asset Validation ────────────────────────────────
# Validates that all required static files exist and are
# non-empty before proceeding to the production image.
# This catches missing files at build time, not at runtime.
FROM alpine:3.22 AS validator

WORKDIR /assets

# Copy all static files
COPY index.html admin.html style.css app.js ./
COPY assets/ ./assets/
COPY nginx.conf ./nginx.conf

# Validate critical files exist and are non-empty
RUN set -e && \
    echo "── Validating static assets ──" && \
    for f in index.html admin.html style.css app.js nginx.conf; do \
      if [ ! -s "$f" ]; then \
        echo "ERROR: $f is missing or empty" && exit 1; \
      fi; \
      echo "  ✓ $f ($(wc -c < "$f") bytes)"; \
    done && \
    echo "── All assets validated ──"

# ── Stage 2: Production Image ────────────────────────────────
FROM nginx:1.28-alpine AS production

# Upgrade all OS packages to latest patched versions.
# This resolves Trivy CRITICAL/HIGH CVEs (including CVE-2026-42055, CVE-2026-42533,
# CVE-2026-49975, CVE-2026-9256) in nginx, libcrypto3, libssl3, musl, and zlib.
RUN apk upgrade --no-cache && apk add --no-cache --upgrade nginx

# OCI Image Labels (standard metadata for registries & scanners)
LABEL org.opencontainers.image.title="Consistium" \
      org.opencontainers.image.description="Consistium Habit Tracker — 1% better every day" \
      org.opencontainers.image.authors="Kalpana Pramodya <kalpanapramodya97@gmail.com>" \
      org.opencontainers.image.source="https://github.com/Kalpanapramodya97/consistium" \
      org.opencontainers.image.licenses="AGPL-3.0" \
      org.opencontainers.image.vendor="Consistium"

# Remove default nginx content and unnecessary system packages
RUN rm -rf /usr/share/nginx/html/* && \
    # Remove unnecessary packages to reduce attack surface
    apk --no-cache del curl || true && \
    # Create required directories for non-root nginx
    mkdir -p /var/cache/nginx/client_temp \
             /var/cache/nginx/proxy_temp \
             /var/cache/nginx/fastcgi_temp \
             /var/cache/nginx/uwsgi_temp \
             /var/cache/nginx/scgi_temp \
             /tmp/nginx && \
    # Set ownership to nginx user (UID 101 in nginx:alpine)
    chown -R 101:101 /var/cache/nginx /tmp/nginx /var/log/nginx && \
    chmod -R 755 /var/cache/nginx /tmp/nginx

# Copy validated assets from Stage 1
COPY --from=validator --chown=101:101 /assets/index.html /usr/share/nginx/html/
COPY --from=validator --chown=101:101 /assets/admin.html /usr/share/nginx/html/
COPY --from=validator --chown=101:101 /assets/style.css /usr/share/nginx/html/
COPY --from=validator --chown=101:101 /assets/app.js /usr/share/nginx/html/
COPY --from=validator --chown=101:101 /assets/assets/ /usr/share/nginx/html/assets/

# Custom nginx config
COPY --chown=101:101 nginx.conf /etc/nginx/nginx.conf

# Run as non-root user (nginx user, UID 101)
USER 101

EXPOSE 80

# Health check — lets orchestrators know when container is ready
HEALTHCHECK --interval=30s --timeout=3s --start-period=5s --retries=3 \
  CMD wget --no-verbose --tries=1 --spider http://localhost:80/ || exit 1

CMD ["nginx", "-g", "daemon off;"]

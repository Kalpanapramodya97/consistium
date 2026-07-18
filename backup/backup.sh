#!/bin/bash
# ============================================================================
# Consistium — MongoDB Backup Script
# ============================================================================
# Creates a timestamped, compressed backup of the MongoDB database.
#
# Usage:
#   ./backup/backup.sh                        # Backup from Docker Compose
#   MONGO_URI=mongodb://host:27017 ./backup.sh  # Custom URI
#
# Backups are stored in: ./backups/<timestamp>.gz
# Retention: keeps the last N backups (default: 7)
# ============================================================================

set -euo pipefail

# ── Configuration ─────────────────────────────────────────────────────────────
MONGO_URI="${MONGO_URI:-mongodb://mongodb:27017}"
DB_NAME="${DB_NAME:-consistium}"
BACKUP_DIR="${BACKUP_DIR:-./backups}"
RETENTION_COUNT="${RETENTION_COUNT:-7}"
TIMESTAMP=$(date +"%Y%m%d_%H%M%S")
BACKUP_FILE="${BACKUP_DIR}/${DB_NAME}_${TIMESTAMP}.gz"

# ── Colors ────────────────────────────────────────────────────────────────────
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
CYAN='\033[0;36m'
NC='\033[0m' # No Color

log_info()  { echo -e "${CYAN}[INFO]${NC}  $1"; }
log_ok()    { echo -e "${GREEN}[OK]${NC}    $1"; }
log_warn()  { echo -e "${YELLOW}[WARN]${NC}  $1"; }
log_error() { echo -e "${RED}[ERROR]${NC} $1"; }

# ── Pre-flight checks ────────────────────────────────────────────────────────
log_info "============================================"
log_info "  Consistium MongoDB Backup"
log_info "============================================"
log_info "Timestamp : ${TIMESTAMP}"
log_info "Database  : ${DB_NAME}"
log_info "URI       : ${MONGO_URI}"
log_info "Output    : ${BACKUP_FILE}"
log_info "Retention : last ${RETENTION_COUNT} backups"
echo ""

# Ensure backup directory exists
mkdir -p "${BACKUP_DIR}"

# ── Check MongoDB connectivity ───────────────────────────────────────────────
log_info "Checking MongoDB connectivity..."
if mongosh "${MONGO_URI}/${DB_NAME}" --eval "db.adminCommand('ping')" --quiet > /dev/null 2>&1; then
    log_ok "MongoDB is reachable."
else
    log_error "Cannot connect to MongoDB at ${MONGO_URI}"
    log_error "Is the mongodb container running? Try: docker compose up -d mongodb"
    exit 1
fi

# ── Get pre-backup stats ─────────────────────────────────────────────────────
COLLECTION_COUNT=$(mongosh "${MONGO_URI}/${DB_NAME}" --eval "db.getCollectionNames().length" --quiet 2>/dev/null || echo "?")
log_info "Collections to backup: ${COLLECTION_COUNT}"

# ── Perform backup ───────────────────────────────────────────────────────────
log_info "Starting mongodump..."

if mongodump \
    --uri="${MONGO_URI}" \
    --db="${DB_NAME}" \
    --archive="${BACKUP_FILE}" \
    --gzip \
    --quiet; then
    
    BACKUP_SIZE=$(du -h "${BACKUP_FILE}" | cut -f1)
    log_ok "Backup completed successfully!"
    log_ok "File: ${BACKUP_FILE}"
    log_ok "Size: ${BACKUP_SIZE}"
else
    log_error "mongodump failed!"
    exit 1
fi

# ── Retention policy — remove old backups ────────────────────────────────────
BACKUP_COUNT=$(find "${BACKUP_DIR}" -name "${DB_NAME}_*.gz" -type f | wc -l)

if [ "${BACKUP_COUNT}" -gt "${RETENTION_COUNT}" ]; then
    REMOVE_COUNT=$((BACKUP_COUNT - RETENTION_COUNT))
    log_info "Applying retention policy: removing ${REMOVE_COUNT} old backup(s)..."
    
    # Remove oldest backups beyond retention count
    find "${BACKUP_DIR}" -name "${DB_NAME}_*.gz" -type f -printf '%T+ %p\n' \
        | sort \
        | head -n "${REMOVE_COUNT}" \
        | awk '{print $2}' \
        | xargs rm -f
    
    log_ok "Retention policy applied. Keeping last ${RETENTION_COUNT} backups."
else
    log_info "Backup count (${BACKUP_COUNT}) within retention limit (${RETENTION_COUNT})."
fi

# ── Summary ──────────────────────────────────────────────────────────────────
echo ""
log_info "============================================"
log_ok "  Backup complete: ${BACKUP_FILE}"
log_info "============================================"
log_info "Current backups:"
ls -lh "${BACKUP_DIR}"/${DB_NAME}_*.gz 2>/dev/null | awk '{print "  " $5 "  " $9}' || true
echo ""

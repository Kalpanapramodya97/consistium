#!/bin/bash
# ============================================================================
# Consistium — MongoDB Restore Script
# ============================================================================
# Restores a MongoDB database from a compressed backup archive.
#
# Usage:
#   ./backup/restore.sh                              # Interactive (pick from list)
#   ./backup/restore.sh backups/consistium_20240101_120000.gz  # Specific file
#
# ============================================================================

set -euo pipefail

# ── Configuration ─────────────────────────────────────────────────────────────
MONGO_URI="${MONGO_URI:-mongodb://mongodb:27017}"
DB_NAME="${DB_NAME:-consistium}"
BACKUP_DIR="${BACKUP_DIR:-/workspace/backups}"

# ── Colors ────────────────────────────────────────────────────────────────────
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
CYAN='\033[0;36m'
NC='\033[0m'

log_info()  { echo -e "${CYAN}[INFO]${NC}  $1"; }
log_ok()    { echo -e "${GREEN}[OK]${NC}    $1"; }
log_warn()  { echo -e "${YELLOW}[WARN]${NC}  $1"; }
log_error() { echo -e "${RED}[ERROR]${NC} $1"; }

# ── Select backup file ──────────────────────────────────────────────────────
if [ -n "${1:-}" ]; then
    BACKUP_FILE="$1"
else
    log_info "Available backups:"
    echo ""
    
    # List backups with numbers
    mapfile -t BACKUPS < <(find "${BACKUP_DIR}" -name "${DB_NAME}_*.gz" -type f | sort -r)
    
    if [ ${#BACKUPS[@]} -eq 0 ]; then
        log_error "No backups found in ${BACKUP_DIR}"
        log_error "Run a backup first: make backup"
        exit 1
    fi
    
    for i in "${!BACKUPS[@]}"; do
        SIZE=$(du -h "${BACKUPS[$i]}" | cut -f1)
        BASENAME=$(basename "${BACKUPS[$i]}")
        echo -e "  ${CYAN}[$((i+1))]${NC} ${BASENAME} (${SIZE})"
    done
    
    echo ""
    read -rp "Select backup number [1]: " SELECTION
    SELECTION=${SELECTION:-1}
    
    INDEX=$((SELECTION - 1))
    if [ "${INDEX}" -lt 0 ] || [ "${INDEX}" -ge ${#BACKUPS[@]} ]; then
        log_error "Invalid selection: ${SELECTION}"
        exit 1
    fi
    
    BACKUP_FILE="${BACKUPS[$INDEX]}"
fi

# ── Validate backup file ────────────────────────────────────────────────────
if [ ! -f "${BACKUP_FILE}" ]; then
    log_error "Backup file not found: ${BACKUP_FILE}"
    exit 1
fi

BACKUP_SIZE=$(du -h "${BACKUP_FILE}" | cut -f1)

# ── Safety confirmation ─────────────────────────────────────────────────────
echo ""
log_info "============================================"
log_info "  Consistium MongoDB Restore"
log_info "============================================"
log_info "Backup    : ${BACKUP_FILE}"
log_info "Size      : ${BACKUP_SIZE}"
log_info "Target DB : ${DB_NAME}"
log_info "URI       : ${MONGO_URI}"
echo ""
log_warn "⚠  WARNING: This will OVERWRITE the current '${DB_NAME}' database!"
log_warn "   Existing data in '${DB_NAME}' will be REPLACED."
echo ""
read -rp "Type 'yes' to confirm restore: " CONFIRM

if [ "${CONFIRM}" != "yes" ]; then
    log_info "Restore cancelled."
    exit 0
fi

# ── Check MongoDB connectivity ───────────────────────────────────────────────
log_info "Checking MongoDB connectivity..."
if mongosh "${MONGO_URI}/${DB_NAME}" --eval "db.adminCommand('ping')" --quiet > /dev/null 2>&1; then
    log_ok "MongoDB is reachable."
else
    log_error "Cannot connect to MongoDB at ${MONGO_URI}"
    exit 1
fi

# ── Perform restore ─────────────────────────────────────────────────────────
log_info "Starting mongorestore..."

if mongorestore \
    --uri="${MONGO_URI}" \
    --db="${DB_NAME}" \
    --archive="${BACKUP_FILE}" \
    --gzip \
    --drop \
    --quiet; then
    
    log_ok "Restore completed successfully!"
else
    log_error "mongorestore failed!"
    exit 1
fi

# ── Verify restore ──────────────────────────────────────────────────────────
log_info "Verifying restored data..."
COLLECTION_COUNT=$(mongosh "${MONGO_URI}/${DB_NAME}" --eval "db.getCollectionNames().length" --quiet 2>/dev/null || echo "?")
COLLECTIONS=$(mongosh "${MONGO_URI}/${DB_NAME}" --eval "db.getCollectionNames().join(', ')" --quiet 2>/dev/null || echo "unknown")

echo ""
log_info "============================================"
log_ok "  Restore complete!"
log_info "============================================"
log_info "Collections restored: ${COLLECTION_COUNT}"
log_info "Names: ${COLLECTIONS}"
echo ""

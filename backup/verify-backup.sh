#!/bin/bash
# ============================================================================
# Consistium — Backup Verification Script
# ============================================================================
# Verifies backup integrity by restoring to a temporary MongoDB container
# and checking that collections and document counts match.
#
# Usage:
#   ./backup/verify-backup.sh                                  # Verify latest
#   ./backup/verify-backup.sh backups/consistium_20240101.gz   # Verify specific
# ============================================================================

set -euo pipefail

# ── Configuration ─────────────────────────────────────────────────────────────
MONGO_URI="${MONGO_URI:-mongodb://mongodb:27017}"
DB_NAME="${DB_NAME:-consistium}"
BACKUP_DIR="${BACKUP_DIR:-./backups}"
VERIFY_CONTAINER="consistium-backup-verify"
VERIFY_PORT="27018"

# ── Colors ────────────────────────────────────────────────────────────────────
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
CYAN='\033[0;36m'
NC='\033[0m'

log_info()  { echo -e "${CYAN}[INFO]${NC}  $1"; }
log_ok()    { echo -e "${GREEN}[✔]${NC}    $1"; }
log_fail()  { echo -e "${RED}[✘]${NC}    $1"; }
log_warn()  { echo -e "${YELLOW}[WARN]${NC}  $1"; }

PASS=0
FAIL=0

check() {
    local desc="$1"
    local result="$2"
    if [ "${result}" = "true" ]; then
        log_ok "${desc}"
        PASS=$((PASS + 1))
    else
        log_fail "${desc}"
        FAIL=$((FAIL + 1))
    fi
}

# ── Select backup file ──────────────────────────────────────────────────────
if [ -n "${1:-}" ]; then
    BACKUP_FILE="$1"
else
    # Use the most recent backup
    BACKUP_FILE=$(find "${BACKUP_DIR}" -name "${DB_NAME}_*.gz" -type f | sort -r | head -1)
fi

if [ -z "${BACKUP_FILE}" ] || [ ! -f "${BACKUP_FILE}" ]; then
    log_fail "No backup file found to verify."
    log_info "Run 'make backup' first."
    exit 1
fi

BACKUP_SIZE=$(du -h "${BACKUP_FILE}" | cut -f1)

log_info "============================================"
log_info "  Consistium Backup Verification"
log_info "============================================"
log_info "Backup : ${BACKUP_FILE}"
log_info "Size   : ${BACKUP_SIZE}"
echo ""

# ── Test 1: File integrity ───────────────────────────────────────────────────
log_info "Test 1: File integrity..."
check "Backup file exists" "true"
check "Backup file is not empty" "$([ -s "${BACKUP_FILE}" ] && echo true || echo false)"
check "Backup is valid gzip" "$(gzip -t "${BACKUP_FILE}" 2>/dev/null && echo true || echo false)"

# ── Test 2: Start temporary MongoDB ─────────────────────────────────────────
log_info "Test 2: Restore to temporary container..."

# Clean up any leftover verify container
docker rm -f "${VERIFY_CONTAINER}" 2>/dev/null || true

# Start temp MongoDB
docker run -d \
    --name "${VERIFY_CONTAINER}" \
    -p "${VERIFY_PORT}:27017" \
    mongo:6 > /dev/null 2>&1

# Wait for it to be ready
for i in {1..15}; do
    if docker exec "${VERIFY_CONTAINER}" mongosh --eval "db.adminCommand('ping')" --quiet > /dev/null 2>&1; then
        break
    fi
    sleep 1
done

check "Temporary MongoDB started" "$(docker exec "${VERIFY_CONTAINER}" mongosh --eval "db.adminCommand('ping')" --quiet > /dev/null 2>&1 && echo true || echo false)"

# ── Test 3: Restore backup ──────────────────────────────────────────────────
log_info "Test 3: Restoring backup..."

RESTORE_RESULT=$(mongorestore \
    --uri="mongodb://localhost:${VERIFY_PORT}" \
    --db="${DB_NAME}" \
    --archive="${BACKUP_FILE}" \
    --gzip \
    --quiet 2>&1 && echo "success" || echo "failed")

check "Restore completed without errors" "$([ "${RESTORE_RESULT}" = "success" ] && echo true || echo false)"

# ── Test 4: Verify data ─────────────────────────────────────────────────────
log_info "Test 4: Verifying restored data..."

VERIFY_URI="mongodb://localhost:${VERIFY_PORT}"

# Get collection count from restored backup
RESTORED_COLLECTIONS=$(mongosh "${VERIFY_URI}/${DB_NAME}" --eval "db.getCollectionNames().length" --quiet 2>/dev/null || echo "0")
check "Restored database has collections (${RESTORED_COLLECTIONS})" "$([ "${RESTORED_COLLECTIONS}" -gt 0 ] 2>/dev/null && echo true || echo false)"

# Get collection names
RESTORED_NAMES=$(mongosh "${VERIFY_URI}/${DB_NAME}" --eval "db.getCollectionNames().join(', ')" --quiet 2>/dev/null || echo "none")
log_info "  Restored collections: ${RESTORED_NAMES}"

# Compare with source database
SOURCE_COLLECTIONS=$(mongosh "${MONGO_URI}/${DB_NAME}" --eval "db.getCollectionNames().length" --quiet 2>/dev/null || echo "?")
if [ "${SOURCE_COLLECTIONS}" != "?" ]; then
    check "Collection count matches source (${RESTORED_COLLECTIONS} == ${SOURCE_COLLECTIONS})" \
        "$([ "${RESTORED_COLLECTIONS}" = "${SOURCE_COLLECTIONS}" ] && echo true || echo false)"
    
    # Compare document counts per collection
    COLLECTION_LIST=$(mongosh "${VERIFY_URI}/${DB_NAME}" --eval "db.getCollectionNames().forEach(function(c){print(c)})" --quiet 2>/dev/null || true)
    for COLL in ${COLLECTION_LIST}; do
        SOURCE_COUNT=$(mongosh "${MONGO_URI}/${DB_NAME}" --eval "db.${COLL}.countDocuments()" --quiet 2>/dev/null || echo "?")
        RESTORED_COUNT=$(mongosh "${VERIFY_URI}/${DB_NAME}" --eval "db.${COLL}.countDocuments()" --quiet 2>/dev/null || echo "?")
        check "  ${COLL}: document count matches (${RESTORED_COUNT} == ${SOURCE_COUNT})" \
            "$([ "${RESTORED_COUNT}" = "${SOURCE_COUNT}" ] && echo true || echo false)"
    done
else
    log_warn "Source database not reachable — skipping comparison."
fi

# ── Cleanup ──────────────────────────────────────────────────────────────────
log_info "Cleaning up temporary container..."
docker rm -f "${VERIFY_CONTAINER}" > /dev/null 2>&1

# ── Summary ──────────────────────────────────────────────────────────────────
echo ""
log_info "============================================"
if [ "${FAIL}" -eq 0 ]; then
    log_ok "  ALL ${PASS} CHECKS PASSED"
else
    log_fail "  ${FAIL} CHECK(S) FAILED, ${PASS} PASSED"
fi
log_info "============================================"
echo ""

exit "${FAIL}"

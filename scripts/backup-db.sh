#!/usr/bin/env bash
set -euo pipefail

ROOT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")/.." && pwd)"
BACKUP_DIR="${ROOT_DIR}/backups/db"
TIMESTAMP="$(date +"%Y%m%d-%H%M%S")"
BACKUP_FILE="${BACKUP_DIR}/darcan-${TIMESTAMP}.sql"

mkdir -p "${BACKUP_DIR}"

cd "${ROOT_DIR}"
docker compose exec -T db mysqldump -u root -proot --single-transaction --routines --triggers darcan > "${BACKUP_FILE}"

echo "Backup criado em: ${BACKUP_FILE}"

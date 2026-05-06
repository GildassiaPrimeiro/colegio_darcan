#!/usr/bin/env bash
set -euo pipefail

if [[ $# -ne 1 ]]; then
    echo "Uso: ./scripts/restore-db.sh backups/db/ficheiro.sql"
    exit 1
fi

ROOT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")/.." && pwd)"
BACKUP_FILE="$1"

if [[ ! -f "${BACKUP_FILE}" ]]; then
    echo "Ficheiro nao encontrado: ${BACKUP_FILE}"
    exit 1
fi

cd "${ROOT_DIR}"
docker compose exec -T db mysql -u root -proot darcan < "${BACKUP_FILE}"

echo "Restore concluido a partir de: ${BACKUP_FILE}"

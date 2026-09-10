#!/usr/bin/env sh
# Copia de seguridad de la base de datos SQLite y de la carpeta uploads/.
#
# Pensado para la instalación "en una sola máquina" que describe el
# README (Node + SQLite + fotos en disco). Para el despliegue con Docker
# en Windows hay un equivalente en scripts/backup.ps1.
#
# Uso:
#   sh scripts/backup.sh
#
# Variables de entorno opcionales:
#   DATABASE_URL   cadena "file:..." de Prisma  (por defecto file:./dev.db)
#   UPLOADS_DIR    carpeta de fotos             (por defecto ./uploads)
#   BACKUP_DIR     dónde dejar las copias       (por defecto ./backups)
#   BACKUP_KEEP    cuántas copias conservar     (por defecto 14)
#
# Programarlo (ejemplo, todos los días a las 4:00 con cron):
#   0 4 * * * cd /ruta/al/proyecto && sh scripts/backup.sh >> backups/backup.log 2>&1

set -eu

PROJECT_DIR=$(CDPATH= cd -- "$(dirname -- "$0")/.." && pwd)
cd "$PROJECT_DIR"

# Carga .env si existe, sin pisar variables ya definidas en el entorno.
if [ -f .env ]; then
  while IFS= read -r line || [ -n "$line" ]; do
    case "$line" in
      ''|\#*|*=*) : ;;
      *) continue ;;
    esac
    case "$line" in ''|\#*) continue ;; esac
    key=${line%%=*}
    val=${line#*=}
    # Quita comillas envolventes (simples o dobles).
    case "$val" in
      \"*\") val=${val#\"}; val=${val%\"} ;;
      \'*\') val=${val#\'}; val=${val%\'} ;;
    esac
    eval "cur=\${$key:-}"
    [ -n "$cur" ] || export "$key=$val"
  done < .env
fi

DB_URL=${DATABASE_URL:-file:./dev.db}
DB_PATH=${DB_URL#file:}
UPLOADS_DIR=${UPLOADS_DIR:-./uploads}
BACKUP_DIR=${BACKUP_DIR:-./backups}
BACKUP_KEEP=${BACKUP_KEEP:-14}

if [ ! -f "$DB_PATH" ]; then
  echo "backup: no encuentro la base de datos en '$DB_PATH'" >&2
  exit 1
fi

mkdir -p "$BACKUP_DIR"
STAMP=$(date +%Y%m%d-%H%M%S)
WORK=$(mktemp -d "${TMPDIR:-/tmp}/cuarto-oscuro-backup.XXXXXX")
trap 'rm -rf "$WORK"' EXIT

# Instantánea consistente de la base: sqlite3 .backup si está disponible
# (recomendado, no bloquea a la app); si no, una copia directa —
# aceptable aquí porque las escrituras son solo del panel de admin y muy
# esporádicas.
if command -v sqlite3 >/dev/null 2>&1; then
  sqlite3 "$DB_PATH" ".backup '$WORK/db.sqlite'"
else
  echo "backup: sqlite3 no está instalado, copio el fichero directamente" >&2
  cp "$DB_PATH" "$WORK/db.sqlite"
fi

ARCHIVE="$BACKUP_DIR/backup-$STAMP.tar.gz"
if [ -d "$UPLOADS_DIR" ]; then
  tar -czf "$ARCHIVE" -C "$WORK" db.sqlite -C "$PROJECT_DIR" "$(basename "$UPLOADS_DIR")"
else
  echo "backup: no existe '$UPLOADS_DIR', guardo solo la base de datos" >&2
  tar -czf "$ARCHIVE" -C "$WORK" db.sqlite
fi

echo "backup: creado $ARCHIVE ($(du -h "$ARCHIVE" | cut -f1))"

# Retención: deja solo las BACKUP_KEEP más recientes.
COUNT=$(ls -1 "$BACKUP_DIR"/backup-*.tar.gz 2>/dev/null | wc -l | tr -d ' ')
if [ "$COUNT" -gt "$BACKUP_KEEP" ]; then
  ls -1t "$BACKUP_DIR"/backup-*.tar.gz | tail -n +"$((BACKUP_KEEP + 1))" | while IFS= read -r old; do
    rm -f "$old"
    echo "backup: eliminado antiguo $old"
  done
fi

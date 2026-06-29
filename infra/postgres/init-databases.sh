#!/bin/sh
set -eu

PAYLOAD_DB_NAME="${PAYLOAD_DB_NAME:-payload}"
N8N_DB_NAME="${N8N_DB_NAME:-n8n}"
POSTGRES_USER="${POSTGRES_USER:-n8n}"

create_database_if_missing() {
  db_name="$1"
  exists="$(psql -v ON_ERROR_STOP=1 --username "$POSTGRES_USER" --dbname "${POSTGRES_DB:-postgres}" -tAc "select 1 from pg_database where datname = '$db_name'")"
  if [ "$exists" != "1" ]; then
    echo "Creating database: $db_name"
    psql -v ON_ERROR_STOP=1 --username "$POSTGRES_USER" --dbname "${POSTGRES_DB:-postgres}" -c "create database \"$db_name\" owner \"$POSTGRES_USER\";"
  else
    echo "Database already exists: $db_name"
  fi
}

create_database_if_missing "$PAYLOAD_DB_NAME"
create_database_if_missing "$N8N_DB_NAME"

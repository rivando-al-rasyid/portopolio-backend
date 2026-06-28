#!/bin/sh
set -eu

# Runs only on the first initialization of the postgres_data volume.
# It creates separate databases for Payload and n8n while keeping one Postgres service.

PAYLOAD_DB_NAME="${PAYLOAD_DB_NAME:-payload}"
N8N_DB_NAME="${N8N_DB_NAME:-n8n}"

create_db_if_missing() {
  db_name="$1"
  if psql -v ON_ERROR_STOP=1 --username "$POSTGRES_USER" --dbname "$POSTGRES_DB" -tAc "SELECT 1 FROM pg_database WHERE datname = '$db_name'" | grep -q 1; then
    echo "Database '$db_name' already exists"
  else
    echo "Creating database '$db_name'"
    psql -v ON_ERROR_STOP=1 --username "$POSTGRES_USER" --dbname "$POSTGRES_DB" -c "CREATE DATABASE \"$db_name\";"
  fi
}

create_db_if_missing "$PAYLOAD_DB_NAME"
create_db_if_missing "$N8N_DB_NAME"

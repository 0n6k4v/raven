FROM pgvector/pgvector:0.8.0-pg17-bookworm

ENV LANG=C.UTF-8 \
    LC_ALL=C.UTF-8 \
    LC_COLLATE=C \
    LC_CTYPE=C \
    POSTGRES_INITDB_ARGS="--locale=C --encoding=UTF8"

RUN apt-get update \
    && apt-get install -y --no-install-recommends \
        curl \
        ca-certificates \
        postgresql-17-postgis-3 \
        postgresql-17-postgis-3-scripts \
        postgresql-server-dev-17 \
    && apt-get clean \
    && rm -rf /var/lib/apt/lists/*

COPY sql-init/01-init-extensions.sql /docker-entrypoint-initdb.d/01-init-extensions.sql
COPY sql-init/02-docker_backup.sql /docker-entrypoint-initdb.d/02-docker_backup.sql

EXPOSE 5432
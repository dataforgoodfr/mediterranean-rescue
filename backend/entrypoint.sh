#!/bin/sh
# Le backend ne lit que DATABASE_URL. Sur Clever Cloud, la base liée arrive dans
# POSTGRESQL_ADDON_URI : on la recopie ici, à chaque démarrage, si DATABASE_URL n'est pas donné.
if [ -z "$DATABASE_URL" ] && [ -n "$POSTGRESQL_ADDON_URI" ]; then
  export DATABASE_URL="$POSTGRESQL_ADDON_URI"
fi
exec "$@"

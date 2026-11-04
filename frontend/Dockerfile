# Les images du site. pnpm vient de son image officielle, pas de Corepack (retiré de Node 25) :
# https://pnpm.io/docker
FROM node:24-slim AS base
COPY --from=ghcr.io/pnpm/pnpm:12 /opt/pnpm /opt/pnpm
RUN for bin in pnpm pn pnpx pnx; do ln -s "/opt/pnpm/$bin" "/usr/local/bin/$bin"; done
WORKDIR /app

# Développement (docker-compose.dev.yaml) : le code est monté, Vite recharge la page.
FROM base AS dev
CMD ["sh", "-c", "pnpm install --frozen-lockfile && pnpm dev --host 0.0.0.0"]

# Construction de l'app, avec le cache de pnpm entre deux constructions.
FROM base AS build
COPY package.json pnpm-lock.yaml ./
RUN --mount=type=cache,id=pnpm,target=/var/cache/pnpm \
    pnpm install --store-dir /var/cache/pnpm --frozen-lockfile
COPY . .
RUN pnpm build

# Production : nginx sert les fichiers construits ; Traefik envoie /api au backend.
FROM nginx:1-alpine
COPY nginx.conf /etc/nginx/conf.d/default.conf
COPY --from=build /app/dist /usr/share/nginx/html

# 1. Image temporaire pour récupérer le binaire exact de pg_dump 17
FROM postgres:17-bookworm AS pg-binaries

# 2. Image principale Node.js
FROM node:20-bookworm

# Copie explicite de pg_dump et ses dépendances système depuis l'image Postgres officielle
COPY --from=pg-binaries /usr/lib/postgresql/17/bin/pg_dump /usr/local/bin/pg_dump
COPY --from=pg-binaries /usr/lib/x86_64-linux-gnu/libpq.so* /usr/lib/x86_64-linux-gnu/

WORKDIR /app

# Copie uniquement des package.json d'abord (pour profiter du cache Docker lors du npm install)
COPY package*.json ./
COPY node/package*.json ./node/
COPY react/package*.json ./react/

# Installation des dépendances
RUN npm run install:all

# Copie du reste du code source
COPY . .

# Build
RUN npm run build

CMD ["npm", "--prefix", "node", "start"]
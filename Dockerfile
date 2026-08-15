# 1. Image temporaire pour récupérer le binaire exact de pg_dump 17
FROM postgres:17-bookworm AS pg-binaries

# 2. Image principale Node.js
FROM node:20-bookworm

# Aligne la version de npm avec le champ "packageManager" du repo
RUN npm install -g npm@11.11.0 --no-fund --no-audit

# Copie explicite de pg_dump et ses dépendances système depuis l'image Postgres officielle
COPY --from=pg-binaries /usr/lib/postgresql/17/bin/pg_dump /usr/local/bin/pg_dump
COPY --from=pg-binaries /usr/lib/x86_64-linux-gnu/libpq.so* /usr/lib/x86_64-linux-gnu/

WORKDIR /app

# Copie des manifestes et lockfiles de dépendances
COPY package*.json ./
COPY node/package*.json ./node/
COPY react/package*.json ./react/

# Installation avec devDependencies incluses pour réussir le build
RUN npm ci --include=dev && npm --prefix react ci --include=dev && npm --prefix node ci --include=dev

# Copie du reste du code source
COPY . .

# Exécution exacte de votre "npm run build"
RUN npm run build

CMD ["npm", "--prefix", "node", "start"]
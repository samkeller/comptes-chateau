# 1. On pique pg_dump 17 de l'image officielle
FROM postgres:17-bookworm AS pg-binaries

# 2. Votre environnement de travail Node
FROM node:24-bookworm

# 3. On colle pg_dump dans l'env
COPY --from=pg-binaries /usr/lib/postgresql/17/bin/pg_dump /usr/local/bin/pg_dump
COPY --from=pg-binaries /usr/lib/*-linux-gnu/libpq.so* /usr/lib/

WORKDIR /app

# 4. On copie tout
COPY . .

# 5. On installe, on build (utilise scripts deja existants)
RUN npm install -g npm@11.11.0
RUN npm run install:all
RUN npm run build

# 6. On démarre
CMD ["node", "node/dist/index.js"]
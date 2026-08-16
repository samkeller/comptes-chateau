# Chocosous backend

### Commandes

- Générer une migration `npm run typeorm -- migration:generate ./src/db/migrations/[migration-name]` <- no extension
- Générer une migration vide: `npx typeorm migration:create ./src/dev/migrations/[migration-name]` <- no extensions
- Run les migrations `npm run typeorm -- migration:run` 
- Test cron: 1. `npm run build`, 2. `node dist/jobs/index.js` 
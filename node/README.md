# Chocosous backend

### Commandes

- Générer une migration `npm run typeorm -- migration:generate ./src/db/migrations/[migration-name]` <- no extension
- Générer une migration vide: `npx typeorm migration:create ./src/dev/migrations/[migration-name]` <- no extensions
- Run les migrations `npm run typeorm -- migration:run` 
- Test cron: 1. `npm run build`, 2. `node dist/jobs/index.js`
- Données de dev : `npm run seed` (liste les scénarios), `npm run seed -- <scénario> [--clean]`. Tout ce qui crée des données (tests et dev) vit dans `src/db/fixtures` : une factory par entité, exposées par `Fixtures`.

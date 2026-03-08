# Project Overview

Application full-stack TypeScript:

- **Frontend**: React + PrimeReact dans `react/`
- **Backend**: Node.js + TypeORM + PostgreSQL dans `node/`
- **Shared**: interfaces/DTO alignes entre front et back

Objectif Copilot: proposer du code simple, type, compatible avec la structure existante.

## Tech Stack

- Front: React, TypeScript, PrimeReact, Vite
- Back: Node.js, TypeScript, TypeORM, PostgreSQL

## Structure Attendue

### Frontend (`react/src`)

- `pages/` pour les ecrans
- `components/` pour l'UI reutilisable
- `services/` pour les appels HTTP
- `interfaces/` pour les types metier/DTO
- `utils/` pour helpers purs

### Backend (`node/src`)

- `controllers/` pour HTTP + validation d'entree
- `services/` pour la logique metier
- `entities/` pour le mapping DB TypeORM
- `db/migrations/` pour l'historique de schema
- `utils/` pour helpers transverses

## Core Rules

- TypeScript strict: pas de `any` sauf cas exceptionnel justifie
- Composants React fonctionnels + hooks
- Props, retours de fonctions, DTOs explicitement types
- Nommage: `PascalCase` (composants/classes), `camelCase` (fonctions/variables), `UPPER_SNAKE_CASE` (constantes)
- Utiliser PrimeReact avant de creer des composants UI custom
- Controlleurs fins, logique metier dans les services
- Validation des entrees a la frontiere API
- Gestion systematique des erreurs async avec propagation coherente

## Migration Policy (Mandatory)

- Ne jamais creer une migration manuellement
- Toujours passer par la CLI TypeORM
- Si un changement de schema est necessaire, proposer la commande CLI au lieu d'ecrire un fichier de migration a la main

Commandes backend de reference:

- Generer une migration: `npm run typeorm -- migration:generate ./src/db/migrations/[migration-name]`
- Executer les migrations: `npm run typeorm -- migration:run`
- Tester le cron: `npm run build` puis `node dist/jobs/index.js`

## Shared Types Contract

- Reutiliser les memes shapes de donnees quand possible
- Si un contrat back change, mettre a jour front + types dans la meme PR
- Preferer des mappings explicites `Entity -> DTO`

## Instruction Modules

Use these specialized instruction files with this root guidance:

- [TypeScript Standards](./instructions/typescript.instructions.md)
- [Testing Standards](./instructions/testing.instructions.md)
- [Documentation Standards](./instructions/documentation.instructions.md)
- [Security Guidelines](./instructions/security.instructions.md)
- [Performance Guidelines](./instructions/performance.instructions.md)
- [Code Review Standards](./instructions/code-review.instructions.md)

## Expected Copilot Output

- Composants/pages React types et coherents avec l'existant
- Routes/controleurs/services backend bien separes
- Entites TypeORM alignees au schema + migrations via CLI
- Tests front/back centres sur les regles metier et regressions

## Avoid

- `any` non justifie
- Logique metier dans les controleurs
- Erreurs async non gerees
- Duplication de logique deja presente dans services/utils
- Changements de structure de dossiers sans raison explicite

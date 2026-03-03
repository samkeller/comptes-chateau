# Project Overview

Application full-stack TypeScript:

- **Frontend**: React + PrimeReact dans `react/`
- **Backend**: Node.js + TypeORM + PostgreSQL dans `node/`
- **Shared**: interfaces/DTO alignés entre front et back

Objectif Copilot: proposer du code simple, typed, compatible avec la structure existante.

## Tech Stack

- Front: React, TypeScript, PrimeReact, Vite
- Back: Node.js, TypeScript, TypeORM, PostgreSQL

## Structure attendue

### Frontend (`react/src`)

- `pages/` pour les écrans
- `components/` pour l’UI réutilisable
- `services/` pour les appels HTTP
- `interfaces/` pour les types métier/DTO
- `utils/` pour helpers purs

### Backend (`node/src`)

- `controllers/` pour HTTP + validation d’entrée
- `services/` pour la logique métier
- `entities/` pour le mapping DB TypeORM
- `db/migrations/` pour l’historique de schéma
- `utils/` pour helpers transverses

## Conventions de code

- TypeScript strict: **pas de `any`** sauf cas exceptionnel justifié
- Composants React fonctionnels + hooks
- Props, retours de fonctions, DTOs explicitement typés
- Nommage: `PascalCase` (composants/classes), `camelCase` (fonctions/variables), `UPPER_SNAKE_CASE` (constantes)

## Règles Frontend

- Utiliser PrimeReact avant de créer des composants UI custom
- Garder les composants de présentation simples; déplacer la logique data dans `services/` ou helpers
- Gérer explicitement les états `loading`, `error`, `empty`
- Éviter les styles inline si la thématisation/classes existent déjà

## Règles Backend

- Contrôleurs fins, logique métier dans les services
- Validation des entrées (params/body/query) à la frontière API
- Gestion systématique des erreurs async (`try/catch` + propagation)
- Réponses API cohérentes et typées

### Commandes backend de référence

- Générer une migration: `npm run typeorm -- migration:generate ./src/db/migrations/[migration-name]` (sans extension)
- Exécuter les migrations: `npm run typeorm -- migration:run`
- Tester le cron: `npm run build` puis `node dist/jobs/index.js`

### Politique migrations (obligatoire)

- Ne **jamais** créer une migration manuellement
- Toujours passer par la CLI TypeORM
- Si un changement de schéma est nécessaire, proposer la commande CLI au lieu d’écrire un fichier de migration à la main

## Shared types (Front/Back)

- Réutiliser les mêmes shapes de données quand possible
- Si un contrat back change, mettre à jour front + types dans la même PR
- Préférer des mappings explicites Entity -> DTO

## Ce que Copilot doit produire

- Composants/pages React typés et cohérents avec l’existant
- Routes/contrôleurs/services backend bien séparés
- Entités TypeORM alignées au schéma + migrations via CLI
- Tests front/back centrés sur les règles métier et régressions

## Ce qu’il faut éviter

- `any` non justifié
- Logique métier dans les contrôleurs
- Erreurs async non gérées
- Duplication de logique déjà présente dans services/utils
- Changements de structure de dossiers sans raison explicite

# Chocosous

Application full-stack TypeScript pour la gestion comptable (operations, natures, postes, budgets, depenses recurrentes, dashboard).
Deux utilisateurs (couple) avec plusieurs compte commun.
Application qui gère aussi: 
- gestion du budget
- kanban
- liste de courses
- notifications
- stocks placards
- etc


## Vue d'ensemble technique

- Frontend: React + TypeScript + Vite + PrimeReact (`react/`)
- Backend: Node.js + TypeScript + Express + TypeORM + PostgreSQL (`node/`)
- Contrat de donnees: interfaces/DTO alignees entre front et back
- Tests: Vitest (front et back)

## Prerequis

- Node.js (version moderne compatible npm 11)
- npm
- PostgreSQL

## Installation

Depuis la racine du projet:

```bash
npm run install:all
```

## Lancement en developpement

Depuis la racine:

```bash
npm run dev
```

Commandes equivalentes:

- Front uniquement: `npm run dev-front`
- Back uniquement: `npm run dev-back`

Port node déjà utilisé (windows)
```bash
netstat -ano | findstr :8000
taskkill /PID <PID> /F
```

## Build et execution

Build front + back depuis la racine:

```bash
npm run build
```

Demarrer le backend build:

```bash
npm start
```

## Tests
```bash

npm run tests
```

## Migrations base de donnees (TypeORM)

Ne pas creer de migration manuellement.

Generer une migration (depuis `node/`):

```bash
npm run typeorm -- migration:generate ./src/db/migrations/[migration-name]
```

Executer les migrations:

```bash
npm run typeorm -- migration:run
```

Tester le cron en local:

```bash
npm run build
node dist/jobs/index.js
```

## Principes techniques

- TypeScript strict: eviter `any` (preferer `unknown` + narrowing explicite)
- Separation des responsabilites:
  - controllers: entree/sortie HTTP + validation
  - services: regles metier
  - entities: persistence
- Mapping explicite `Entity -> DTO`
- Gestion d'erreurs async coherente
- PrimeReact prioritaire pour les composants UI

## Securite et qualite

- Validation systematique des entrees aux frontieres API
- Authentification/autorisation coherentes sur routes protegees
- Pas de secrets dans le code
- Requetes DB parametrees via TypeORM
- Tests a chaque changement de comportement metier

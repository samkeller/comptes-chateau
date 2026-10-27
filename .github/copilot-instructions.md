# Project Overview

Application full-stack TypeScript:

- **Frontend**: React + PrimeReact dans `react/`
- **Backend**: Node.js + TypeORM + PostgreSQL dans `node/`
- **Shared**: interfaces/DTO alignes entre front et back

Objectif Copilot: proposer du code simple, type, compatible avec la structure existante.

## Tech Stack

- Front: React, TypeScript, PrimeReact, Tailwind, Vite
- Back: Node.js, TypeScript, TypeORM, PostgreSQL

## Core Rules

- TypeScript strict: pas de `any` sauf cas exceptionnel justifie
- Composants React fonctionnels + hooks
- Props, retours de fonctions, DTOs explicitement types
- Nommage: `PascalCase` (composants/classes), `camelCase` (fonctions/variables), `UPPER_SNAKE_CASE` (constantes)
- Utiliser PrimeReact avant de creer des composants UI custom. La documentation est trouvable sur D:\dev\ressources-documentaires\primereact-v10\components\doc\*.tsx, Toujours consulter avant de chercher sur internet
- Utiliser Tailwind avant de creer des classes CSS custom
- Controlleurs fins, logique metier dans les services
- Validation des entrees a la frontiere API
- Gestion systematique des erreurs async avec propagation coherente

## Migration Policy (Mandatory)

- Ne jamais creer une migration manuellement
- Toujours passer par la CLI TypeORM (que l'agent peut proposer de lancer lui-meme)
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

## Gestion des tâches

Il existe deux fichiers de suivi distincts :

- `TODO.md` : backlog personnel du développeur. Ne JAMAIS le modifier, ni le lire pour décider des actions. Il n'est pas accessible à l'agent.
- `TODO_agent.md` : backlog de l'agent. Seul fichier de tâches que tu peux écrire.

### Quand écrire dans TODO_agent.md

Si tu identifies pendant ton travail une amélioration, un bug adjacent, un refactoring ou une dette technique hors du périmètre de la tâche en cours, ne l'implémente pas : ajoute-la dans `TODO_agent.md`.

### Format des entrées

- Une entrée = une action atomique, à l'infinitif, en français.
- Préfixe de priorité entre crochets : [HIGH], [MEDIUM] ou [LOW].
  Règles : sécurité/bug bloquant/cassure UX = HIGH; dette technique, homogénéité, perf = MEDIUM ; cosmétique/nice-to-have = LOW.
- Contexte utile en fin de ligne : fichier(s) concerné(s), bibliothèque suggérée, effort estimé — sur une seule ligne.
- Exemple :`- [ ] [MEDIUM] Factoriser les boutons Supprimer/Renommer en atoms DeleteButton/EditButton — cible : composants/atoms, garder compat ButtonProps`

### Déplacement dans les colonnes

- Nouvelle entrée : toujours dans "Todo".
- Tu PEUX déplacer une entrée de "Todo" vers "Review" si, après avoir travaillé dessus, tu veux que le développeur valide ton travail.
- Tu NE peux pas déplacer une entrée vers "Done ✓", ni la supprimer, ni la cocher : seul le développeur clos les tâches.
  
## Avoid

- `any` non justifie
- Logique metier dans les controleurs
- Erreurs async non gerees
- Duplication de logique deja presente dans services/utils
- Changements de structure de dossiers sans raison explicite

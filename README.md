# Comptes Chateau

Application full-stack TypeScript pour la gestion comptable (operations, natures, postes, budgets, depenses recurrentes, dashboard).

## Vue d'ensemble technique

- Frontend: React + TypeScript + Vite + PrimeReact (`react/`)
- Backend: Node.js + TypeScript + Express + TypeORM + PostgreSQL (`node/`)
- Contrat de donnees: interfaces/DTO alignees entre front et back
- Tests: Vitest (front et back)

## Architecture du repository

```text
.
|- react/                    # UI React
|  |- src/pages/             # ecrans
|  |- src/components/        # composants reutilisables
|  |- src/services/          # appels HTTP
|  |- src/interfaces/        # types metier/DTO
|  \- src/utils/             # helpers purs
|
|- node/                     # API Node/Express
|  |- src/controllers/       # couche HTTP + validation d'entree
|  |- src/services/          # logique metier
|  |- src/entities/          # mapping TypeORM
|  |- src/db/migrations/     # migrations SQL generees via CLI
|  \- src/utils/             # helpers transverses
|
\- docs/                     # documentation projet
```

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

Backend:

```bash
cd node
npm tests
```

Frontend:

```bash
cd react
npm tests
```

## Scan rapide des stocks

- Page `/stocks/scan`, accessible par l'onglet **Scan rapide** sur mobile ; la saisie manuelle fonctionne aussi sur ordinateur.
- Choisir un lieu, scanner ou saisir le code-barres, corriger le produit et valider les exemplaires. Le lieu est mémorisé pendant 30 jours (`cc.stocks.scanLocationId`).
- En cas d'échec d'enregistrement, vérifier les stocks avant de recommencer : une réponse réseau perdue peut masquer un ajout réussi. La reprise automatique est désactivée pour éviter les doublons.
- La caméra nécessite **HTTPS** ou localhost. Pour tester sur téléphone, utiliser un tunnel HTTPS vers Vite (avec son proxy `/api`) ou un environnement HTTPS ; une URL HTTP sur le réseau local ne suffit pas.
- Le lookup authentifié `GET /api/stocks/items/lookup/:barcode` consulte d'abord les produits existants, puis Open Food Facts côté serveur (timeout de 3 secondes). Une panne OFF laisse la saisie manuelle disponible. Aucun changement de schéma.
- Dépendances ajoutées : `@zxing/browser` 0.1.5, `@zxing/library` 0.21.3 (formats EAN/UPC), `tesseract.js` 7.0.0.
- **Scanner la date** traite la photo localement, sans envoi à un service externe. Toujours confirmer/corriger la date proposée ; la saisie manuelle reste disponible.
- Les assets OCR et langues français/anglais sont servis depuis `react/public/tesseract/`, avec leurs licences et provenance. Tesseract est chargé à la demande ; ses assets et chunks OCR sont exclus du précache PWA.
- La CSP conserve les valeurs Helmet par défaut, avec `worker-src 'self'` et `script-src 'self' 'wasm-unsafe-eval'` pour l'OCR local (pas de CDN, `blob:` ni `unsafe-eval`).

Avant production, vérifier sur un téléphone HTTPS les permissions caméra, les scans successifs, une photo réelle de date, la coupure de la caméra en quittant la page et le lieu après rechargement. Les tests automatisés ne remplacent pas ces vérifications matérielles.

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


## Cadrage metier actuel (reponses confirmees)

Les points suivants sont valides a date.

1. Finalite produit:
   application simple de gestion des comptes du foyer (couple).
2. Regles metier:
   pas de regles formelles pour l'instant.
3. Vocabulaire metier minimal:
   `nature` = type d'operation (CB, cheque, etc.),
   `poste` = categorie ad-hoc libre.
4. Gouvernance:
   arbitrages fonctionnels via un "conseil de famille" (vous + votre femme).
5. Roles et permissions:
   rien de specifique prevu pour l'instant.
   
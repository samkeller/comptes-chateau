# Refactor Pipeline DataTable -> API -> QueryBuilder

## Contexte
Le flux `AccountBook` / `GET /operation/lazy` avait une logique de tri/filtre/pagination partiellement dupliquée entre front et back.

Problèmes observés:
- Mapping front manuel fragile (`switch` sur filtres).
- Risque de dérive sur `sortField` dynamique.
- Comportements SQL métier (ex: `amount = credit - debit`) peu testés en exécution réelle.
- Regressions fonctionnelles difficiles a capter avec des TU trop "unitaires".

## Objectifs couverts
- Uniformiser le pipeline entre PrimeReact et TypeORM.
- Centraliser la validation et le mapping des queries table.
- Securiser les champs de tri/filtre par allowlist.
- Corriger et verrouiller le tri montant.
- Ajouter une couverture de non-regression au niveau HTTP.

## Architecture cible

### Frontend
1. DataTable PrimeReact produit un `lazyState`.
2. `DataTableQueryCodec` convertit ce state vers un contrat query API stable:
   - pagination: `skip`, `take`
   - tri: `field`, `direction`
   - filtres: `simple` ou `operator`
3. `AccountingService` envoie la query serialisee vers `/operation/lazy`.

### Backend
1. `TableQueryParser` parse/valide `req.query`.
2. `TableQueryMapper` applique filtres + tri sur le `SelectQueryBuilder`.
3. `operationTableQueryConfig` définit, par champ autorisé:
   - le tri SQL
   - le filtre SQL
   - le tri par defaut

## Modifications realisees

### Front
- `react/src/services/tableQuery/DataTableQueryCodec.ts`
  - Nouveau codec central PrimeReact -> query API.
  - Support filtres `simple` et `operator`.
  - Normalisation des valeurs (dates en format API, nettoyage des valeurs vides).
- `react/src/services/AccountingService.ts`
  - Suppression de la serialisation manuelle.
  - Delegation au codec.
- `react/src/pages/accountBook/AccountBook.tsx`
  - Utilisation du type `DataTableLazyState` partage.
  - Ajout du filtre `amount` cote DataTable.
  - Ajustements `dataType`/sort/filter pour coherence PrimeReact.

### Back
- `node/src/services/queryMappers/parsers/TableQueryParser.ts`
  - Parse/validation de `skip`, `take`, `sortField`, `sortOrder`, `filters`.
  - Rejet explicite des champs non autorises via `TableQueryValidationError`.
- `node/src/services/queryMappers/TableQueryMapper.ts`
  - Handlers generiques tri/filtre (texte, date, booleen, numerique, computed sort).
- `node/src/services/queryMappers/operationTableQueryConfig.ts`
  - Mapping metier de `AccountingLine`.
  - Tri `amount` via alias SQL compute (`amount_sort`) pour eviter les erreurs d'alias TypeORM.
  - Tri secondaire `al.id` pour stabilite.
- `node/src/controllers/OperationControllers.ts`
  - Route `/lazy` convertie en pipeline parser+mapper+config.
  - Validation 400 pour query invalide.
  - Nettoyage responsabilites: options parser centralisees, `qb` immutable.
  - Harmonisation `POST /operation` en `async/await` avec gestion d'erreur explicite.

### Tests
- `react/src/services/tableQuery/DataTableQueryCodec.test.ts`
  - Pagination, tri, filtres simples, filtres operator, serialisation query params.
- `node/src/services/queryMappers/parsers/TableQueryParser.test.ts`
  - Cas nominal, defaults, erreurs de validation, bornes pagination.
- `node/src/services/queryMappers/TableQueryMapper.test.ts`
  - Dispatch sort/filter handlers.
- `node/src/services/queryMappers/operationTableQueryConfig.test.ts`
  - Verification du SQL mappe (tri amount, filtres date/texte/booleen/numerique).
- `node/src/controllers/OperationControllers.integration.test.ts`
  - Tests HTTP + DB in-memory (`pg-mem`) sur `/operation/lazy`:
    - tri `amount` ASC/DESC
    - filtre `amount` operator OR
    - filtre `amount` simple equals
    - tri `dateValeur` ASC
    - 400 sur `sortField` non autorise
    - 400 sur filter field non autorise
- `node/src/tests/SetupTests.ts`
  - Setup factorise des fonctions de compatibilite Postgres pour `pg-mem`.

## Outillage de tests ajoute
- Backend (`node/package.json`):
  - script `test`: `vitest run`
  - dev deps: `vitest`, `pg-mem`, `supertest`, `@types/supertest`
- Frontend (`react/package.json`):
  - script `test`: `vitest run`
  - dev dep: `vitest`
- Configs:
  - `node/vitest.config.ts`
  - `react/vitest.config.ts`

## Resultat fonctionnel
- Tri montant corrige et stabilise.
- Parsing/validation unifies et stricts.
- Non-regression couverte a 2 niveaux:
  - niveau mapping (TU)
  - niveau API+DB (integration)

## Commandes utiles
- Lancer les tests backend:
  - `cd node && npm test`
- Lancer les tests frontend:
  - `cd react && npm test`

## Limites / prochaines etapes
- Validation schema formelle avec Zod non introduite (validation actuelle custom via parser).
- Extension du pattern a d'autres endpoints lazy non faite (focus V1 sur `operation/lazy`).
- Possibles tests integration additionnels a envisager:
  - `nature.label`, `poste.label`, `isChecked`
  - cas limites `between`, `in/notIn`, timezone/date-only

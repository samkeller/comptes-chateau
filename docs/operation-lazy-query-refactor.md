# Pipeline Generique Tri/Filtre/Pagination

## But
Documenter le contrat unique entre le front et le back pour les besoins repetitifs de tri, filtres et pagination.

Le principe: on ne fait plus de parsing "au cas par cas" dans chaque ecran ou controller.

## Besoin initial
Problematique constatee:
1. Les tris/filtres PrimeReact etaient traites localement, endpoint par endpoint.
2. Le front manipule naturellement un state de type "lazy" (pagination, tri, filtres).
3. Les filtres PrimeReact (`DataTableFilterMetaData` et `DataTableOperatorFilterMetaData`) doivent etre transformes en `req.query` stable.
4. Le back doit traduire ce contrat en `QueryBuilder` de maniere securisee et reutilisable.

Objectif architectural:
- Front: un codec unique de serialisation.
- Back: un parser de validation + un mapper QueryBuilder.
- Endpoint-specifique: configuration explicite des champs autorises et de leur traduction SQL.

## Flux Bout-En-Bout

### 1) PrimeReact -> Contrat API (front)
Fichier cle: `react/src/services/tableQuery/DataTableQueryCodec.ts`

`DataTableQueryCodec` convertit un `DataTableLazyState` PrimeReact en contrat API:
- pagination: `skip`, `take`
- tri: `sortField`, `sortOrder`
- filtres: `filters` (JSON stringifie), sous forme d'objets `simple` ou `operator`

Le codec normalise aussi les valeurs:
- dates -> `YYYY-MM-DD`
- valeurs vides -> ignorees (pas envoyees)

### 2) Contrat API -> Parse/Validation (back)
Fichier cle: `node/src/services/queryMappers/parsers/TableQueryParser.ts`

`TableQueryParser.parse(req.query, options)` valide:
- `skip`, `take` (bornes)
- `sortField` (allowlist)
- `filters` (JSON valide + champs autorises)

Le parseur retourne un objet type `ParsedTableQuery` utilisable par le mapper.

### 3) ParsedQuery -> QueryBuilder SQL (back)
Fichier cle: `node/src/services/queryMappers/TableQueryMapper.ts`

`TableQueryMapper` applique:
- les filtres via handlers (`applySimple` / `applyOperator`)
- le tri via handlers SQL
- un tri par defaut stable

Les regles metier endpoint-specifiques sont centralisees dans une config (ex: `operationTableQueryConfig.ts`).

## DataTableFilterMetaData -> API (contrat explicite)

### Types PrimeReact source
PrimeReact expose:
- `DataTableFilterMetaData`: filtre simple (`value`, `matchMode`)
- `DataTableOperatorFilterMetaData`: filtre compose (`operator`, `constraints[]`)

### Mapping contrat API

Filtre simple PrimeReact:

```ts
// PrimeReact
{ value: "rent", matchMode: "contains" }

// Contrat API serialise dans "filters"
{
  type: "simple",
  field: "label",
  matchMode: "contains",
  value: "rent"
}
```

Filtre operator PrimeReact:

```ts
// PrimeReact
{
  operator: "or",
  constraints: [
    { value: -50, matchMode: "lt" },
    { value: 100, matchMode: "gt" }
  ]
}

// Contrat API serialise dans "filters"
{
  type: "operator",
  field: "amount",
  operator: "or",
  constraints: [
    { matchMode: "lt", value: -50 },
    { matchMode: "gt", value: 100 }
  ]
}
```

Exemple de `req.query` effectivement envoye:

```http
GET /api/operation/lazy?skip=0&take=50&sortField=amount&sortOrder=DESC&filters=[...] 
```

## Pourquoi c'est generique (et evolutif)

Benefices immediats:
- Evite la duplication de parsing et de validation.
- Rend le contrat front/back explicite et testable.
- Renforce la securite (allowlist des champs triables/filtrables).
- Facilite les extensions (nouveau champ = config handler, pas nouveau parser complet).

Benefices long terme:
- Meme pipeline reutilisable pour d'autres ecrans lazy.
- Moins de regressions lors d'evolutions SQL/metier.
- Possibilite d'introduire une validation schema (ex: Zod) sans changer le protocole front/back.

## Variante QueryParamsParser (cas non-DataTable)

Fichier cle: `node/src/services/queryMappers/parsers/QueryParamsParser.ts`

Pour les endpoints qui ne suivent pas exactement le contrat DataTable (ex dashboard),
`QueryParamsParser` fournit un parsing schema-based simple:

```ts
const parsed = QueryParamsParser.parse(req.query, {
  from: QueryParamsParser.requiredDate,
  to: QueryParamsParser.requiredDate,
  posteIds: QueryParamsParser.requiredCsvIntegerList
});
```

Utilisation metier: `node/src/services/queryMappers/parsers/DashboardMonthlyByPosteQueryParser.ts`

## Comment en prendre soin (sans tout casser)

Regles de maintenance:
1. Ne jamais parser `req.query` manuellement dans un controller pour tri/filtre/pagination.
2. Toujours passer par un codec front (`DataTableQueryCodec` ou codec dedie).
3. Toujours passer par un parser back (`TableQueryParser` ou `QueryParamsParser`).
4. Toujours restreindre les champs via allowlists/handlers.
5. Toute evolution de contrat doit etre faite front + back + tests dans la meme PR.

Checklist de changement:
1. Ajouter/modifier champ dans le codec front.
2. Ajouter/modifier handler dans config mapper back.
3. Mettre a jour allowlists du parser.
4. Ajouter tests unitaires (codec + parser + mapper).
5. Ajouter/adapter tests integration endpoint.

## Strategie de tests anti-regression

Niveaux de tests requis:
- Front codec: serialisation stable (`DataTableQueryCodec.test.ts`).
- Back parser: validation stricte (`TableQueryParser.test.ts`, `QueryParamsParser.test.ts`).
- Back mapper/config: traduction SQL correcte (`TableQueryMapper.test.ts`, `operationTableQueryConfig.test.ts`).
- Integration API: comportement reel endpoint (`OperationControllers.integration.test.ts`, `DashboardController.integration.test.ts`).

Tests a verifier a chaque evolution:
- champ de tri non autorise -> `400`
- champ de filtre non autorise -> `400`
- filtre operator (and/or)
- cas dates (`between`, `dateBefore`, `dateAfter`)
- pagination (`skip`, `take`) et bornes

## JSDoc et code comments

Fichiers qui portent le contrat et doivent rester documentes:
- `react/src/services/tableQuery/DataTableQueryCodec.ts`
- `node/src/services/queryMappers/parsers/TableQueryParser.ts`
- `node/src/services/queryMappers/TableQueryMapper.ts`
- `node/src/services/queryMappers/parsers/QueryParamsParser.ts`

Regle: toute methode publique de parsing/serialisation doit conserver un JSDoc qui precise:
- format d'entree attendu
- format de sortie
- erreurs possibles
- invariants metier (ex: allowlist, bornes)


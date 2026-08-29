# @chocosous/shared

Ce package privé centralise les contrats et le code réellement communs au backend Node et au frontend React. Il évite que les DTO, les schémas de validation et les types d'API divergent entre les deux applications.

## Architecture dist-first

Le package est toujours consommé depuis son artefact compilé :

```text
shared/src -> tsc -> shared/dist -> node et react
```

- `shared/src` contient les sources TypeScript.
- `shared/dist` contient le JavaScript exécuté et les déclarations `.d.ts` utilisées par TypeScript.
- `node` et `react` importent exclusivement le point d'entrée `@chocosous/shared`.
- Aucun consommateur ne doit importer directement depuis `shared/src`.

Les npm workspaces relient le package local aux deux applications. Depuis la racine, `npm install` installe toutes les dépendances et le script `prepare` construit `shared/dist`.

## Importer un contrat

```ts
import {
    CreateStockItemSchema,
    type CreateStockItemDto,
} from "@chocosous/shared";
```

## Ajouter un contrat

Zod est la source de vérité lorsqu'une validation à l'exécution est nécessaire :

```ts
import { z } from "zod";

export const MySchema = z.object({
    id: z.number().optional(),
    label: z.string(),
});

export type MyDto = z.infer<typeof MySchema>;
```

Le contrat doit être exporté depuis `shared/src/index.ts`. Il ne faut pas créer de copie ou de fichier proxy dans `node` ou `react`.

Si un schéma utilise `coerce`, `transform`, `preprocess`, `default` ou un pipe, il faut vérifier explicitement si le contrat public correspond à `z.input` ou à `z.output` avant de choisir son type.

## Valider dans Express

```ts
import { CreateStockItemSchema } from "@chocosous/shared";

router.post(
    "/items",
    validateBody(CreateStockItemSchema),
    stockController.createItem,
);
```

Le schéma compilé dans `shared/dist` assure la validation à l'exécution. Le type TypeScript ne remplace jamais cette validation.

## Utiliser un type dans React

```ts
import type { CreateStockItemDto } from "@chocosous/shared";

function createItem(payload: CreateStockItemDto) {
    return axios.post("/api/stocks/items", payload);
}
```

Les déclarations générées dans `shared/dist` fournissent le typage au frontend sans exposer directement les sources du package.

## Build et développement

Depuis la racine :

```bash
npm run build
```

Le build global compile d'abord `shared`, puis `react` et `node`.

En développement :

```bash
npm run dev
```

Cette commande lance `tsc --watch` pour `shared` en parallèle du frontend et du backend. Toute modification de `shared/src` régénère automatiquement `shared/dist`.

## Ce qui peut entrer dans shared

- les contrats de requête et de réponse API ;
- les schémas Zod ;
- les types, les enums et les constantes communs ;
- les petits utilitaires purs et indépendants de l'environnement.

## Ce qui doit rester dans les applications

- Express, les services backend, les entités et la base de données ;
- React, les composants, les hooks et l'état frontend ;
- Axios et les clients HTTP ;
- les API propres à Node, au navigateur ou au DOM ;
- les utilitaires dont le comportement métier diffère entre le frontend et le backend.

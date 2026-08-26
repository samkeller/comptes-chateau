# Atomic Design

L'Atomic Design organise l'interface par niveau de complexité et de responsabilité, et non par simple découpage technique.

L'objectif est de construire des composants cohérents, composables et compréhensibles, sans chercher à multiplier les abstractions.

## Atoms

Les atoms sont les briques UI fondamentales.

Ils portent une responsabilité visuelle ou interactionnelle unique et ne dépendent pas d'un contexte métier complexe.

Exemples :

- `Button`
- `Input`
- `Icon`
- `Badge`
- `Label`

Un atom doit être suffisamment simple pour être facilement composable.

## Molecules

Les molecules combinent plusieurs atoms pour former une interaction ou un élément fonctionnel cohérent.

Exemples :

- `SearchField` = `Input` + `Button`
- `FormField` = `Label` + `Input` + message d'erreur
- `PasswordField` = `Input` + action de visibilité

Une molecule doit représenter une intention fonctionnelle identifiable, pas simplement un groupe d'éléments.

## Organisms

Les organisms assemblent atoms et molecules pour constituer une section fonctionnelle complète de l'interface.

Exemples :

- `Header`
- `UserForm`
- `SearchPanel`
- `DataTable`

Ils peuvent porter davantage de logique de présentation et d'orchestration, tout en conservant une responsabilité claire.

## Templates & Pages

Les templates définissent la structure et la composition d'une page sans être liés à des données métier spécifiques.

Les pages injectent les données, orchestrent les états et connectent les composants au domaine applicatif.

```
Atoms
  ↓
Molecules
  ↓
Organisms
  ↓
Templates
  ↓
Pages
```

Chaque niveau doit composer le niveau inférieur, plutôt que recréer ses responsabilités.

## Règles de conception

1. **Une abstraction doit avoir une raison d'être**

   Ne pas créer un composant uniquement pour réduire le nombre de lignes ou parce qu'un élément « pourrait » être réutilisé.

2. **La composition prime sur la spécialisation**

   Préférer :

   ```tsx
   <FormField>
       <Input />
   </FormField>
   ```

   à une multitude de composants spécialisés qui encapsulent artificiellement la même logique.

3. **Une responsabilité par composant**

   Si un composant devient difficile à nommer précisément, il est probablement trop large.

4. **Le niveau Atomic Design ne dépend pas de la taille**

   Un composant volumineux n'est pas nécessairement un organism, et un petit composant n'est pas automatiquement un atom.

   Le niveau est déterminé par son rôle dans la composition.

5. **Qualité avant quantité**

   Il vaut mieux quelques composants bien définis, composables et stables qu'une multitude de composants artificiellement découpés.

Atomic Design n'est pas une règle pour créer plus de composants. C'est une méthode pour créer de meilleures abstractions.

## Convention dans ce projet

Les pages complexes organisent leurs composants dans des sous-dossiers locaux à la page, plutôt que dans un dossier `components/` global :

```
pages/<feature>/
  <Feature>Page.tsx        # page : orchestration, état, appels services
  atoms/
  molecules/
  organisms/
```

Exemples existants : `pages/kanban` et `pages/stocks`.

- Un composant ne rejoint `atoms/`, `molecules/` ou `organisms/` que s'il est réutilisé au sein de la page ou justifie une séparation claire de responsabilité (ex : panneau desktop vs. carte d'item).
- Les dialogues (`XxxDialog.tsx`) et autres éléments propres à une seule page restent à la racine du dossier de la page tant qu'ils ne sont pas décomposés en sous-parties réutilisables.
- Ne pas créer ces sous-dossiers pour une page simple : appliquer la règle « une abstraction doit avoir une raison d'être ».
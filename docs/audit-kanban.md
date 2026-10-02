# Audit du module Kanban

**Périmètre :** audit statique du frontend `react/` et du backend `node/`, sans changement de comportement.  
**Date :** 2026-10-02.

Les efforts sont estimés pour une correction isolée (S : petite, M : moyenne, L : importante). Le risque de production décrit le risque actuel ou, pour une proposition, le risque induit par sa mise en œuvre.

## Synthèse

Aucun blocage global empêchant l’usage du Kanban n’a été identifié. Deux sujets métier méritent toutefois une correction prioritaire : l’attribution répétée d’XP à une tâche terminée et la validation/ réponse HTTP de la route de mise à jour. La densité des cartes et la découverte des commentaires sont les principaux irritants d’usage, surtout sur mobile.

## 1. Front : lisibilité et ergonomie

### Important — La carte affiche trop de détails

- **Fichier :** `react/src/pages/kanban/KanbanTaskCard.tsx`
- **Constat :** chaque carte montre le titre (jusqu’à deux lignes), les avatars des assignés, la priorité, jusqu’à trois tags et un compteur de tags supplémentaires, ainsi que jusqu’à cinq lignes de description Markdown. Une tâche sans description affiche aussi un message dédié. L’état terminé est ajouté en surimpression.
- **Correctif proposé :** réserver la carte à un titre, un indicateur de priorité, les avatars des assignés, l’état et un compteur de commentaires. Déplacer description, tags et autres détails dans le dialogue ouvert à la demande.
- **Effort :** S/M.
- **Risque prod :** faible à moyen ; des informations aujourd’hui visibles disparaîtront des cartes. Vérifier que leur accès au détail reste évident et que l’état est compréhensible.

### Important — Les commentaires sont peu découvrables et difficiles à atteindre sur mobile

- **Fichiers :** `react/src/pages/kanban/KanbanTaskCard.tsx`, `react/src/pages/kanban/organisms/KanbanTaskDialog.tsx`, `react/src/pages/kanban/organisms/KanbanCommentSection.tsx`
- **Constat :** aucune carte n’indique qu’elle a des commentaires. Il faut ouvrir la tâche puis choisir l’onglet « Commentaires » sur mobile (deux actions) ; sur desktop, les commentaires apparaissent dans le dialogue ouvert depuis la carte. Le bouton de suppression d’un commentaire est une cible de 24 × 24 px environ, révélée par `group-hover` : elle est peu découvrable et le survol n’existe pas sur écran tactile.
- **Correctif proposé :** ajouter un compteur/action « Commentaires » visible et assez grand sur la carte ou dans l’en-tête du détail ; rendre les actions accessibles au toucher, sans dépendre du survol.
- **Effort :** S/M.
- **Risque prod :** faible si les opérations existantes et les règles de suppression des commentaires restent inchangées.

### Confort — Filtres et tri à simplifier sans supprimer une fonction utile à l’aveugle

- **Fichiers :** `react/src/pages/kanban/KanbanFilters.tsx`, `react/src/pages/kanban/KanbanPage.tsx`, `react/src/pages/kanban/KanbanColumnDisplay.tsx`
- **Constat :** les filtres par tags et assignés sont deux sélecteurs toujours présents ; « Afficher les terminées » est un bouton séparé, activé par défaut à false. Dans chaque colonne, les tâches terminées sont reléguées en bas puis triées par priorité. Il n’y a pas de choix de tri utilisateur.
- **Correctif proposé :** conserver le filtre des tâches terminées et les filtres tags/assignés, mais les regrouper sous une action « Filtrer » adaptée aux petits écrans. Garder le tri automatique actuel tant qu’un besoin de tri alternatif n’est pas confirmé ; ne pas retirer un filtre sur la seule base de l’audit statique.
- **Effort :** S.
- **Risque prod :** faible ; un regroupement peut réduire la découvrabilité des filtres si le libellé ou l’état actif ne sont pas visibles.

### Confort — Le dialogue mobile est fenêtré et sépare tâche/commentaires

- **Fichiers :** `react/src/pages/kanban/organisms/KanbanTaskDialog.tsx`, `react/src/pages/kanban/molecules/KanbanTaskDialogForm.tsx`
- **Constat :** le dialogue prend 90 vw × 90 vh ; le formulaire et les commentaires sont présentés par onglets sur mobile. Le formulaire contient plusieurs contrôles et une barre d’édition Markdown.
- **Correctif proposé :** à l’occasion d’une évolution de l’écran, tester un détail plein écran sur téléphone, avec navigation et actions principales persistantes et zones tactiles confortables. La disposition desktop en dialogue peut rester inchangée.
- **Effort :** M.
- **Risque prod :** faible à moyen ; les différences de taille d’écran et le clavier virtuel peuvent affecter le défilement.

### Grammaire graphique recommandée

- **Carte minimale :** titre, indicateur de priorité, avatars des assignés, état terminé, compteur de commentaires.
- **Détail à la demande :** description Markdown, tags, édition, choix de colonne et fil de commentaires.
- Les informations doivent rester accessibles au clavier et au toucher ; les actions ne doivent pas dépendre d’un survol. Ce changement peut être livré séparément si sa portée visuelle est jugée trop large pour la PR 2.

## 2. Markdown : inventaire et approche recommandée

### Inventaire vérifié

- **Affichage — `react-markdown` + `remark-gfm` :** utilisés par `react/src/components/atoms/MarkdownRenderer.tsx`, appelé pour les descriptions de cartes, les commentaires et le changelog (`react/src/pages/kanban/KanbanTaskCard.tsx`, `react/src/pages/kanban/organisms/KanbanCommentSection.tsx`, `react/src/components/ChangelogDialog.tsx`). Le composant désactive le HTML brut (`skipHtml`) et active les extensions GFM.
- **Édition — Tiptap :** `@tiptap/react`, `@tiptap/starter-kit` et `@tiptap/markdown` sont utilisés par `react/src/components/form/markdown/MarkdownEditor.tsx` et sa barre d’outils `react/src/components/form/markdown/MarkdownToolbar.tsx`. L’éditeur sert aux descriptions de tâche et à la rédaction des commentaires.
- Aucun autre parseur/rendu Markdown maison ou dépendance Markdown n’a été trouvé dans `react/src`. Le rendu et l’édition reposent donc sur deux pipelines distincts, avec un risque de différence de syntaxe ou de sérialisation.

### Décision proposée pour le Kanban et `/notes`

Retenir **une bibliothèque par rôle** : `react-markdown` avec `remark-gfm` pour le rendu sûr des contenus, et Tiptap avec son extension Markdown pour l’édition. C’est une seule approche produit cohérente, explicitement permise par le périmètre, et elle conserve l’éditeur déjà en place tout en assurant un rendu GFM des listes. Le contenu Markdown des notes doit être limité au sous-ensemble commun réellement testé (titres `#`/`##`, listes, gras) ; les checklists `/notes` restent des items structurés plutôt que des task lists Markdown.

Ajouter des tests de conversion/rendu pour ce sous-ensemble avant de généraliser aux notes. Ne pas remplacer Tiptap par un champ texte ni retirer des dépendances dans le seul but de réduire le nombre de paquets : cela supprimerait l’éditeur formaté utilisé en production.

### Bundle

Lors de l’audit initial, la comparaison chiffrée n’était pas disponible : les dépendances Node n’étaient pas installées et aucune mesure Vite par fonctionnalité n’existait. Pour la livraison des correctifs Kanban, le chunk JS principal Vite est passé de **2 422,77 kB / 749,35 kB gzip** à **2 423,07 kB / 750,91 kB gzip** (+0,30 kB brut / +1,56 kB gzip). Cette variation couvre les changements Kanban et n’isole pas le coût Markdown. Les dépendances Markdown étant conservées, aucun gain lié à leur suppression n’est revendiqué.

## 3. Back : constats

### Important — `markTaskAsDone` n’est pas idempotent et crédite l’XP à chaque appel

- **Fichiers :** `node/src/modules/kanban/services/KanbanBoardService.ts`, `node/src/modules/kanban/controllers/KanbanController.ts`
- **Constat :** `markTaskAsDone` remet `isDone` à true puis appelle `addXPForUser` sans vérifier si la tâche était déjà terminée. Un appel répété crédite donc de l’XP en double ou davantage et remplace `doneByUserId`. L’endpoint utilise l’utilisateur authentifié ; aucun contrôle supplémentaire de `doneBy` n’est requis pour empêcher la répétition. Il n’existe pas de route pour rouvrir une tâche.
- **Correctif proposé :** rendre la transition vers « terminée » idempotente, ne créditer l’XP qu’au premier passage et couvrir cette règle par un test de service. Traiter une éventuelle réouverture comme une fonctionnalité distincte, avec règle XP explicite.
- **Effort :** S/M.
- **Risque prod :** élevé sur l’intégrité de l’XP tant que ce comportement subsiste ; faible pour une garde testée qui conserve l’API.

### Important — `PATCH /kanban/task/:id` renvoie `201` et exige le schéma de création

- **Fichiers :** `node/src/modules/kanban/controllers/KanbanController.ts`, `node/src/modules/kanban/routes/KanbanRoutes.ts`, `shared/src/contracts/kanban/CreateKanbanTaskDto.ts`
- **Constat :** `saveTask` renvoie `201` (création) au lieu de `200`. La route PATCH réutilise `CreateKanbanTaskSchema` : le titre et `columnId` sont requis, tandis que certains autres champs sont facultatifs. Le comportement de mise à jour est donc une mise à jour complète de ces champs requis et partielle des tags/assignés, sans contrat PATCH dédié.
- **Correctif proposé :** renvoyer `200` et définir un schéma de mise à jour qui représente exactement les champs mutables/partiels. Adapter le front dans la même livraison ou conserver temporairement la forme existante en complément pour ne pas casser les clients déjà déployés.
- **Effort :** S/M.
- **Risque prod :** moyen si le schéma ou le contrat front/back change de façon désynchronisée ; faible pour la correction du seul statut.

### Important — La transition métier et l’attribution d’XP ne sont pas atomiques

- **Fichiers :** `node/src/modules/kanban/services/KanbanBoardService.ts`, `node/src/modules/core/services/UserXpService.ts`
- **Constat :** l’état terminé est sauvegardé avant l’écriture d’XP ; `UserXpService` écrit ensuite le total et émet un événement. Une erreur après la sauvegarde peut laisser la tâche terminée sans XP alors que la requête échoue. L’écriture d’une tâche créée et son XP de création suivent aussi deux opérations séparées.
- **Correctif proposé :** évaluer une transaction pour les écritures métier/XP et un mécanisme d’événement cohérent avec le commit. Pour la première correction, au minimum rendre le crédit de fin idempotent et documenter la gestion d’un échec de crédit ; ne pas masquer une erreur en annonçant une réussite.
- **Effort :** M/L.
- **Risque prod :** moyen ; une correction transactionnelle peut changer la livraison des événements XP si elle n’est pas testée.

### Important — Une colonne inexistante lors d’une mise à jour devient une erreur DB

- **Fichiers :** `node/src/modules/kanban/services/KanbanBoardService.ts`, `shared/src/contracts/kanban/CreateKanbanTaskDto.ts`
- **Constat :** `createTask` vérifie l’existence de la colonne avant de sauvegarder ; `saveTask` affecte directement `body.columnId` et s’en remet à la contrainte FK. Le schéma valide un entier, pas l’existence de la colonne ; une valeur inconnue peut ainsi produire une erreur base de données au lieu d’une erreur applicative `KANBAN_COLUMN_NOT_FOUND`.
- **Correctif proposé :** appliquer aussi à la mise à jour une vérification explicite de colonne et un test du cas inconnu.
- **Effort :** S.
- **Risque prod :** faible ; corrige un cas invalide avec une erreur cohérente.

### Important — Le schéma ne borne pas le titre à la longueur de la colonne DB

- **Fichiers :** `shared/src/contracts/kanban/CreateKanbanTaskDto.ts`, `node/src/modules/kanban/entities/KanbanTask.ts`
- **Constat :** Zod exige un titre non vide mais ne fixe pas de longueur maximale, alors que la colonne `title` est `varchar(255)`. Un titre trop long passe la validation d’entrée puis échoue lors de l’écriture en base. `description` est aussi sans limite applicative ; son stockage `text` ne pose pas la même contrainte immédiate, mais peut accepter un contenu disproportionné.
- **Correctif proposé :** aligner explicitement la taille maximale du titre sur 255 et définir une limite raisonnable pour la description, avec tests de limites. Vérifier que le front affiche les erreurs de validation de manière exploitable.
- **Effort :** S.
- **Risque prod :** faible ; les requêtes actuellement acceptées mais impossibles à stocker seront rejetées proprement.

### Confort — Les commentaires d’une tâche inexistante renvoient une liste vide

- **Fichiers :** `node/src/modules/kanban/services/KanbanBoardService.ts`, `node/src/modules/kanban/controllers/KanbanController.ts`
- **Constat :** `getTaskComments` interroge directement les commentaires sans vérifier que la tâche existe. Un identifiant valide mais absent ressemble donc à une tâche existante sans commentaire.
- **Correctif proposé :** vérifier l’existence de la tâche et renvoyer `KANBAN_TASK_NOT_FOUND` comme pour les autres opérations ciblant une tâche.
- **Effort :** S.
- **Risque prod :** faible ; la réponse d’un identifiant invalide passe d’une liste vide à une erreur 404.

### Important — La logique métier n’a pas de tests de service

- **Fichiers :** `node/src/modules/kanban/KanbanValidationSchemas.test.ts`, `node/src/modules/kanban/services/KanbanBoardService.ts`
- **Constat :** les tests du module Kanban couvrent les schémas Zod ; aucun test de `KanbanBoardService` n’a été trouvé. Les transitions d’état, attributions d’XP, droits de suppression, associations et erreurs de ressource ne sont donc pas vérifiées à ce niveau.
- **Correctif proposé :** ajouter des tests de service avec gestionnaire/repositories contrôlés selon les conventions existantes, notamment pour l’idempotence, le propriétaire du commentaire et les colonnes/assignés inexistants.
- **Effort :** M.
- **Risque prod :** moyen en l’absence de tests de régression ; faible pour l’ajout des tests.

### Confort — Le board complet est chargé sans pagination ni archivage

- **Fichiers :** `node/src/modules/kanban/services/KanbanBoardService.ts`, `node/src/modules/kanban/services/KanbanTaskService.ts`
- **Constat :** `getBoardData` charge toutes les colonnes, toutes les tâches avec leurs assignés et tous les utilisateurs. Les tâches terminées restent dans la réponse ; le filtre « masquer les terminées » est côté client. C’est trois chargements parallèles et pas un N+1 manifeste dans le code consulté, mais il n’y a ni limite ni pagination. Un archivage qui ne filtre pas côté serveur amplifierait ce coût.
- **Correctif proposé :** surveiller la volumétrie ; lors de l’ajout d’archives, faire filtrer côté serveur les tâches actives pour le board et prévoir un accès distinct aux archives. N’introduire pagination ou cache qu’en fonction du volume réel.
- **Effort :** M.
- **Risque prod :** faible avec le volume attendu à deux utilisateurs ; croissant si l’historique s’accumule sans archivage/filtrage serveur.

### Vérification des points signalés

- **Ordre des validations de `createTask` :** le code vérifie la colonne d’abord, puis résout les assignés (`KanbanBoardService.ts`, lignes 68–75). Le constat « assignés avant colonne » n’est pas confirmé ; aucun correctif d’ordre n’est indiqué.
- **Contrôle de `doneBy` :** l’identifiant transmis est pris depuis l’utilisateur connecté, et son existence est vérifiée. Le risque confirmé est la répétition de la transition et du crédit XP, pas une usurpation de `doneBy` par le client.
- **Transactions/N+1 :** les opérations métier liées à l’XP ne sont pas atomiques (ci-dessus). Les chargements consultés ne montrent pas de N+1 évident ; les relations d’assignés et d’auteurs sont demandées par relation au niveau du repository.

## 4. Réutilisation pour `/notes`

| Besoin | État constaté | Proposition |
| --- | --- | --- |
| Avatar utilisateur | `react/src/components/atoms/UserAvatar.tsx` existe | Réutiliser directement. Extraire un petit groupe d’avatars uniquement si le rendu commun est nécessaire ailleurs. |
| Sélecteur d’assignés | Logique/rendu répétés dans filtres, formulaire et carte Kanban | Extraire un composant typé si la PR 2 simplifie la carte ; ne pas importer ce contrôle Kanban dans Notes sans besoin fonctionnel. |
| Édition/rendu Markdown | `MarkdownEditor` et `MarkdownRenderer` existent déjà | Les conserver comme composants partagés et fixer le sous-ensemble de Markdown compatible indiqué plus haut. |
| Confirmation destructive | Suppression Kanban déclenchée directement depuis le dialogue | Établir/réutiliser un composant ou service de confirmation PrimeReact avant de l’utiliser pour la suppression de notes ; ne pas créer une abstraction d’archivage Kanban inexistante. |
| Mutation optimiste | Le Kanban recharge le board après succès, sans mutation optimiste générique visible | Pour Notes, fournir un helper/hook réutilisable de mutation avec état précédent, rollback et toast d’erreur ; l’appliquer aux cases et à l’archivage uniquement. |
| Archivage | Absent du module Kanban | Ne pas rétrofiter les tâches dans cette livraison ; concevoir l’archivage Notes comme un flux propre, avec filtre actif/archivé côté serveur. |

## Backlog hors MVP

À laisser hors de cette itération : réouverture Kanban si la règle XP n’est pas arbitrée, déplacement tactile avancé / réordonnancement sur mobile, pagination du board avant besoin mesuré ; pour Notes : rappels, images, couleurs, labels, collaboration temps réel, conversion texte/checklist et import Google Keep. L’XP des notes reste explicitement hors MVP.

## Suivi après PR 2

- **Traité :** cartes allégées, accès direct aux commentaires avec compteur, cible tactile de suppression, filtres regroupés sur mobile, détail plein écran mobile, `PATCH` partiel avec `200`, validation de colonne/titre, complétion idempotente et transactions pour les XP de création/complétion. La publication des événements XP de ces deux flux attend le commit.
- **Tests :** tests de service et intégration controller pg-mem couvrant les droits de suppression, création/XP, mise à jour partielle, colonne inconnue, complétion répétée, compteur de commentaires et 404 pour une tâche absente.
- **Markdown et réutilisation :** les deux composants Markdown existants et `UserAvatar` sont directement réutilisables ; aucun doublon de dépendance n’a été supprimé car chaque bibliothèque sert encore. Pas de composant abstrait de confirmation/mutation optimiste sans usage Kanban correspondant ; ces besoins restent à implémenter côté Notes lorsqu’ils seront nécessaires.
- **Reporté :** réouverture/règle XP associée, pagination/archivage du Kanban avant besoin mesuré, et réordonnancement avancé tactile. La présentation des filtres et le dialogue mobile recommandés ci-dessus ont été simplifiés en PR 2.

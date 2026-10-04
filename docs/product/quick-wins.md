# Quick Wins & Product Opportunities

## Executive Summary

Le dépôt décrit d’abord une application de gestion des comptes d’un foyer, explicitement présentée comme destinée à un couple. Elle couvre aujourd’hui les opérations, les budgets, les dépenses récurrentes, les prévisions de solde et le rapprochement d’un relevé Banque Postale. Des modules de stocks, de notes et de tâches Kanban complètent les parcours. Le dépôt ne permet pas de conclure que ces modules sont utilisés ensemble ni de quantifier les besoins des utilisateurs.

Les leviers les plus prometteurs observés sont déjà disponibles :

- l’accueil calcule les opérations à vérifier **par compte**, mais les présente aussi sous la forme d’un compteur global dont le bouton ouvre un seul compte ;
- le solde prévisionnel additionne les opérations enregistrées et les récurrences actives, alors que l’écran des récurrences expose déjà leurs montants et prochaines dates ;
- les mouvements de stock sont enregistrés avec un instantané du produit, de l’emplacement, de la quantité et du type de mouvement, mais aucun parcours utilisateur ne les consulte.

Les deux meilleurs Quick Wins relient une information déjà calculée à l’action ou à la décision correspondante : ouvrir directement les vérifications du bon compte et expliquer les postes qui composent une prévision de solde. Un historique simple des mouvements de stock est une opportunité plus ambitieuse : sa valeur dépend de l’intérêt réel des utilisateurs pour cette traçabilité et des limites des événements actuellement enregistrés.

Les notifications de stock et l’historique des XP ont déjà été envisagés dans le backlog `/home/runner/work/comptes-chateau/comptes-chateau/TODO.md`. Ils ne sont donc pas présentés comme de nouvelles découvertes. De même, le rapprochement des lignes importées non retrouvées dans le registre avait déjà été évoqué dans la conception de l’import bancaire ; son éventuelle reprise devra tenir compte de ce travail antérieur.

### Échelle de lecture

Les notes sur 5 sont des aides à la décision, pas des mesures utilisateurs. Pour la valeur, la confiance, le levier existant et la synergie, **5 est le score le plus favorable**. Pour l’effort, **1 = XS**, **2 = S**, **3 = M**, **4 = L**, **5 = au-delà de L** : un score faible est préférable. Les catégories d’effort reprennent les ordres de grandeur du cadrage : XS quelques heures à un jour, S 1–3 jours, M 3–10 jours, L 1–2 sprints.

## Product Capability Map

### Parcours et travaux utilisateurs visibles

1. **Suivre un compte** : consulter le tableau des opérations, filtrer ou exporter des lignes, créer ou modifier une opération et gérer les virements entre comptes.
2. **Vérifier les opérations** : sélectionner les lignes non vérifiées, ajuster leur date de valeur, importer un CSV Banque Postale, choisir les correspondances ambiguës et valider en lot.
3. **Planifier et suivre le budget** : gérer des lignes de budget et des récurrences, voir les montants prévus et réalisés par poste, et consulter l’évolution mensuelle.
4. **Suivre le foyer** : l’accueil agrège soldes, prévisions, budgets et actions de plusieurs comptes ; la navigation financière reste ensuite propre à chaque compte.
5. **Gérer des stocks** : organiser des produits et unités par lieu, rechercher un produit, voir les unités et leur expiration, puis prendre une unité du stock.
6. **Organiser le travail et les informations** : gérer des tâches Kanban assignées et commentées, ainsi que des notes textuelles ou listes de contrôle, épinglées ou archivées.

Ce sont les parcours observés dans l’interface, pas une affirmation sur leur fréquence d’utilisation.

### Entités, données et capacités existantes

| Domaine | Données / capacités observées | Surface utilisateur actuelle |
|---|---|---|
| Comptes | Compte, solde de référence et date de référence ; opérations avec débits/crédits, dates, vérification, nature et poste ; paire liée pour les virements | Accueil, dashboard par compte, registre, vérifications |
| Budget | Lignes de budget et dépenses récurrentes actives/inactives, fréquence, montant signé, prochaine occurrence, poste/nature | Vue budget unifiée, progression budget/réalisé, liste des récurrences |
| Banque | Lignes de CSV persistées, métadonnées d’export, identité d’import stable et lien unique possible vers une opération | Import depuis l’écran de vérification, suggestions et sélection des correspondances |
| Stocks | Produits, unités, lieux, quantité, date d’expiration et mouvements `IN`, `OUT` ou `DELETE` avec libellés historiques | Catalogue/produits et liste des unités en stock |
| Kanban | Colonnes, tâches, priorité, tags, assignés, état terminé, commentaires | Tableau filtrable par assigné, tag et état terminé |
| Notes | Notes markdown ou checklists ordonnées, épinglage, archivage, recherche | Liste en colonnes adaptée à la largeur d’écran et dialogue d’édition |
| Utilisateur / automatisations | Comptes utilisateurs, XP cumulés et événements XP ; règles de catégorisation par compte et patterns non mappés | Dojo de catégorisation, classement XP, avatar et accueil |

### Calculs et raccordements

- Le solde courant part du solde de référence et ajoute les opérations vérifiées pertinentes ; les prévisions à fin de mois et à trois mois prennent aussi en compte les opérations non vérifiées et la simulation des récurrences actives.
- Le budget unifié convertit les récurrences hebdomadaires, mensuelles, trimestrielles et annuelles en montants mensuels. Le dashboard compare les dépenses réelles par poste au budget et propose une série mensuelle filtrable par période et poste.
- La catégorisation utilise les opérations historiques et les patterns pour suggérer des règles ; le dojo transforme les patterns non mappés en décisions confirmées par l’utilisateur.
- Le rapprochement bancaire persiste les lignes importées et les propose pour validation. L’import et le registre sont reliés par compte, montant signé et dates ; les choix ambigus sont explicités dans l’interface.
- Les mouvements de stock survivent à la suppression de l’unité et conservent les libellés historiques, ce qui ouvre une possibilité de consultation après évolution du stock courant.
- Les pages sont majoritairement séparées par domaine ; l’accueil financier et les parcours par compte constituent les principaux points de composition transversale.

### Direction produit visible et contraintes de découverte

- `/home/runner/work/comptes-chateau/comptes-chateau/README.md` précise le contexte de gestion des comptes du foyer et l’absence de règles métier formelles spécifiques.
- `/home/runner/work/comptes-chateau/comptes-chateau/TODO.md` cite déjà un moteur de notifications (dont les échéances de stock et les opérations à vérifier), un historique/classement XP, ainsi que des pistes techniques. Les items de refactorisation ou de confort ne sont pas repris comme opportunités produit.
- Les PR récentes confirment des travaux déjà livrés sur l’explication de l’import v2 (#33), l’ajout des récurrences au forecast (#34), la vue budget v2 (#37), les transferts miroir (#29) et la robustesse Kanban (#41). Les idées ci-dessous prolongent ces fonctionnalités au lieu de les proposer à nouveau.
- Aucun issue ouvert n’était listé au moment de cette exploration. L’absence d’issue n’est pas une preuve d’absence de besoin.

## Opportunity Backlog

### Rendre les vérifications de compte directement actionnables depuis l’accueil

- **Type :** Quick Win
- **Priorité :** Très élevée
- **User Value :** 4/5
- **Product Value :** 4/5
- **Effort :** 2/5 — S (1–3 jours)
- **Confidence :** 5/5
- **Existing Capability Leverage :** 5/5
- **Synergy Potential :** 5/5

#### User Opportunity

Quand plusieurs comptes ont des opérations en attente, l’accueil affiche un total global, tandis que l’écran de vérification est limité à un compte. Le parcours peut donc conduire à un compte qui ne contient qu’une partie du total. En outre, le résumé individuel conditionne actuellement son bloc de vérification au nombre d’opérations « dans le compte » ; les opérations « hors compte » ne suffisent pas à faire apparaître ce bloc lorsqu’elles sont les seules en attente.

Le décalage de parcours est directement vérifiable dans le code. Que des utilisateurs s’y heurtent souvent est une hypothèse.

#### Proposed Evolution

Présenter les opérations à vérifier par compte et distinguer, si cela aide à décider, les catégories « dans le compte » et « hors compte ». Chaque ligne ou carte mène aux vérifications du compte concerné. Garder les tâches Kanban comme action globale, puisqu’elles ne sont pas limitées à un compte.

#### Why This Is Valuable

Le compteur devient compréhensible et immédiatement exploitable : le nombre affiché correspond à la file réellement ouverte. L’utilisateur peut choisir le compte à traiter sans chercher son compte actif ni interpréter un total qui ne correspond pas à la page suivante. Cela améliore un parcours central sans introduire de nouvelle règle métier.

#### What the Product Already Has

L’accueil charge les comptes et leur `DashboardOverview`, qui contient les deux décomptes de vérification. Il calcule ensuite le total global. La page `/accountChecks` reçoit un identifiant de compte et liste les opérations non vérifiées de ce compte. Des cartes par compte sont déjà affichées sur l’accueil.

#### The Synergy

La composition des décomptes **par compte** avec la **navigation déjà scoppée par compte** transforme un indicateur transversal en raccourcis fiables. Elle permet aussi de réutiliser les décomptes « dans/hors compte » au lieu de créer une nouvelle notion de notification.

#### Smallest Useful Version

Dans l’action de l’accueil, remplacer le seul compteur et bouton global par une liste compacte des comptes ayant des opérations en attente, avec leur nombre et un lien vers leur écran de vérification. Inclure les opérations hors compte dans l’éligibilité à afficher le raccourci.

#### Effort Rationale

Les données par compte et les routes cibles existent déjà. Le changement est principalement une présentation et un branchement de navigation dans l’accueil ; il ne nécessite ni nouveau stockage, ni nouvel endpoint, ni moteur de notifications.

#### Risks / Unknowns

- Un grand nombre de comptes pourrait rendre la liste de raccourcis encombrante ; l’application expose cependant actuellement une synthèse de tous les comptes sur cet écran.
- Le choix de présenter séparément les opérations « hors compte » doit rester explicite et ne pas laisser penser qu’elles modifient le solde.

#### Evidence

- `/home/runner/work/comptes-chateau/comptes-chateau/react/src/pages/index/Index.tsx:32-53, 92-94, 131-139` — chargement et présentation de la synthèse par compte ; total global des vérifications.
- `/home/runner/work/comptes-chateau/comptes-chateau/react/src/pages/index/components/HomeGlobalActionsCard.tsx:61-74` — le total est lié à un bouton qui ouvre le seul compte actif en stockage local.
- `/home/runner/work/comptes-chateau/comptes-chateau/react/src/pages/index/components/molecules/AccountOverview.tsx:17-21, 55-84` — compteurs distincts ; le bloc individuel dépend du compteur « dans le compte ».
- `/home/runner/work/comptes-chateau/comptes-chateau/node/src/modules/accounts/services/DashboardService.ts:37-50, 58-67` — production des deux décomptes dans l’aperçu du compte.
- `/home/runner/work/comptes-chateau/comptes-chateau/node/src/modules/accounts/services/AccountLineService.ts:537-549` — liste des opérations non vérifiées limitée au compte demandé.
- `/home/runner/work/comptes-chateau/comptes-chateau/react/src/routes/Router.tsx:37-65` — routes du registre et des vérifications sous un compte.

#### Hypotheses

- Les utilisateurs utilisent le total de l’accueil pour décider quelle action effectuer.
- Un total global menant à une seule file par compte crée de la confusion lorsque plusieurs comptes ont des opérations en attente.
- Le traitement par compte est préférable à une file unique inter-comptes pour ce couple de parcours.

### Expliquer les soldes prévisionnels par les récurrences qui les alimentent

- **Type :** Quick Win
- **Priorité :** Élevée
- **User Value :** 4/5
- **Product Value :** 4/5
- **Effort :** 2/5 — S (1–3 jours)
- **Confidence :** 4/5
- **Existing Capability Leverage :** 5/5
- **Synergy Potential :** 5/5

#### User Opportunity

Le produit affiche déjà le solde courant et des soldes prévisionnels à fin de mois et à trois mois. Si un montant change, l’utilisateur ne voit pas immédiatement quelles dépenses récurrentes ou opérations prévues expliquent la différence. Une prévision peut être utile pour décider, mais un montant isolé peut être difficile à vérifier ou à interpréter.

Le besoin d’explication est une hypothèse ; la présence du montant agrégé et des récurrences dans deux parcours séparés est établie.

#### Proposed Evolution

Depuis les cartes de prévision du dashboard d’un compte, rendre consultables les occurrences récurrentes incluses dans l’horizon : libellé, date attendue, montant et poste lorsque renseigné. Montrer les totaux de récurrences par horizon et les distinguer du solde courant et des opérations déjà inscrites au registre. Conserver le calcul existant ; il s’agit d’en rendre une partie intelligible, pas d’ajouter un nouveau modèle prédictif.

#### Why This Is Valuable

L’utilisateur peut expliquer pourquoi un solde prévisionnel baisse ou augmente, repérer une récurrence active inattendue et vérifier la contribution des factures à venir avant de prendre une décision. Cela ajoute de la confiance et de l’utilité aux prévisions déjà affichées, sans prétendre prévoir les dépenses variables.

#### What the Product Already Has

`DashboardService` combine le solde de référence, les opérations du compte jusqu’à l’horizon et le résultat de simulation des récurrences actives. `RecurringExpense` contient montant signé, fréquence, prochaine occurrence, poste/nature et état actif. L’écran des récurrences affiche déjà montant, fréquence et prochaine date.

#### The Synergy

La **projection de solde** et la **liste des récurrences** existent mais ne sont présentées que sous forme de total prévisionnel d’un côté et de liste d’éléments de l’autre. Les relier explique une partie du calcul déjà effectué et peut ramener l’utilisateur directement à l’élément récurrent à corriger.

#### Smallest Useful Version

Ajouter un détail repliable sur le dashboard du compte, limité aux prochaines occurrences récurrentes comprises dans la prévision à fin de mois et à trois mois. Afficher les montants et un sous-total, sans graphique, score de risque ni alerte.

#### Possible Evolution

Si ce détail est utilisé et jugé utile, permettre d’ouvrir la fiche de la récurrence concernée. Une évolution ultérieure pourrait expliquer séparément les opérations déjà enregistrées, sans mélanger celles-ci aux hypothèses récurrentes.

#### Effort Rationale

Les horizons de prévision et la simulation des occurrences sont déjà calculés. La liste des récurrences par compte existe déjà côté service et interface ; l’essentiel de l’effort est de fournir au dashboard les occurrences à afficher et de les contextualiser. La PR #34 a déjà livré l’intégration des récurrences au forecast : cette proposition en est une explication utilisateur, pas une deuxième implémentation du forecast.

#### Risks / Unknowns

- Il faut aligner précisément les dates et fréquences affichées avec les bornes exactes de la simulation, notamment en début de mois et pour les récurrences hebdomadaires.
- La prévision inclut aussi les opérations enregistrées jusqu’à l’horizon ; il faut rendre explicite que le détail proposé n’explique que la contribution des récurrences.
- Les montants récurrents sont signés et peuvent donc représenter des entrées ou sorties ; les libellés de l’interface ne doivent pas les présenter tous comme des dépenses.

#### Evidence

- `/home/runner/work/comptes-chateau/comptes-chateau/node/src/modules/accounts/services/DashboardService.ts:25-67` — calcul et retour des soldes courant, fin de mois et trois mois.
- `/home/runner/work/comptes-chateau/comptes-chateau/node/src/modules/accounts/services/RecurringExpenseService.ts:87-95, 117-157` — récurrences actives du compte et simulation par fréquence.
- `/home/runner/work/comptes-chateau/comptes-chateau/node/src/modules/accounts/entities/RecurringExpense.ts:19-32, 44-56` — montant signé, prochaine occurrence, fréquence et compte.
- `/home/runner/work/comptes-chateau/comptes-chateau/react/src/pages/budget/recurringExpenses/RecurringExpenses.tsx:100-158` — liste visible des montants, fréquences et prochaines dates.
- `/home/runner/work/comptes-chateau/comptes-chateau/react/src/pages/accountDashboard/AccountDashboard.tsx:52-120` — prévisions et détails de budget déjà réunis dans le dashboard de compte.
- `https://github.com/samkeller/comptes-chateau/pull/34` — intégration antérieure des dépenses récurrentes dans les prévisions.

#### Hypotheses

- Les utilisateurs consultent les prévisions pour anticiper la disponibilité de l’argent du foyer.
- Expliquer les récurrences est plus utile à court terme qu’un modèle de prévision plus complexe.
- Un détail compact est préférable à une nouvelle page financière.

### Consulter les derniers mouvements de stock

- **Type :** Medium Opportunity
- **Priorité :** Moyenne
- **User Value :** 3/5
- **Product Value :** 3/5
- **Effort :** 3/5 — M (3–10 jours)
- **Confidence :** 4/5
- **Existing Capability Leverage :** 4/5
- **Synergy Potential :** 4/5

#### User Opportunity

La vue courante indique ce qui reste en stock et permet de prendre une unité. Elle ne donne pas de vue utilisateur des dernières entrées, prises ou suppressions. Pour un foyer qui tient son stock à plusieurs, une petite chronologie pourrait répondre à « qu’est-ce qui a changé récemment ? » et limiter les vérifications manuelles.

Le besoin de coordination ou d’audit est plausible, mais le dépôt n’apporte pas de retour utilisateur qui le confirme.

#### Proposed Evolution

Proposer, depuis la gestion des stocks, une consultation récente des mouvements par produit ou emplacement : date, type (`IN`, `OUT`, `DELETE`), quantité et libellés historiques. Présenter cela comme un historique opérationnel limité, pas comme un journal d’audit exhaustif ni comme une mesure de consommation.

#### Why This Is Valuable

Les utilisateurs pourraient comprendre pourquoi le stock courant a changé et retrouver les mouvements associés à une unité qui n’existe plus. Cela complète le parcours « voir le stock / prendre une unité » en rendant visibles les événements que le produit enregistre déjà.

#### What the Product Already Has

Le service de stock crée un mouvement lors de l’ajout d’une unité, de sa prise et de sa suppression. Le mouvement conserve un instantané du nom de produit, du lieu, de l’unité, de la quantité et du type. Les identifiants historiques ne sont pas des clés étrangères vers les unités supprimées.

#### The Synergy

L’**inventaire courant par lieu et produit** devient plus explicable lorsqu’il est mis en regard des **événements de stock persistés**, y compris pour des unités retirées. Une interface de lecture ferait ainsi usage d’une donnée aujourd’hui écrite par les parcours existants mais sans présentation repérée dans le frontend.

#### Smallest Useful Version

Afficher un panneau « Mouvements récents » dans la gestion du stock, filtrable par produit ou lieu et limité aux mouvements enregistrés. Utiliser un vocabulaire distinct pour une prise (`OUT`) et une suppression (`DELETE`) ; ne pas agréger les quantités entre produits ou unités différentes.

#### Effort Rationale

Le stockage et l’écriture des mouvements sont en place, mais le service consulté ne propose que la création et la mise à jour d’un mouvement. Il faudrait ajouter une lecture et la rendre accessible à l’interface, puis créer le panneau. Ce n’est donc pas une simple colonne ou un filtre ; une nouvelle route de lecture et un écran fonctionnel le placent en M.

#### Risks / Unknowns

- Le mouvement `IN` existant est modifié lors de l’édition d’une unité, au lieu de créer un événement de correction immuable.
- Les mouvements ne contiennent pas l’auteur ni un motif de suppression. Ils ne suffisent pas à un audit opposable ou à attribuer les actions.
- `DELETE` signifie suppression d’une unité du registre, pas nécessairement consommation ou perte ; un affichage ou une agrégation qui confond ces cas serait trompeur.
- Il faut confirmer que consulter ces événements est plus utile que les seules échéances d’expiration déjà visibles et triables.

#### Evidence

- `/home/runner/work/comptes-chateau/comptes-chateau/node/src/modules/stocks/entities/StockMovement.ts:17-70` — instantanés et types de mouvement conservés.
- `/home/runner/work/comptes-chateau/comptes-chateau/node/src/modules/stocks/services/StockMovementService.ts:24-39, 47-74` — écriture et mise à jour des mouvements ; aucune méthode de lecture dans ce service.
- `/home/runner/work/comptes-chateau/comptes-chateau/node/src/modules/stocks/services/StockUnitService.ts:47-80, 132-180` — événements créés lors de la création, prise et suppression d’une unité.
- `/home/runner/work/comptes-chateau/comptes-chateau/react/src/pages/stocks/stocksManagement/organisms/StockItemsList.tsx:81-149` — liste utilisateur actuelle, expiration la plus proche et expansion des unités.
- `/home/runner/work/comptes-chateau/comptes-chateau/react/src/pages/stocks/stocksManagement/organisms/StockItemUnitsView.tsx:52-87` — unités visibles par date d’expiration et action de prise.

#### Hypotheses

- Les utilisateurs ont parfois besoin de comprendre les écarts entre une quantité attendue et le stock courant.
- Une chronologie sommaire aiderait la coordination des personnes qui gèrent le stock.
- Les événements conservés sont assez nombreux et suffisamment fiables pour justifier leur exposition, malgré l’absence d’auteur et le traitement des modifications.

## Top Quick Wins

### 1. Raccourcis de vérification par compte

- **Valeur utilisateur attendue :** retrouver la file réellement à traiter sans perdre le contexte du compte.
- **Valeur produit attendue :** rendre l’accueil financier plus fiable et ses données plus actionnables.
- **Effort attendu :** S, 1–3 jours.
- **Pourquoi Quick Win :** le décompte par compte et les routes de vérification existent ; l’écart vient de la présentation globale et du compte actif du lien.
- **Capacités réutilisées :** `DashboardOverview` par compte, décomptes « dans/hors compte », cards par compte et routes account-scoped.

### 2. Explication des prévisions par récurrence

- **Valeur utilisateur attendue :** comprendre les montants qui influencent le solde prévisionnel et corriger une récurrence inattendue.
- **Valeur produit attendue :** accroître la confiance et l’utilité d’une prévision déjà intégrée au dashboard.
- **Effort attendu :** S, 1–3 jours.
- **Pourquoi Quick Win :** le calcul du forecast et les données des récurrences actives existent déjà ; l’évolution révèle la contribution des récurrences sans introduire un nouveau moteur de prévision.
- **Capacités réutilisées :** simulation par fréquence, champs de prochaine occurrence/montant/poste, liste des récurrences et cartes de solde existantes.

## High-Value but Larger Opportunities

- **Historique opérationnel des stocks — M.** La donnée d’événement et les libellés historiques sont déjà stockés, mais pas exposés en lecture. La valeur est plausible pour comprendre l’évolution d’un stock ; elle reste à confirmer, et les événements actuels ne forment pas un audit immuable.
- **Lignes de relevé sans opération comptable — potentiel important, mais à reprendre avec le contexte antérieur.** Les importations sont persistées, tandis que le résultat visible se concentre sur les opérations de compte qui ont des candidats. Le PR #33 évoquait explicitement le cas des données CSV absentes des opérations, les classifications de rapprochement et le rôle du relevé comme source de vérité. Avant de rouvrir ce sujet, vérifier les décisions prises lors de cette livraison et isoler une évolution plus petite (par exemple rendre visibles les lignes importées sans correspondance) au lieu de refaire la conception de l’import.

## Interesting Discoveries Not Recommended

- **Centre de notifications générique :** le backlog `/home/runner/work/comptes-chateau/comptes-chateau/TODO.md` demande déjà un moteur de notifications et cite les stocks, comptes et opérations à vérifier. Ne pas proposer une seconde initiative générique ; traiter d’abord le raccourci par compte ci-dessus, qui résout un défaut de parcours plus circonscrit.
- **Alerte d’échéance de stock :** également déjà citée dans `/home/runner/work/comptes-chateau/comptes-chateau/TODO.md`. En outre, la liste desktop expose la prochaine expiration triable par produit et les unités sont groupées par date. Une future alerte peut compléter cette fonctionnalité, mais ce n’est pas une découverte nouvelle.
- **Rapprochement bancaire complet avec création automatique des opérations manquantes :** les lignes de relevé et leurs métadonnées sont persistées et le PR #33 avait déjà exploré l’absence d’opération correspondante. La valeur potentielle est crédible, mais il faut vérifier la portée de cette décision historique et éviter de dupliquer un comportement explicitement envisagé. L’import actuel ne rend pas visibles les lignes CSV sans candidat ; cette observation seule ne suffit pas à justifier de reprendre une conception déjà abordée.
- **Détection automatique d’anomalies ou de dépassements prédits :** budget mensuel, réalisé et historique existent, mais un rythme de dépense extrapolé linéairement peut être trompeur et aucun besoin de notification financière n’est établi. Tester d’abord une explication descriptive de l’écart budget/réalisé, sans alerte prédictive.
- **Filtre de priorité Kanban :** les priorités sont déjà visibles sur les cartes et modifiables dans la tâche ; un filtre n’ajouterait qu’un critère de navigation. Sans preuve d’un grand volume de tâches ou d’une difficulté de tri, son bénéfice est moins fort que les parcours de compte et de prévision.
- **Budget consolidé par poste pour tous les comptes :** l’accueil agrège déjà les soldes, et les statistiques mensuelles sont par compte. Les postes sont configurés à l’échelle du compte ; les additionner entre comptes sans correspondance métier explicite pourrait produire des comparaisons artificielles. Le besoin de cette vue globale est une hypothèse, et son périmètre dépasserait les Quick Wins retenus.
- **Historique d’XP et nouveau classement :** `/home/runner/work/comptes-chateau/comptes-chateau/TODO.md` mentionne déjà un écran leaderboard et le log des gains d’XP. Ce sujet est donc à traiter comme élément du backlog existant, pas comme opportunité nouvellement découverte.

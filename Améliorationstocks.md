# Amélioration des stocks

Points marquants :
- Le module stock est un module développé en plusieurs phases.

Sont but est de permettre à des utilisateurs de suivre le stockage, la péremption et d'organiser des données perissables :
- L'utilisateur peut ajouter au stock un ou plusieurs article, avec ou sans péremption et préciser le lieu exact du stockage.
- L'utilisateur peut consulter l'état actuel du stock, y compris les articles périmés ou proches de la péremption.
- L'utilisateur peut effectuer des recherches et des filtrages sur les articles en stock selon différents critères (nom, date de péremption, lieu de stockage, etc.).
- L'utilisateur, quand il prend un article du stock peut le "cocher" cad l'enlever du stock avec un bouton simple.


Etat d'esprit du dev :
- Le but de l'écran /stock est d'être le + simple possible, que cela soit pour voir, ajouter, modifier, supprimer ou cocher un article.
- La séparation stockItem / stockUnit est invisible aux yeux de l'utilisateur
- Sur mobile, l'expérience doit rester fluide et intuitive, sans complexité inutile.
- On évite la rigidité. Quand on ajoute un item au stock, il faut que le formulaire puisse être remplissable simplement pour lui permettre d'ajouter des items rapidements

## Bugs connus

- Bug 1 : Impossible d'utiliser le scan d'un code-barre en dev (pas de https) -> Le développeur devrait être capable de tester son dev sans passer par un port microsoft
- Bug 2 : La "prise de photo" pour une date plante la page. Globalement, on aimerait mieux intégrer cela à la page comme on le fait pour le code barre si possible.
- Bug 3 : les indicateurs "stocks" === 0 apparaissent en severité warn, c'est une erreur ils ne devraient pas avoir de couleur spécifique du tout.
- Bug 4 : Trop de messages d'erreurs arrivent dans des "Messages" primereact ou bien dans des toasts spécfiques. Les erreurs backs devraient être envoyés depuis le note et récupérés dans interceptors.ts. Normalement pas besoin de state d'erreurs/loadings dans l'app.

## Evolutions

- Aucune réflexion n'a été faite sur l'intégration openfoodfacts :
    1. Que disent les CGU d'openfoodfacts ? Est-ce que l'outil de requetage actuelle est un risque ? Comment s'assurer d'une implémentation perenne ? Il faudrait par exemple récupérer une fois les données ou enregistrer le nombre d'appels pour suivre la consommation de l'API et potentiellement faire un don à l'organisation en fonction de l'usage.
    Il est également visible sur la doc que "envoi d'un en-tête HTTP avec votre appel d'API est un moyen efficace pour que l'on puisse vous contacter en cas de problème."
    2. Actuellement, on stocke peut les données openFoodFacts, ne permettant pas dans le futur de faire évoluer la manière dont on affiche les produits dans l'application. 
    3. Utilisons-nous bien le SDK officiel https://github.com/openfoodfacts/openfoodfacts-js ? / npm install @openfoodfacts/openfoodfacts-nodejs
    4. Etude de l'api openfoodfacts pour déjà enregistrer des données localement qui "peuvent servir plus tard".
    5. Attention à bien prendre en compte cette synchronisation pour les produits qu'on créé mais également des produits déjà existants ! Cela doit être backward comptatible pour enrichir des produits déjà existants dans notre application.

- La construction globale de la page /stocks est peu lisible
    1. La séparation en onglets "gestion des stocks", "gestion des produits" etc semble être une erreur
    2. On peut tout à fait imaginer que le formulaire de création modification d'un produit soit dans un dialog comme c'est déjà le cas dans d'autres endroits de l'application ("Ajouter une dépense"," nouvelle note", "nouvelle tâche kanban")
        - Ce dialog pourrait donc être utilisé rapidement sur un produit du tableau des produits disponibles pour le modifier, ajouter ou supprimer des lignes, etc etc.
        - Attention: On aimerait en profiter pour repenser ces formulaires de création/modification en entier clarifier la construction et son utilisation. Il faut faire preuve d'esprit critique
    3. Le fait que le formulaire de création/modification ait été dupliqué pour la partie mobile (scan) et la partie desktop ("gestion des produits") semble être une erreur et peut être rationnalisé.

- Le système de scan des dates de péremptions est KO
    1. Que ce soit sur la partie fonctionnellle (oblige à prendre une photo, différent du scan du code barre...)
    2. Que ce soit sur la partie technique (plante, ne retrouve jamais la date de la photo, etc)

- Les "métriques" / le "dashboard" /stocks s'intègre très mal à l'écran. Que ce soit sur mobile ou desktop, les données affichées sont nécessaires et peuvent être utiles pour l'utilisateur mais en l'état, soit ajoutent de la friction dans le fait d'ajouter ou cocher des stocks soit sont peu lisibles actuellement.

## Evolutions futures

### Ré-utilisation du "scan de texte" pour préremplir des champs de formulaires ou des formulaires entiers
- Dans la roadmap est prévue la ré-utilisation du "scan de texte" pour des opérations nombreuses et diverses. (scan de tickets de caisses, de devis, de reçus de carte bleue, etc). Il faut donc prendre bien soin à préparer cette phase la en fournissant un code lisible, solide, utilisable et de qualité.
Vu le peu de qualité et de capacité d'utilisation du module maintenant, on peut tout à faire imaginer prendre ce sujet la en-dernier: faire un rollback dessus en attendant que le reste soit stabilisé (code considéré comme mort)

### Utilisation des métriques de stocks dans le futur
- Utilisations des métriques de stocks pour le futur. On sait déjà que les logs d'entrées et sorties du stock doivent être bien tracées afin d'assez vite pouvoir utiliser ces données (graphiques, statistiques de consommations pour tel article, guides d'achats de "ce qui risque de manque bientôt", etc)
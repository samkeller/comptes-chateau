<!--
    Ceci est un fichier changelog à mettre à jour à chaque livraison.
    Standard: [keepachangelog.com](https://keepachangelog.com/en/1.1.0/)

-->

## [1.0.0 - 02/08/2026]

### Added
- Dashboard compte - Sélecteur custom pour les temporalités de balance 
- Changelog dynamique dans la page d'accueil

### Fixes
- Custom markdown renderer (wrapper) pour que ce soit plus zoli & adapté à lara-dark-teal


## [1.0.1 - 03/08/2026]

### Added
- Ajout des fréquences hebdomadaires, annuelles & trimestrielles pour les dépenses récurrentes
- Affichage de la fréquence dans le tableau /budget

### Fixes
- Correction de la distance de date de la prochaine activation dans /budget


## [1.1.1 - 03/08/2026]

### Added
- Système d'xp quand on fait des actions de création.
- Page "Automatisations" posant les premières briques de pattern matching dans l'application
- Ajout d'un dojo & de petites images rigolotes (j'adore l'humour)

## [1.1.2 - 11/08/2026]
### Added
- Sprites nécessaires

### Fixes
- Affichages mobiles (dialogues, titres, etc)

## [1.1.3 - 11/08/2026]
### Added
- Système XP backend pour les opérations validées, les créations d'opérations, les règles de catégorisation et les dépenses récurrentes

## [1.1.4 - 12/08/2026]
### Added
- Autocompletion/auto-remplissage à la création d'une opération

## [1.1.5 - 14/08/2026]
### Added
- Ajout auto-backup quotidien google drive.

## [1.1.5b - 15/08/2026]
### Added
- Add docker build pour pg_dump

## [1.1.6 - 15/08/2026]
### Fixes
- Correction de la méthode de normalisation des libellés pour les règles de catégorisation (accentuation, ponctuation, espaces multiples, etc). Ce changement a obligé de redémarrer la table de 0 (heureusement, l'xp gagnée reste gagnée).
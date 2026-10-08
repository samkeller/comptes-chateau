# Project

Project Description

<em>[TODO.md spec & Kanban Board](https://bit.ly/3fCwKfM)</em>

### Todo

- [ ] [MEDIUM] Ecran leaderboard - Déplacer les classements XP, afficher les barèmes de ce qui rapporte de l'xp, ajouter un "log" des dernier gains d'xp (new table db ?)  
- [ ] [HIGH] Moteur de notifications. Remplacer les indicateurs chiffrés de la page d'accueil par une vraie gestion des notifications. Notifications probables: Une tâche vous a été assignée, info | Un produit du stock périme bientôt (30j), medium severity | Un produit du stock est périmé, hight severity | Un compte va passer dans le rouge, medium severity |  Un compte est en rouge, high severity | Une nouvelle dépense récurrente a été traitée cette nuit, info | le backup quotidien c'est bien passé, info | Il y a N opérations à valider sur le compte X (ne s'affiche que quand il y a plus que n), medium severity.  
- [ ] Les boutons "Supprimer" "Renommer" etc devraient être factorisés dans composants/atoms pour permettre l'homogénéité graphique dans toute l'appli. Globalement dans 90% des cas on utilise qu'une icone + tooltip en fonction de ou on est dans la page mais parfois il y a le label. On peut faire des atoms "DeleteButton", "EditButton" etc (tout ce qui apparait + de trois fois dans l'application) & permettre de passer des ButtonProps au composants si besoin d'overrides (normalement cela devrait être minimal).  
- [ ] De plus, on pourrait de cette manière ajouter les actions clavier (touche entrée pour valider, echap pour annuler) de manière uniforme dans toute l'application.  
- [ ] Ajouter cache frontend (kanban, stocks, accountLines) - données qui changent peu ou batch quotidien. (node-cache obsolète ???)  
- [ ] [LOW] - Corriger BudgetItemTable.tsx pour qu'elle respecte les normes de l'application  
- [ ] [LOW] Fixtures back (https://github.com/RobinCK/typeorm-fixtures)  
- [ ] [LOW] Ajout Ctrl+Click sur liens pour qu'ils s'ouvrent dans un nouvel onglet (recherche react router)
- [ ] [MEDIUM] Fixer une fois dans toute l'application la taille des dialogues en fonction de la taille de l'écran.
- [ ] [LOW] Repasser les icones liées à un input (utiliser primereact Iconfield>InputIcon en parallèle de l'Input)
 
### In Progress

- [ ] Gestion d'erreurs centralisés (AppError back -> catchés par Interceptors.ts -> Supprimer tous les catchs() front inutiles - le back envoie les messages d'erreurs)  
- [ ] Mettre à plat la création d'opérations / accountLines (back) & assurer que la modification unitaire avec isChecked & dateValeur ajoute bien de l'xp.  
- [ ] Ajouter dans les formulaires des indications claires sur les données étant obligatoires/facultatives (mettre en valeur les lignes obligatoires). Cf FloatLabel. Harmonisation partout  

### Done ✓

- [x] Factoriser accountLineNatureDropdown & accountLinePosteDropdown -> Régler les contrats API id vs objet complet -> Repasser tous les dropdowns "nature" (DropdownProps) & "postes" (DropdownProps & accountId)  
- [x] Auto-backup  
- [x] Sécuriser ++++ les opérations "miroirs" entre plusieurs comptes. (test unitaires CRUD, impacts modifications, suppression, etc, Ajouter confirm spécifique quand impacts cascade)  
- [x] Refaire écran :accountId/budget/overview en clarifiant les recettes et les dépenses et avec un graphique plus clair que ce long tableau ()  
- [x] [Mobile] - Le formulaire de création/modification d'une opération ne permet pas les valeurs négatives (android)  
- [x] Ajouter "se rappeler du device" pour n'avoir à se logger que tous les 60 jours  


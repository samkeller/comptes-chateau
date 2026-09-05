# Project

Project Description

<em>[TODO.md spec & Kanban Board](https://bit.ly/3fCwKfM)</em>

### Todo


- [ ] Mettre à plat la création d'opérations / accountLines (back) & assurer que la modification unitaire avec isChecked & dateValeur ajoute bien de l'xp.  
- [ ] Les boutons "Supprimer" "Renommer" etc devraient être factorisés dans composants/atoms pour permettre l'homogénéité graphique dans toute l'appli. Globalement dans 90% des cas on utilise qu'une icone + tooltip en fonction de ou on est dans la page mais parfois il y a le label. On peut faire des atoms "DeleteButton", "EditButton" etc (tout ce qui apparait + de trois fois dans l'application) & permettre de passer des ButtonProps au composants si besoin d'overrides (normalement cela devrait être minimal)
- [ ] Ajouter dans les formulaires des indications claires sur les données étant obligatoires/facultatives (mettre en valeur les lignes obligatoires). Cf FloatLabel. Harmonisation partout
- [ ] Ajouter cache frontend (kanban, stocks, accountLines)
- [ ] Fixtures back (https://github.com/RobinCK/typeorm-fixtures) - Peu urgent
- [ ] Sécuriser ++++ les opérations "miroirs" entre plusieurs comptes. (test unitaires CRUD, impacts modifications, suppression, etc, Ajouter confirm spécifique quand impacts cascade)

### In Progress
### Done ✓
- [x] Factoriser accountLineNatureDropdown & accountLinePosteDropdown -> Régler les contrats API id vs objet complet -> Repasser tous les dropdowns "nature" (DropdownProps) & "postes" (DropdownProps & accountId)
- [x] Auto-backup

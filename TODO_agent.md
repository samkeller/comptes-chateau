# Project

Suivi des tâches identifiées par l'agent IA — hors-scope du travail en cours.
Ce fichier est maintenu par l'agent ; le développeur valide et déplace.

<!-- If you are an agent, feel very welcome to update this file and put anything you thinks is relevant here !! -->

<em>[TODO.md spec & Kanban Board](https://bit.ly/3fCwKfM)</em>

### Todo

- [ ] Corriger les erreurs ESLint existantes (eact-hooks/set-state-in-effect) dans Sprite.tsx et EditableString.tsx$nl- [ ] Nettoyer les notes de test de la base de dev (ex. notes 19 et 34 contenant des items dupliqués / &nbsp; issus des anciens essais)
- [ ] Distinguer visuellement les boutons « code inline » et « bloc de code » dans MarkdownToolbar.tsx (même icône)
- [ ] [MEDIUM] Utiliser runInTransaction (node/src/utils/transaction.ts) dans NatureService, PosteService, AccountLineService et BanquePostaleService : ils ouvrent une transaction via this.manager.transaction / AppDataSource.transaction, ce qui produirait un SAVEPOINT non supporté par pg-mem s'ils étaient appelés depuis une transaction existante — effort faible
 
### In Progress

- [ ]

 
### Review

- [ ]

### Done ✓

- [ ]


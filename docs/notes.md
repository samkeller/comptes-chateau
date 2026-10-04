# Notes

## Fonctionnement du MVP

- Les notes sont partagées entre les utilisateurs connectés ; toute personne connectée peut les lire, modifier et archiver. Seul l'auteur peut supprimer définitivement une note.
- Une note est soit textuelle (Markdown), soit une checklist d'items structurés. Le sélecteur permet de convertir une représentation en l'autre ; les lignes et items sont aplatis et les titres Markdown perdent leur mise en forme lors de la conversion.
- Les items de checklist sont stockés séparément afin de permettre leur mise à jour indépendante. Leurs modifications actualisent la date de la note.
- Les notes actives sont triées par épinglage puis date de modification. Les archives sont chargées séparément et ne sont pas affichées dans la vue active.
- Le MVP ne distribue pas d'XP pour la création ou la modification de notes.

## Backlog hors MVP

- Rappels et notifications.
- Images, couleurs et labels.
- Collaboration en temps réel.
- Import depuis Google Keep.
- XP ou autre récompense liée aux notes.

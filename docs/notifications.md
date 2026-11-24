# Moteur de notifications

Back : `node/src/modules/notifications/`. Contrat : `NotificationDto` dans `@chocosous/shared`.

## Deux familles

| Famille | Exemple | Stockage | Disparaît quand… |
|---|---|---|---|
| **Événement** | « Une tâche vous a été assignée » | table `notification` (contenu figé) | l'utilisateur l'ignore, ou après 30 jours |
| **État** | « Le compte X est dans le rouge » | rien : calculée à chaque lecture par un *provider* | la situation est résolue, ou l'utilisateur l'ignore (jusqu'au lendemain) |

Destinataires : pas de gestion fine pour l'instant, tout le monde voit tout, sauf les notifications explicitement ciblées (`recipientUserIds`) ; l'auteur d'une action (`actorUserId`) n'en est jamais notifié.

## Ajouter une notification

**Événement** : un seul appel, depuis le service métier (idéalement dans la transaction de l'action) :

```ts
await new NotificationService(manager).publish({
    type: "MON_EVENEMENT",            // libre, aucune déclaration ailleurs
    severity: "info",                 // info | medium | high
    title: "…",
    message: "…",
    target: { kind: "kanban", taskId },  // ou null
    recipientUserIds: [userId],       // omis = tous les utilisateurs
    actorUserId: connectedUserId,     // jamais notifié de sa propre action
});
```

**État** : créer `providers/xxxNotifications.ts` puis l'ajouter au registre `providers/index.ts`.
Séparer une règle pure (testable sans base) de la lecture des données :

```ts
export function xxxNotifications(data: XxxSituation, now: Date): NotificationDto[] {
    return data.items.map((item) => dailyNotification(now, { type: "XXX", severity: "medium", title, message, target }, item.id));
}

export const xxxNotificationProvider: NotificationProvider = {
    name: "xxx",
    async collect({ manager, now }) {
        return xxxNotifications(await new XxxService(manager).getSituation(), now);
    },
};
```

Un provider qui échoue est journalisé et ignoré : il ne masque pas les autres notifications.

Nouvel écran cible : ajouter un `kind` à `NotificationTarget` (shared) et sa route dans `notificationTargetPath.ts` (`components/layout/notifications/`).

## Notifications existantes

| Type | Sévérité | Source |
|---|---|---|
| `KANBAN_TASK_ASSIGNED` | info | événement : création/modification de tâche (nouveaux assignés) |
| `KANBAN_TASK_COMMENTED` | info | événement : commentaire (tous sauf l'auteur) |
| `STOCK_EXPIRED` / `STOCK_EXPIRING_SOON` | high / medium | provider `stocks` (horizon 30 j) |
| `ACCOUNT_NEGATIVE` / `ACCOUNT_GOING_NEGATIVE` | high / medium | provider `accounts` (solde pointé < 0 / prévisionnel fin de mois < 0) |
| `ACCOUNT_BUDGET_EXCEEDED` | medium | provider `accounts` |
| `OPERATIONS_TO_CHECK` | medium | provider `accounts` (strictement plus de 5 opérations non pointées) |
| `BACKUP_SUCCEEDED` | info | provider `jobs` (dernier résultat de chaque job sur 24 h) |
| `JOB_FAILED` | high | provider `jobs` ; le cron nocturne journalise aussi son propre échec (`nightly-cron`) |

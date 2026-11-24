import { subHours } from "date-fns";
import { BACKUP_DB_JOB_NAME } from "../../../jobs/backupDb";
import JobExecutionLogService, { type JobOutcome } from "../../core/services/JobExecutionLogService";
import type { NotificationContent, NotificationDraft, NotificationProvider } from "../NotificationProvider";

export type { JobOutcome };

/** Fenêtre d'observation : les jobs tournent chaque nuit. */
const LOOKBACK_HOURS = 24;

/** Succès notable d'un job (les échecs sont regroupés par `failureNotification`). */
function describeSuccess(outcome: JobOutcome): NotificationContent | null {
    if (outcome.jobName === BACKUP_DB_JOB_NAME) {
        return {
            type: "BACKUP_SUCCEEDED",
            severity: "info",
            title: "Sauvegarde effectuée",
            message: "La sauvegarde quotidienne de la base s'est bien passée.",
            target: null,
        };
    }

    return null;
}

/**
 * Une seule notification pour tous les échecs (un échec du backup est aussi un échec du cron nocturne).
 * La clé porte les ids des logs : un nouvel échec la fait réapparaître.
 */
function failureNotification(failures: JobOutcome[]): NotificationDraft | null {
    if (failures.length === 0) return null;
    const sorted = [...failures].sort((a, b) => a.id - b.id);
    const jobNames = sorted.map((failure) => `« ${failure.jobName} »`).join(", ");
    const latest = sorted.reduce((a, b) => (a.createdAt >= b.createdAt ? a : b));

    return {
        key: `JOB_FAILED:${sorted.map((failure) => failure.id).join("-")}`,
        type: "JOB_FAILED",
        severity: "high",
        title: sorted.length > 1 ? `Échec de ${sorted.length} tâches automatiques` : "Échec d'une tâche automatique",
        message: `Échec de ${jobNames}. Consultez les logs du serveur.`,
        occurredAt: latest.createdAt.toISOString(),
        target: null,
    };
}

/**
 * Règle pure : une notification par succès notable, plus une pour l'ensemble des échecs.
 * La clé porte l'id du log : ignorer une notification ne masque que cette exécution.
 */
export function jobNotifications(outcomes: JobOutcome[]): NotificationDraft[] {
    const successes = outcomes.flatMap((outcome) => {
        const content = outcome.status === "success" ? describeSuccess(outcome) : null;
        if (!content) return [];
        return [{
            ...content,
            key: `${content.type}:${outcome.id}`,
            occurredAt: outcome.createdAt.toISOString(),
        }];
    });
    const failure = failureNotification(outcomes.filter((outcome) => outcome.status === "error"));

    return failure ? [failure, ...successes] : successes;
}

export const jobNotificationProvider: NotificationProvider = {
    name: "jobs",
    async collect({ manager, now }) {
        const outcomes = await new JobExecutionLogService(manager).getLatestOutcomes(subHours(now, LOOKBACK_HOURS));
        return jobNotifications(outcomes);
    },
};

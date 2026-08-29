/** Réponse du déclenchement manuel du job de traitement des dépenses récurrentes. */
export interface RunRecurringExpensesJobResponse {
    triggeredAt: string;
    processedCount: number;
}

/** Réponse du déclenchement manuel du job de sauvegarde de la base de données. */
export interface BackupDatabaseJobResponse {
    triggeredAt: string;
    message: string;
}

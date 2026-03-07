import { AppDataSource } from '../db/dataSource';
import jobLog from './jobLog';
import { processRecurringExpenses } from './processRecurringExpenses';
import cron from "node-cron";

// Crons - Exécute tous les jours à minuit
// 0 0 0 * * * -> At 00:00 (midnight) every day
cron.schedule("0 0 * * *", async () => {
    await runJob();
});

async function ensureDataSource() {
    if (!AppDataSource.isInitialized) {
        await AppDataSource.initialize();
    }
}

async function runJob() {
    const currentDate = new Date();

    try {
        jobLog("INFO", "Starting cron job");
        await ensureDataSource();

        await AppDataSource.transaction(async (manager) => {
            await processRecurringExpenses(manager, currentDate);
        });

        jobLog("INFO", "Finished cron job");
    } catch (error) {
        jobLog("ERROR", `Error executing cron job: ${error}`);
    }
}
import { AppDataSource } from '../db/dataSource';
import { backupDb } from './backupDb';
import customLog from './customLog';
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
        customLog("INFO", "Starting cron job");
        await ensureDataSource();

        await AppDataSource.transaction(async (manager) => {
            await processRecurringExpenses(manager, currentDate);
        });
        
        await backupDb(currentDate);

        customLog("INFO", "Finished cron job");
    } catch (error) {
        customLog("ERROR", `Error executing cron job: ${error}`);
    }
}
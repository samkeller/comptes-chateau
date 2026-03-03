import { AppDataSource } from '../db/dataSource';
import jobLog from './jobLog';
import { processRecurringExpenses } from './processRecurringExpenses';
import cron from "node-cron";

cron.schedule("37 * * * *", async () => {
    await runJob();
});

async function ensureDataSource() {
    if (!AppDataSource.isInitialized) {
        await AppDataSource.initialize();
    }
}

async function cleanup() {
    await AppDataSource.destroy();
}

async function runJob() {
    const currentDate = new Date();

    try {
        jobLog("INFO", "Starting cron job");
        await ensureDataSource();

        await AppDataSource.transaction(async (manager) => {
            await processRecurringExpenses(manager, currentDate);
        });

        await cleanup();
        jobLog("INFO", "Finished cron job");
    } catch (error) {
        jobLog("ERROR", `Error executing cron job: ${error}`);
        await cleanup();
    }
}
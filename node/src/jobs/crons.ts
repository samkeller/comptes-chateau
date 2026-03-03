import { AppDataSource } from '../db/dataSource';
import jobLog from './jobLog';
import { processRecurringExpenses } from './processRecurringExpenses';
import cron from "node-cron";

cron.schedule("25 * * * *", async () => {
    await runJob();
});

async function setup() {
    jobLog("INFO", "Starting cron job");
    return await AppDataSource.initialize();
}

async function cleanup() {
    jobLog("INFO", "Finished cron job");
    await AppDataSource.destroy();
}

async function runJob() {
    const currentDate = new Date();

    try {
        await setup();

        await AppDataSource.transaction(async (manager) => {
            await processRecurringExpenses(manager, currentDate);
        });

        await cleanup();
    } catch (error) {
        jobLog("ERROR", `Error executing cron job: ${error}`);
        await cleanup();
    }
}
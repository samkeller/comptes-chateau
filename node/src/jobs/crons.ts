import { AppDataSource } from '../db/dataSource';
import { backupDb } from './backupDb';
import customLog from './customLog';
import { processRecurringExpenses } from './processRecurringExpenses';
import { syncOpenFoodFacts } from './syncOpenFoodFacts';
import cron from "node-cron";

// Évite de lancer plusieurs exécutions simultanément
let isRunning = false;

// Tous les jours à minuit (heure de Paris)
cron.schedule("0 0 * * *", async () => {
    await runJob();
}, {
    timezone: "Europe/Paris"
});

async function ensureDataSource() {
    if (!AppDataSource.isInitialized) {
        await AppDataSource.initialize();
    }
}

async function runJob() {
    if (isRunning) {
        customLog("WARN", "Cron job already running, skipping execution");
        return;
    }

    isRunning = true;
    const currentDate = new Date();

    try {
        customLog("INFO", "Starting cron job");
        await ensureDataSource();

        // Process recurring expenses within a transaction
        await AppDataSource.transaction(async (manager) => {
            await processRecurringExpenses(manager, currentDate);
        });

        // Synchronisation OpenFoodFacts des produits existants
        await syncOpenFoodFacts(AppDataSource.manager);

        // Backup the database
        await backupDb(currentDate);

        customLog("INFO", "Finished cron job");
    } catch (error) {
        customLog("ERROR", `Error executing cron job: ${error}`);
    } finally {
        isRunning = false;
    }
}
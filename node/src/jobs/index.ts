import { AppDataSource } from '../db/dataSource';
import { processRecurringExpenses } from './processRecurringExpenses';

async function setup() {
    return await AppDataSource.initialize();
}

async function cleanup() {
    await AppDataSource.destroy();
}

async function executeCronJob() {
    const currentDate = new Date();

    try {
        await setup();

        await AppDataSource.transaction(async (manager) => {
            await processRecurringExpenses(manager, currentDate);
        });

        await cleanup();
    } catch (error) {
        console.error('Error executing cron job:', error);
        await cleanup();
    }
}

executeCronJob();
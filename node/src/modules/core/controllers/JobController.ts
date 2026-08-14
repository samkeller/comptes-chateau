import { Router } from "express";
import { AppDataSource } from "../../../db/dataSource";
import { processRecurringExpenses } from "../../../jobs/processRecurringExpenses";
import customLog from "../../../jobs/customLog";
import { backupDb } from "../../../jobs/backupDb";

const JobRoutes = Router();

JobRoutes.post("/run-recurring-expenses", async (req, res) => {
    const currentDate = new Date();

    customLog("WARN", `Manual trigger of recurring-expenses job by userId=${req.session.userId}`);

    let processedCount = 0;

    await AppDataSource.transaction(async (manager) => {
        const result = await processRecurringExpenses(manager, currentDate);
        if (result) {
            processedCount = result.processedCount;
        }
    });

    res.json({
        triggeredAt: currentDate.toISOString(),
        processedCount,
    });
});

JobRoutes.post("/backup-db", async (req, res) => {
    const currentDate = new Date();
    customLog("WARN", `Manual trigger of backup-db job by userId=${req.session.userId}`);

    try {
        await backupDb(currentDate);
        res.json({ triggeredAt: currentDate.toISOString(), message: 'Backup job completed successfully.' });
    } catch (error) {
        console.error(error);
        res.status(500).json({ error: 'An error occurred while running the backup-db job.' });
    }
});

export default JobRoutes;

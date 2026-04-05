import { Router } from "express";
import { AppDataSource } from "../../../db/dataSource";
import { processRecurringExpenses } from "../../../jobs/processRecurringExpenses";
import jobLog from "../../../jobs/jobLog";

const JobRoutes = Router();

JobRoutes.post("/run-recurring-expenses", async (req, res) => {
    const currentDate = new Date();

    jobLog("WARN", `Manual trigger of recurring-expenses job by userId=${req.session.userId}`);

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

export default JobRoutes;

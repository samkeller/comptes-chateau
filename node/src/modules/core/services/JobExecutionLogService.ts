import { EntityManager, In, MoreThanOrEqual } from "typeorm";
import { AppDataSource } from "../../../db/dataSource";
import { JobExecutionLog, JobExecutionStatus } from "../entities/JobExecutionLog";
import customLog from "../../../jobs/customLog";

function parseDetails(details: string | null): unknown {
    if (!details) return null;
    try {
        return JSON.parse(details);
    } catch {
        return null;
    }
}

/** Dernière issue (succès ou erreur) d'un job. */
export interface JobOutcome {
    id: number;
    jobName: string;
    status: "success" | "error";
    createdAt: Date;
    details: unknown;
}

export default class JobExecutionLogService {
    private jobExecutionLogRepo;

    constructor(manager?: EntityManager) {
        this.jobExecutionLogRepo = manager ?
            manager.getRepository(JobExecutionLog) :
            AppDataSource.getRepository(JobExecutionLog);

    }

    async logSuccess(jobName: string, message: string, details?: Record<string, any>) {
        customLog("SUCCESS", `Job "${jobName}" succeeded: ${message}`);
        return this.jobExecutionLogRepo.save({
            jobName,
            status: JobExecutionStatus.SUCCESS,
            message,
            details: JSON.stringify(details)
        });
    }

    async logInfo(jobName: string, message: string, details?: Record<string, any>) {
        customLog("INFO", `Job "${jobName}" info: ${message}`);
        return this.jobExecutionLogRepo.save({
            jobName,
            status: JobExecutionStatus.INFO,
            message,
            details: JSON.stringify(details)
        });
    }

    async logError(
        jobName: string,
        message: string,
        details?: Error | unknown | Record<string, any>
    ) {
        customLog("ERROR", `Job "${jobName}" failed: ${message}`);

        const formattedDetails = details instanceof Error ? {
            error: details.message,
            stack: details.stack,
        } :
            details;

        return this.jobExecutionLogRepo.save({
            jobName,
            status: JobExecutionStatus.ERROR,
            message,
            details: JSON.stringify(formattedDetails)
        });
    }

    /**
     * Dernière issue (succès ou erreur) de chaque job depuis la date donnée.
     * Les logs intermédiaires (info, warning) sont ignorés.
     */
    async getLatestOutcomes(since: Date): Promise<JobOutcome[]> {
        const logs = await this.jobExecutionLogRepo.find({
            where: {
                status: In([JobExecutionStatus.SUCCESS, JobExecutionStatus.ERROR]),
                createdAt: MoreThanOrEqual(since),
            },
            order: { createdAt: "DESC", id: "DESC" },
        });

        const latestByJob = new Map<string, JobExecutionLog>();
        for (const log of logs) {
            if (!latestByJob.has(log.jobName)) latestByJob.set(log.jobName, log);
        }

        return [...latestByJob.values()].map((log) => ({
            id: log.id,
            jobName: log.jobName,
            status: log.status === JobExecutionStatus.ERROR ? "error" : "success",
            createdAt: log.createdAt,
            details: parseDetails(log.details),
        }));
    }

    async logWarning(jobName: string, message: string, details?: Record<string, any>) {
        customLog("WARN", `Job "${jobName}" warning: ${message}`);
        return this.jobExecutionLogRepo.save({
            jobName,
            status: JobExecutionStatus.WARNING,
            message,
            details: JSON.stringify(details)
        });
    }
}

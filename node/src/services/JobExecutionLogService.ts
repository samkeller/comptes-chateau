import { EntityManager } from "typeorm";
import { AppDataSource } from "../db/dataSource";
import { JobExecutionLog, JobExecutionStatus } from "../entities/JobExecutionLog";

export default class JobExecutionLogService {
    private jobExecutionLogRepo;

    constructor(manager?: EntityManager) {
        this.jobExecutionLogRepo = manager ?
            manager.getRepository(JobExecutionLog) :
            AppDataSource.getRepository(JobExecutionLog);

    }

    async logSuccess(jobName: string, message: string, details?: Record<string, any>) {
        console.info(`Job "${jobName}" succeeded: ${message}`, details);
        return this.jobExecutionLogRepo.save({
            jobName,
            status: JobExecutionStatus.SUCCESS,
            message,
            details: JSON.stringify(details)
        });
    }

    async logError(jobName: string, message: string, error?: Error | unknown) {
        console.error(`Job "${jobName}" failed: ${message}`, error instanceof Error ? { message: error.message, stack: error.stack } : error);
        return this.jobExecutionLogRepo.save({
            jobName,
            status: JobExecutionStatus.ERROR,
            message,
            details: JSON.stringify({
                error: error instanceof Error ? error.message : String(error),
                stack: error instanceof Error ? error.stack : undefined
            })
        });
    }

    async logWarning(jobName: string, message: string, details?: Record<string, any>) {
        console.warn(`Job "${jobName}" warning: ${message}`, details);
        return this.jobExecutionLogRepo.save({
            jobName,
            status: JobExecutionStatus.WARNING,
            message,
            details: JSON.stringify(details)
        });
    }
}

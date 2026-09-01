import { EntityManager, Repository } from "typeorm";
import { AppDataSource } from "../../../db/dataSource";
import { JobExecutionLog, JobExecutionStatus } from "../entities/JobExecutionLog";
import customLog from "../../../jobs/customLog";

export default class JobExecutionLogService {
    private jobExecutionLogRepo: Repository<JobExecutionLog>;

    constructor(em: EntityManager = AppDataSource.manager) {
        this.jobExecutionLogRepo = em.getRepository(JobExecutionLog);
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

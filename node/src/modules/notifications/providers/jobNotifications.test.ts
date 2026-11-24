import { describe, expect, it } from "vitest";
import { jobNotifications, type JobOutcome } from "./jobNotifications";
import { BACKUP_DB_JOB_NAME } from "../../../jobs/backupDb";
import { RECURRING_EXPENSES_JOB_NAME } from "../../../jobs/processRecurringExpenses";

const RUN_AT = new Date("2026-11-23T00:00:05.000Z");

function outcome(overrides: Partial<JobOutcome>): JobOutcome {
    return { id: 1, jobName: BACKUP_DB_JOB_NAME, status: "success", createdAt: RUN_AT, details: null, ...overrides };
}

describe("jobNotifications", () => {
    it("reports a successful backup once per run", () => {
        expect(jobNotifications([outcome({ id: 12 })])).toEqual([{
            key: "BACKUP_SUCCEEDED:12",
            type: "BACKUP_SUCCEEDED",
            severity: "info",
            title: "Sauvegarde effectuée",
            message: expect.any(String),
            occurredAt: RUN_AT.toISOString(),
            target: null,
        }]);
    });

    it("raises a high severity notification for any failed job", () => {
        expect(jobNotifications([outcome({ id: 7, jobName: "sync-open-food-facts", status: "error" })])).toEqual([
            expect.objectContaining({
                key: "JOB_FAILED:7",
                type: "JOB_FAILED",
                severity: "high",
                message: expect.stringContaining("sync-open-food-facts"),
            }),
        ]);
    });

    it("groups failures of the same night into a single notification", () => {
        const result = jobNotifications([
            outcome({ id: 8, jobName: BACKUP_DB_JOB_NAME, status: "error" }),
            outcome({ id: 9, jobName: "nightly-cron", status: "error" }),
        ]);

        expect(result).toEqual([expect.objectContaining({
            key: "JOB_FAILED:8-9",
            type: "JOB_FAILED",
            title: "Échec de 2 tâches automatiques",
            message: expect.stringMatching(/backup-db.*nightly-cron/),
        })]);
    });

    it("stays silent on recurring expenses, even when some were processed (too noisy)", () => {
        expect(jobNotifications([outcome({
            jobName: RECURRING_EXPENSES_JOB_NAME,
            details: { processedExpenses: [{ id: 1, label: "Loyer" }] },
        })])).toEqual([]);
    });
});

/**
 * Configuration partagée entre back et front.
 * Utilisée notamment pour les tests lancés depuis la racine.
 */

/**
 * Niveau de log pour les tests et la DB de test.
 * Valeurs possibles : "silent", "error", "warn", "info", "debug"
 * - silent : aucun log
 * - error : seulement les erreurs
 * - warn : erreurs + warnings
 * - info : erreurs + warnings + infos (défaut)
 * - debug : tout, y compris les détails de debug
 * Dans le navigateur, où process est absent, le niveau reste "info".
 */
export const TEST_LOG_LEVEL = typeof process === "undefined" ? "info" : process.env.TEST_LOG_LEVEL ?? "info";

/**
 * Logger de test conditionnel basé sur TEST_LOG_LEVEL.
 */
export class TestLogger {
    private static shouldLog(level: "error" | "warn" | "info" | "debug"): boolean {
        const levels = ["silent", "error", "warn", "info", "debug"];
        const currentLevel = levels.indexOf(TEST_LOG_LEVEL);
        const messageLevel = levels.indexOf(level);
        return messageLevel <= currentLevel;
    }

    static error(...args: unknown[]): void {
        if (this.shouldLog("error")) console.error(...args);
    }

    static warn(...args: unknown[]): void {
        if (this.shouldLog("warn")) console.warn(...args);
    }

    static info(...args: unknown[]): void {
        if (this.shouldLog("info")) console.info(...args);
    }

    static debug(...args: unknown[]): void {
        if (this.shouldLog("debug")) console.debug(...args);
    }
}

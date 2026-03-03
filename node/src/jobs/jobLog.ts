const colors = {
    reset: "\x1b[0m",
    gray: "\x1b[90m",
    green: "\x1b[32m",
    yellow: "\x1b[33m",
    red: "\x1b[31m",
    cyan: "\x1b[36m",
};

/**
 * Affiche un message de log formaté avec un timestamp et une couleur selon le niveau de log.
 * @param level Le niveau de log (INFO, ERROR, WARN, DEBUG)
 * @param message Le message à afficher
 */
function jobLog(level: "INFO" | "ERROR" | "WARN" | "DEBUG", message: string) {
    const colorMap = {
        INFO: colors.green,
        WARN: colors.yellow,
        ERROR: colors.red,
        DEBUG: colors.cyan,
    };

    console.log(
        `${colors.gray}${colors.reset} ${colorMap[level]}[${level}]${colors.reset} ${message}`
    );
}

export default jobLog;
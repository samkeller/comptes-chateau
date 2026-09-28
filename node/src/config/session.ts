export const SESSION_COOKIE_NAME = "sid";

/**
 * Retournes la durée de session en millisecondes en fonction de si l'appareil doit être mémorisé ou non.
 * @param rememberDevice Indique si l'appareil doit être mémorisé.
 * 
 * @returns La durée de session en millisecondes.
 * 
 * @example  getSessionDurationMs(true) -> 5184000000 (60 jours)
 * @example  getSessionDurationMs(false) -> 86400000 (1 jour)
 */
export function getSessionDurationMs(rememberDevice: boolean): number {
    const oneDayInMs = 24 * 60 * 60 * 1000;
    return rememberDevice ? oneDayInMs * 60 : oneDayInMs;
}
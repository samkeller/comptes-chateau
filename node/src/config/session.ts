import { SessionOptions } from "express-session";
import getPgSessionStoreInstance from "./PGSession";

export const SESSION_COOKIE_NAME = "sid";

const APP_SECRET = process.env.SESSION_SECRET
if (!APP_SECRET) { throw new Error("No SESSION_SECRET provided in environment variables"); }

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

export const EXPRESS_SESSION_CONFIG: SessionOptions = {
    name: SESSION_COOKIE_NAME,
    secret: APP_SECRET,
    store: getPgSessionStoreInstance(),
    resave: false,
    saveUninitialized: false,
    cookie: {
        httpOnly: true,
        secure: process.env.NODE_ENV === "production", // false en dev
        sameSite: "lax",
        maxAge: getSessionDurationMs(false) // Default: 1j
    }
}
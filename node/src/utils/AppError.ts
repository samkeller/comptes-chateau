/**
 * Classe d'erreur applicative standard.
 * À lancer depuis n'importe quel service ou contrôleur : intercéptée par le `errorMiddleware` global et renvoyée au frontend avec une structure JSON typée..
 */
export class AppError extends Error {
    readonly statusCode: number;
    /** Code lisible par la machine, transmis au frontend (ex. "NATURE_NOT_FOUND"). */
    readonly code: string;

    constructor(statusCode: number, code: string, message: string) {
        super(message);
        this.name = "AppError";
        this.statusCode = statusCode;
        this.code = code;
    }
}

// ---------------------------------------------------------------------------
// Helpers factory — à privilégier par rapport à `new AppError(...)` pour la lisibilité.
// ---------------------------------------------------------------------------

export const badRequest = (code: string, message: string): AppError =>
    new AppError(400, code, message);

export const notFound = (code: string, message: string): AppError =>
    new AppError(404, code, message);

export const conflict = (code: string, message: string): AppError =>
    new AppError(409, code, message);

export const unauthorized = (code: string, message: string): AppError =>
    new AppError(401, code, message);

export const forbidden = (code: string, message: string): AppError =>
    new AppError(403, code, message);

export const internalServerError = (code: string, message: string): AppError =>
    new AppError(500, code, message);
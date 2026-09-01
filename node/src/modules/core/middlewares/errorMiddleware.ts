import type { Request, Response, NextFunction } from "express";
import type { ApiErrorBody } from "@chocosous/shared";
import { AppError } from "../../../utils/AppError";

/**
 * Middleware global de gestion des erreurs Express.
 * Garantit que toute réponse d'erreur respecte le contrat partagé `ApiErrorBody`.
 */
export function errorMiddleware(err: unknown, _req: Request, res: Response, _next: NextFunction): void {
    if (err instanceof AppError) {
        const body: ApiErrorBody = { code: err.code, message: err.message };
        res.status(err.statusCode).json(body);
        return;
    }

    console.error("[Unhandled Error]", err);
    const body: ApiErrorBody = { code: "INTERNAL_ERROR", message: "Internal server error" };
    res.status(500).json(body);
}

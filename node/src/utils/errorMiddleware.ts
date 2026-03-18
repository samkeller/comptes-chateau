import type { Request, Response, NextFunction } from "express";
import { AppError } from "./AppError";

/**
 * Middleware global de gestion des erreurs Express.
 */
export function errorMiddleware(err: unknown, _req: Request, res: Response, _next: NextFunction): void {
    if (err instanceof AppError) {
        res.status(err.statusCode).json({ code: err.code, message: err.message });
        return;
    }

    console.error("[Unhandled Error]", err);
    res.status(500).json({ code: "INTERNAL_ERROR", message: "Internal server error" });
}

import type { Request, Response, NextFunction } from "express";
import { z, ZodType, ZodError } from "zod";
import { AppError } from "./AppError";

// ---------------------------------------------------------------------------
// Schémas de params réutilisables
// ---------------------------------------------------------------------------

/** Valide un param `:id` (entier positif, coercé depuis string). */
export const IdParamSchema = z.object({
    id: z.coerce.number().int().positive(),
});

/** Valide un param `:commentId` (entier positif, coercé depuis string). */
export const CommentIdParamSchema = z.object({
    commentId: z.coerce.number().int().positive(),
});

// ---------------------------------------------------------------------------
// Middleware factories
// ---------------------------------------------------------------------------

/**
 * Factory de middleware Express qui valide `req.body` contre un schéma Zod.
 *
 * En cas de succès, la valeur parsée (coercée + épurée) remplace `req.body`.
 * En cas d'échec, transmet une AppError(400, "VALIDATION_ERROR", ...) au
 * middleware d'erreur global — les handlers n'ont pas besoin de try/catch.
 *
 * Usage :
 *   router.post("/", validateBody(MonSchema), monHandler);
 */
export function validateBody<T>(schema: ZodType<T>) {
    return (req: Request, _res: Response, next: NextFunction): void => {
        const result = schema.safeParse(req.body);
        if (!result.success) {
            next(new AppError(400, "VALIDATION_ERROR", formatZodError(result.error)));
            return;
        }
        req.body = result.data;
        next();
    };
}

/**
 * Factory de middleware Express qui valide `req.query` contre un schéma Zod.
 *
 * En cas de succès, la valeur parsée remplace `req.query`.
 * En cas d'échec, transmet une AppError(400, "VALIDATION_ERROR", ...).
 *
 * Usage :
 *   router.get("/", validateQuery(MonSchemaQuery), monHandler);
 */
export function validateQuery<T>(schema: ZodType<T>) {
    return (req: Request, _res: Response, next: NextFunction): void => {
        const result = schema.safeParse(req.query);
        if (!result.success) {
            next(new AppError(400, "VALIDATION_ERROR", formatZodError(result.error)));
            return;
        }
        req.query = result.data as typeof req.query;
        next();
    };
}

/**
 * Factory de middleware Express qui valide `req.params` contre un schéma Zod.
 *
 * Ne remplace pas `req.params` (le type resterait `Record<string, string>`).
 * Le handler accède ensuite aux valeurs via `Number(req.params.id)`, avec la
 * garantie que la validation est déjà passée.
 *
 * Usage :
 *   router.get("/:id", validateParams(IdParamSchema), monHandler);
 */
export function validateParams<T>(schema: ZodType<T>) {
    return (req: Request, _res: Response, next: NextFunction): void => {
        const result = schema.safeParse(req.params);
        if (!result.success) {
            next(new AppError(400, "VALIDATION_ERROR", formatZodError(result.error)));
            return;
        }
        next();
    };
}

function formatZodError(error: ZodError): string {
    return error.issues
        .map((e) => (e.path.length > 0 ? `${e.path.join(".")}: ${e.message}` : e.message))
        .join("; ");
}

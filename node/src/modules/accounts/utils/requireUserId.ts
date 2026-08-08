import { unauthorized } from "../../../utils/AppError";
import { Request } from "express";

/**
 * Vérifie que l'utilisateur est connecté et retourne son id.
 * @param req 
 * @returns 
 */
export default function requireUserId(req: Request): number {
    const userId = req.session.userId;
    if (!userId) throw unauthorized("UNAUTHORIZED", "Non authentifié");
    return userId;
}
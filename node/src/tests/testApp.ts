import express, { Router } from "express";
import { errorMiddleware } from "../modules/core/middlewares/errorMiddleware";

/**
 * Crée une application Express pour les tests avec un chemin de montage, des routes et un ID utilisateur optionnel.
 * @param mountPath 
 * @param routes 
 * @param userId 
 * @returns 
 */
export function createTestApp(mountPath: string, routes: Router, userId?: number) {
    const app = express();
    app.use(express.json());
    if (userId !== undefined) {
        app.use((req, _res, next) => {
            (req as any).session = { userId };
            next();
        });
    }
    app.use(mountPath, routes);
    app.use(errorMiddleware);
    return app;
}
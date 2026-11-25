import express, { Router } from "express";
import { errorMiddleware } from "../modules/core/middlewares/errorMiddleware";
import { TEST_USER_ID } from "./testDbSetup";

/**
 * Crée une application Express pour les tests avec un chemin de montage, des routes et un ID utilisateur optionnel.
 *
 * `express-session` n'est pas installé dans l'app de test : on le remplace par un middleware
 * minimal qui pose `req.session` (même contrat que le vrai middleware, sans store ni cookie).
 * @param mountPath 
 * @param routes 
 * @param userId 
 * @returns 
 */
export function createTestApp(mountPath: string, routes: Router, userId: number = TEST_USER_ID) {
    const app = express();
    app.use(express.json());
    app.use((req, _res, next) => {
        Object.assign(req, { session: { userId } });
        next();
    });
    app.use(mountPath, routes);
    app.use(errorMiddleware);
    return app;
}
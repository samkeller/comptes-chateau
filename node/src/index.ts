const serverStart = performance.now();
import express, { Router } from 'express';
import session from 'express-session';
import { AppDataSource } from './db/dataSource';
import getPgSessionStoreInstance from './config/PGSession';
import { errorMiddleware } from './modules/core/middlewares/errorMiddleware';

import AuthRoutes from './modules/core/controllers/AuthController';
import morgan from 'morgan';
import cors from 'cors';
import 'dotenv/config';
import ApiRouter from './ApiRouter';
import helmet from 'helmet';
import path from 'path';
import "./jobs/crons"; // Lancer les crons

export const COOKIE_NAME = "sid";

const APP_SECRET = process.env.SESSION_SECRET

if (!APP_SECRET) {
    throw new Error("No SESSION_SECRET provided in environment variables");
}

if (!process.env.PORT) {
    throw new Error("No PORT provided in environment variables");
}

AppDataSource.initialize().then(() => {

    const app = express();
    app.set("trust proxy", 1);

    app.use(session({
        name: COOKIE_NAME,
        secret: APP_SECRET,
        store: getPgSessionStoreInstance(),
        resave: false,
        saveUninitialized: false,
        cookie: {
            httpOnly: true,
            secure: process.env.NODE_ENV === "production", // false en dev
            sameSite: "lax",
            maxAge: 1000 * 60 * 60 * 24 // 24H
        }
    }));

    app.use(helmet()); // Headers de sécurité
    app.use(cors({
        origin: true,
        credentials: true
    }));
    app.use(express.json())
    app.use(morgan('combined'))

    const routes = Router()

    /**
     * Health check pour vérifier que le serveur est bien en ligne.
     * A date, utile pour wait-on dans le script de démarrage du front pour attendre que le back soit prêt avant de lancer le front.
     */
    app.get("/health", (_req, res) => {
        res.sendStatus(200);
    });

    routes.use("/api/auth", AuthRoutes) // Avant -> Non protégé
    routes.use("/api", ApiRouter)

    app.use(routes)

    // Global error handler — must be registered after all routes
    // À enregistrer EN DERNIER dans `index.ts`, après toutes les routes :
    app.use(errorMiddleware);

    // Static react (prod)
    const clientPath = path.join(__dirname, "../../react/dist");

    app.use(express.static(clientPath));

    app.get("{*path}", (_req, res) => {
        res.sendFile(path.join(clientPath, "index.html"));
    });

    return app.listen(Number(process.env.PORT), "0.0.0.0", () => {
        const totalTime = performance.now() - serverStart;

        console.info(`[startup] Server listening on :${process.env.PORT} - ${totalTime.toFixed(0)}ms`);
    })
})

process.on('SIGINT', function () {
    console.info("\nGracefully shutting down from SIGINT (Ctrl-C)");
    // some other closing procedures go here
    process.exit(0);
});
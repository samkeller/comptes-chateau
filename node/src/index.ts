import express, { Router } from 'express';
import session from 'express-session';
import { AppDataSource } from './db/dataSource';

import AuthRoutes from './controllers/AuthController';
import morgan from 'morgan';
import cors from 'cors';
import 'dotenv/config';
import ApiRouter from './controllers/ApiRouter';
import helmet from 'helmet';

export const COOKIE_NAME = "sid";

const APP_SECRET = process.env.SESSION_SECRET

if (!APP_SECRET) {
    throw new Error("No SESSION_SECRET provided in environment variables");
}

AppDataSource.initialize().then(() => {
    const app = express();
    app.set("trust proxy", 1);

    app.use(session({
        name: COOKIE_NAME,
        secret: APP_SECRET,
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
        origin: process.env.FRONTEND_URL,
        credentials: true
    }))
    app.use(express.json())
    app.use(morgan('combined'))

    const routes = Router()

    routes.use("/auth", AuthRoutes) // Avant -> Non protégé
    routes.use("/api", ApiRouter)

    app.use(routes)

    console.log("Running on port " + process.env.PORT)

    return app.listen(process.env.PORT);
})

process.on('SIGINT', function () {
    console.log("\nGracefully shutting down from SIGINT (Ctrl-C)");
    // some other closing procedures go here
    process.exit(0);
});
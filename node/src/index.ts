import express, { Router } from 'express';
import { AppDataSource } from './db/dataSource';
import OperationRoutes from './controllers/OperationControllers';
import morgan from 'morgan';
import cors from 'cors';

AppDataSource.initialize().then(() => {
    const app = express();
    app.use(express.json())
    app.use(cors())
    app.use(morgan('combined'))
    console.log("Running on port " + process.env.PORT)

    const routes = Router()

    routes.use("/operation", OperationRoutes)

    app.use("/api", routes)

    return app.listen(process.env.PORT);
})

process.on('SIGINT', function () {
    console.log("\nGracefully shutting down from SIGINT (Ctrl-C)");
    // some other closing procedures go here
    process.exit(0);
});
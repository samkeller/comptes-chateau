import express from 'express';
import { AppDataSource } from './db/dataSource';
import OperationRoutes from './controllers/OperationControllers';

AppDataSource.initialize().then(() => {
    const app = express();
    app.use(express.json())
    app.use("/operation", OperationRoutes)
    console.log("Running on port " + process.env.PORT)
    return app.listen(process.env.PORT);
})
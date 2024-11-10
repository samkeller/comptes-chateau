import { Router, Request, Response } from "express";

const OperationRoutes = Router();

OperationRoutes.get('/', (req: Request, res: Response) => {
    return res.json('Established connection!');
})

export default OperationRoutes
import { Router, Request, Response } from "express";
import OperationService from "../services/operation/OperationService";
import { SaveOperationSchema, OperationBatchCheckSchema } from "../services/operation/OperationDtos";
import { validateBody } from "../../../utils/validate";

const OperationRoutes = Router();
const operationService = new OperationService();

OperationRoutes.get('/lazy', async (req: Request, res: Response) => {
    const data = await operationService.getLazy(req.query);
    res.json(data);
});

OperationRoutes.get('/export', async (_req: Request, res: Response) => {
    const data = await operationService.getAllForExport();
    res.json(data);
});

OperationRoutes.post('/', validateBody(SaveOperationSchema), async (req: Request, res: Response) => {
    const accountLine = await operationService.save(req.body);
    res.json(accountLine);
});

OperationRoutes.post('/check-batch', validateBody(OperationBatchCheckSchema), async (req: Request, res: Response) => {
    const result = await operationService.checkBatch(req.body);
    res.json(result);
});

OperationRoutes.get('/unchecked', async (_req: Request, res: Response) => {
    const data = await operationService.getAllUncheckedLines();
    res.json(data);
});

export default OperationRoutes
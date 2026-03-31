import { Router, Request, Response } from "express";
import OperationService from "../services/operation/OperationService";
import { SaveOperationSchema, OperationBatchCheckSchema } from "../services/operation/OperationDtos";
import { validateBody, validateParams, IdParamSchema } from "../../core/middlewares/validate";
import { getAccountIdFromParams } from "../utils/accountParams";

const OperationRoutes = Router({ mergeParams: true });
const operationService = new OperationService();

OperationRoutes.get('/lazy', async (req: Request, res: Response) => {
    const accountId = getAccountIdFromParams(req.params);
    const data = await operationService.getLazy(req.query, accountId);
    res.json(data);
});

OperationRoutes.get('/export', async (req: Request, res: Response) => {
    const accountId = getAccountIdFromParams(req.params);
    const data = await operationService.getAllForExport(accountId);
    res.json(data);
});

OperationRoutes.post('/', validateBody(SaveOperationSchema), async (req: Request, res: Response) => {
    const accountId = getAccountIdFromParams(req.params);
    const accountLine = await operationService.save(req.body, accountId);
    res.json(accountLine);
});

OperationRoutes.put('/:id', validateParams(IdParamSchema), validateBody(SaveOperationSchema), async (req: Request, res: Response) => {
    const accountId = getAccountIdFromParams(req.params);
    const accountLine = await operationService.save({
        ...req.body,
        id: Number(req.params.id)
    }, accountId);
    res.json(accountLine);
});

OperationRoutes.post('/check-batch', validateBody(OperationBatchCheckSchema), async (req: Request, res: Response) => {
    const accountId = getAccountIdFromParams(req.params);
    const result = await operationService.checkBatch(req.body, accountId);
    res.json(result);
});

OperationRoutes.get('/unchecked', async (req: Request, res: Response) => {
    const accountId = getAccountIdFromParams(req.params);
    const data = await operationService.getAllUncheckedLines(accountId);
    res.json(data);
});

export default OperationRoutes
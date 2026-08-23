import { Router, Request, Response } from "express";
import OperationService from "../services/OperationService";
import { SaveOperationSchema, OperationBatchCheckSchema } from "../dto/OperationDtos";
import { validateBody, validateParams, IdParamSchema } from "../../core/middlewares/validate";
import { getAccountIdFromParams } from "../utils/accountParams";
import requireUserId from "../utils/requireUserId";

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

OperationRoutes.get('/:id', async (req: Request, res: Response) => {
    const accountId = getAccountIdFromParams(req.params);
    const data = await operationService.getById(accountId, Number(req.params.id));
    res.json(data);
});

OperationRoutes.post('/', validateBody(SaveOperationSchema), async (req: Request, res: Response) => {
    const accountId = getAccountIdFromParams(req.params);
    const userId = requireUserId(req)
    const accountLine = await operationService.save(req.body, accountId, userId);
    res.json(accountLine);
});


OperationRoutes.put('/:id', validateParams(IdParamSchema), validateBody(SaveOperationSchema), async (req: Request, res: Response) => {
    const accountId = getAccountIdFromParams(req.params);
    const userId = requireUserId(req)
    const accountLine = await operationService.save(
        {
            ...req.body,
            id: Number(req.params.id)
        },
        accountId,
        userId
    );
    res.json(accountLine);
});

/**
 * Valides une liste d'opérations en batch.
 * OperationBatchCheckSchema: List d'objets avec id, isChecked et dateValeur.
 * Retourne le nombre d'opérations mises à jour.
 */
OperationRoutes.post('/check-batch', validateBody(OperationBatchCheckSchema), async (req: Request, res: Response) => {
    const accountId = getAccountIdFromParams(req.params);
    const userId = requireUserId(req);

    const result = await operationService.checkBatch(req.body, accountId, userId);
    res.json(result);
});

OperationRoutes.get('/unchecked', async (req: Request, res: Response) => {
    const accountId = getAccountIdFromParams(req.params);
    const data = await operationService.getAllUncheckedLines(accountId);
    res.json(data);
});

OperationRoutes.delete('/:id', validateParams(IdParamSchema), async (req: Request, res: Response) => {
    const accountId = getAccountIdFromParams(req.params);
    await operationService.delete(Number(req.params.id), accountId);
    res.status(204).send();
});

OperationRoutes.post('/:id/duplicate', validateParams(IdParamSchema), async (req: Request, res: Response) => {
    const accountId = getAccountIdFromParams(req.params);
    const duplicatedLine = await operationService.duplicateLine(accountId, Number(req.params.id));
    res.json(duplicatedLine);
});

export default OperationRoutes
import { Router, Request, Response } from "express";
import AccountLineService from "../services/AccountLineService";
import { SaveOperationSchema, OperationBatchCheckSchema } from "@chocosous/shared";
import { validateBody, validateParams, IdParamSchema } from "../../core/middlewares/validate";
import { getAccountIdFromParams } from "../utils/accountParams";
import requireUserId from "../utils/requireUserId";

const AccountLineRoutes = Router({ mergeParams: true });
const accountLineService = new AccountLineService();

AccountLineRoutes.get('/lazy', async (req: Request, res: Response) => {
    const accountId = getAccountIdFromParams(req.params);
    const data = await accountLineService.getLazy(req.query, accountId);
    res.json(data);
});

AccountLineRoutes.get('/export', async (req: Request, res: Response) => {
    const accountId = getAccountIdFromParams(req.params);
    const data = await accountLineService.getAllForExport(accountId);
    res.json(data);
});

AccountLineRoutes.get('/unchecked', async (req: Request, res: Response) => {
    const accountId = getAccountIdFromParams(req.params);
    const data = await accountLineService.getAllUncheckedLines(accountId);
    res.json(data);
});

AccountLineRoutes.get('/:id', validateParams(IdParamSchema), async (req: Request, res: Response) => {
    const accountId = getAccountIdFromParams(req.params);
    const id = Number(req.params.id);
    const data = await accountLineService.getById(accountId, id);
    res.json(data);
});

AccountLineRoutes.post('/', validateBody(SaveOperationSchema), async (req: Request, res: Response) => {
    const accountId = getAccountIdFromParams(req.params);
    const userId = requireUserId(req)
    const accountLine = await accountLineService.save(req.body, accountId, userId);
    res.json(accountLine);
});


AccountLineRoutes.put('/:id', validateParams(IdParamSchema), validateBody(SaveOperationSchema), async (req: Request, res: Response) => {
    const accountId = getAccountIdFromParams(req.params);
    const userId = requireUserId(req)
    const id = Number(req.params.id);

    const accountLine = await accountLineService.save(
        {
            ...req.body,
            id: id
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
AccountLineRoutes.post('/check-batch', validateBody(OperationBatchCheckSchema), async (req: Request, res: Response) => {
    const accountId = getAccountIdFromParams(req.params);
    const userId = requireUserId(req);

    const result = await accountLineService.checkBatch(req.body, accountId, userId);
    res.json(result);
});

AccountLineRoutes.delete('/:id', validateParams(IdParamSchema), async (req: Request, res: Response) => {
    const accountId = getAccountIdFromParams(req.params);
    await accountLineService.delete(Number(req.params.id), accountId);
    res.status(204).send();
});

AccountLineRoutes.post('/:id/duplicate', validateParams(IdParamSchema), async (req: Request, res: Response) => {
    const accountId = getAccountIdFromParams(req.params);
    const duplicatedLine = await accountLineService.duplicateLine(accountId, Number(req.params.id));
    res.json(duplicatedLine);
});

export default AccountLineRoutes
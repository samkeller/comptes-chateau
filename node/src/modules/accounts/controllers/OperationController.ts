import { Router, Request, Response } from "express";
import OperationService, { TableQueryValidationError } from "../services/operation/OperationService";
import { OperationBatchCheckPayload } from "../services/operation/OperationDtos";
import { OperationNotFoundError, OperationValidationError } from "../services/operation/OperationErrors";

const OperationRoutes = Router();
const operationService = new OperationService();

OperationRoutes.get('/lazy', async (req: Request, res: Response) => {
    try {
        const data = await operationService.getLazy(req.query);
        return res.json(data);
    } catch (error) {
        if (error instanceof TableQueryValidationError) {
            return res.status(400).json({ error: error.message });
        }

        console.error('Error in lazy load endpoint:', error);
        res.status(500).json({ error: 'Internal server error' });
    }
})

OperationRoutes.post('/', async (req: Request, res: Response) => {
    try {
        const accountLine = await operationService.save(req.body);
        return res.json(accountLine);
    } catch (error) {
        if (error instanceof OperationValidationError) {
            return res.status(400).json({ error: error.message });
        }

        console.error('Error creating operation:', error);
        return res.status(500).json({ error: 'Internal server error' });
    }
})

OperationRoutes.post('/check-batch', async (req: Request<unknown, unknown, OperationBatchCheckPayload>, res: Response) => {
    try {
        const result = await operationService.checkBatch(req.body);
        return res.json(result);
    } catch (error) {
        if (error instanceof OperationValidationError) {
            return res.status(400).json({ error: error.message });
        }

        if (error instanceof OperationNotFoundError) {
            return res.status(404).json({ error: error.message });
        }

        console.error('Error checking operations batch:', error);
        return res.status(500).json({ error: 'Internal server error' });
    }
});

OperationRoutes.get('/unchecked', async (_req: Request, res: Response) => {
    try {
        const data = await operationService.getAllUncheckedLines();
        return res.json(data);
    } catch (error) {
        console.error('Error in unchecked operations endpoint:', error);
        return res.status(500).json({ error: 'Internal server error' });
    }
});

export default OperationRoutes
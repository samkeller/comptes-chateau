import { Router, Request, Response } from "express";
import NatureService from "../services/NatureService";
import { SaveNaturePayload } from "../services/nature/NatureDtos";
import { NatureConflictError, NatureValidationError } from "../services/nature/NatureErrors";

const NatureRoutes = Router();
const natureService = new NatureService();

NatureRoutes.get('/', async (_req: Request, res: Response) => {
    try {
        const natures = await natureService.getAll();
        return res.json(natures);
    } catch (error) {
        console.error('Error fetching natures:', error);
        return res.status(500).json({ error: 'Internal server error' });
    }
});

NatureRoutes.post('/', async (req: Request<unknown, unknown, SaveNaturePayload>, res: Response) => {
    try {
        const createdNature = await natureService.create(req.body);
        return res.status(201).json(createdNature);
    } catch (error) {
        if (error instanceof NatureValidationError) {
            return res.status(400).json({ error: error.message });
        }

        if (error instanceof NatureConflictError) {
            return res.status(409).json({ error: error.message });
        }

        console.error('Error creating nature:', error);
        return res.status(500).json({ error: 'Internal server error' });
    }
});

NatureRoutes.put('/:id', async (req: Request<{ id: string }, unknown, SaveNaturePayload>, res: Response) => {
    const natureId = Number(req.params.id);
    if (!Number.isInteger(natureId) || natureId <= 0) {
        return res.status(400).json({ error: 'Invalid nature id' });
    }

    try {
        const updatedNature = await natureService.update(natureId, req.body);
        return res.json(updatedNature);
    } catch (error) {
        if (error instanceof NatureValidationError) {
            return res.status(400).json({ error: error.message });
        }

        if (error instanceof NatureConflictError) {
            return res.status(409).json({ error: error.message });
        }

        console.error('Error updating nature:', error);
        return res.status(500).json({ error: 'Internal server error' });
    }
});

NatureRoutes.delete('/:id', async (req: Request<{ id: string }>, res: Response) => {
    const natureId = Number(req.params.id);
    if (!Number.isInteger(natureId) || natureId <= 0) {
        return res.status(400).json({ error: 'Invalid nature id' });
    }

    try {
        await natureService.delete(natureId);
        return res.status(204).send();
    } catch (error) {
        if (error instanceof NatureValidationError) {
            return res.status(404).json({ error: error.message });
        }

        console.error('Error deleting nature:', error);
        return res.status(500).json({ error: 'Internal server error' });
    }
});

export default NatureRoutes

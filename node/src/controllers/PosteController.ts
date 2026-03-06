import { Router, Request, Response } from "express";
import PosteService from "../services/PosteService";
import { SavePostePayload } from "../services/poste/PosteDtos";
import { PosteConflictError, PosteValidationError } from "../services/poste/PosteErrors";

const PosteRoutes = Router();
const posteService = new PosteService();

PosteRoutes.get('/', async (_req: Request, res: Response) => {
    try {
        const postes = await posteService.getAll();
        return res.json(postes);
    } catch (error) {
        console.error('Error fetching postes:', error);
        return res.status(500).json({ error: 'Internal server error' });
    }
});

PosteRoutes.post('/', async (req: Request<unknown, unknown, SavePostePayload>, res: Response) => {
    try {
        const createdPoste = await posteService.create(req.body);
        return res.status(201).json(createdPoste);
    } catch (error) {
        if (error instanceof PosteValidationError) {
            return res.status(400).json({ error: error.message });
        }

        if (error instanceof PosteConflictError) {
            return res.status(409).json({ error: error.message });
        }

        console.error('Error creating poste:', error);
        return res.status(500).json({ error: 'Internal server error' });
    }
});

PosteRoutes.put('/:id', async (req: Request<{ id: string }, unknown, SavePostePayload>, res: Response) => {
    const posteId = Number(req.params.id);
    if (!Number.isInteger(posteId) || posteId <= 0) {
        return res.status(400).json({ error: 'Invalid poste id' });
    }

    try {
        const updatedPoste = await posteService.update(posteId, req.body);
        return res.json(updatedPoste);
    } catch (error) {
        if (error instanceof PosteValidationError) {
            return res.status(400).json({ error: error.message });
        }

        if (error instanceof PosteConflictError) {
            return res.status(409).json({ error: error.message });
        }

        console.error('Error updating poste:', error);
        return res.status(500).json({ error: 'Internal server error' });
    }
});

PosteRoutes.delete('/:id', async (req: Request<{ id: string }>, res: Response) => {
    const posteId = Number(req.params.id);
    if (!Number.isInteger(posteId) || posteId <= 0) {
        return res.status(400).json({ error: 'Invalid poste id' });
    }

    try {
        await posteService.delete(posteId);
        return res.status(204).send();
    } catch (error) {
        if (error instanceof PosteValidationError) {
            return res.status(404).json({ error: error.message });
        }

        console.error('Error deleting poste:', error);
        return res.status(500).json({ error: 'Internal server error' });
    }
});

export default PosteRoutes

import { z } from "zod";

export interface PosteDto {
    id: number;
    label: string;
    color: string;
    linkedAccountLines: number;
}

export interface SavePostePayload {
    label: string;
    color: string;
}

export const SavePosteSchema = z.object({
    label: z.string().trim().min(1),
    color: z.string().regex(/^#[0-9A-Fa-f]{6}$/),
});

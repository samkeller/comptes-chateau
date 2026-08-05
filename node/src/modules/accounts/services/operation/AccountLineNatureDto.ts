import { z } from "zod";

export interface AccountLineNatureDto {
    id: number;
    label: string;
    color: string;
    isHorsCompte: boolean;
    linkedAccountLines: number;
}

export interface SaveNaturePayload {
    label: string;
    color: string;
    isHorsCompte: boolean;
}

export const SaveNatureSchema = z.object({
    label: z.string().trim().min(1),
    color: z.string().regex(/^#[0-9A-Fa-f]{6}$/),
    isHorsCompte: z.boolean(),
});

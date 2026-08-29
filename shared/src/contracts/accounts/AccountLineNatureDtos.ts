import { z } from "zod";

/** Schéma de validation pour la création ou la modification d'une nature de ligne de compte. */
export const SaveNatureSchema = z.object({
    label: z.string().trim().min(1),
    color: z.string().regex(/^#[0-9A-Fa-f]{6}$/),
    isHorsCompte: z.boolean(),
});

export type SaveNaturePayload = z.infer<typeof SaveNatureSchema>;

/** Nature de ligne de compte telle que renvoyée par l'API. */
export interface AccountLineNatureDto {
    id: number;
    label: string;
    color: string;
    isHorsCompte: boolean;
    linkedAccountLines: number;
}

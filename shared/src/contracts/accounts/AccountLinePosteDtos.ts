import { z } from "zod";

/** Schéma de validation pour la création ou la modification d'un poste de dépense. */
export const SavePosteSchema = z.object({
    label: z.string().trim().min(1),
    color: z.string().regex(/^#[0-9A-Fa-f]{6}$/),
});

export type SavePostePayload = z.infer<typeof SavePosteSchema>;

/** Poste de dépense tel que renvoyé par l'API. */
export interface AccountLinePosteDto {
    id: number;
    label: string;
    color: string;
    linkedAccountLines: number;
}

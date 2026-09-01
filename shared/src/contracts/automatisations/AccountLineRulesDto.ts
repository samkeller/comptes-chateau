import { z } from "zod";

/** Schéma de validation du corps de requête pour créer ou modifier une règle de catégorisation. */
export const SaveAccountLineRuleSchema = z.object({
    label: z.string().trim().min(1).max(255),
    accountId: z.number().int().positive().nonoptional(),
    posteId: z.number().int().positive().nullable().optional(),
    natureId: z.number().int().positive().nullable().optional(),
}).refine((data) => data.posteId || data.natureId, {
    message: "Au moins un poste ou une nature doit être associé à la règle.",
    path: ["posteId"],
});

export type SaveAccountLineRuleRequest = z.infer<typeof SaveAccountLineRuleSchema>;

/** Schéma de validation du corps de requête pour rechercher des règles par motif. */
export const SearchAccountLineRulePatternSchema = z.object({
    pattern: z.string().trim().min(1).max(255),
});

export type SearchAccountLineRulePatternRequest = z.infer<typeof SearchAccountLineRulePatternSchema>;

/** Motif non catégorisé, avec suggestions de poste/nature basées sur la fréquence d'utilisation. */
export interface UnmappedAccountLineRuleResponse {
    pattern: string;
    label: string;
    count: number;
    account: {
        id: number;
        label: string;
    };
    suggestedPoste: {
        id: number;
        label: string;
        color: string;
    } | null;
    suggestedNature: {
        id: number;
        label: string;
        color: string;
    } | null;
}

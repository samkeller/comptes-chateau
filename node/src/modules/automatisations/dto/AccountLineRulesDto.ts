import { z } from "zod";
import { AccountLineNatureDto } from "../../../accounts/dto/AccountLineNatureDtos";
import { AccountLinePosteDto } from "../../../accounts/dto/AccountLinePosteDtos";

export interface AccountLineRuleDto {
    id: number;
    pattern: string;
    posteId?: number;
    natureId?: number;
    nature?: AccountLineNatureDto;
    poste?: AccountLinePosteDto;
}

export interface SaveAccountLineRulePayload {
    pattern: string;
    posteId?: number;
    natureId?: number;
}

export const SaveRuleSchema = z.object({
    pattern: z.string().trim().min(1).max(255),
    accountId: z.number().int().positive().nonoptional(),
    posteId: z.number().int().positive().nullable().optional(),
    natureId: z.number().int().positive().nullable().optional(),
}).refine((data) => data.posteId || data.natureId, {
    message: "Au moins un poste ou une nature doit être associé à la règle.",
    path: ["posteId"],
});

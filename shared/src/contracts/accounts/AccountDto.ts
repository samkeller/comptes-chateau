import z from "zod";


/**
 * DTO exposé par l'API.
 */
export const accountDtoSchema = z.object({
    id: z.number().int().nonnegative(),
    label: z.string(),

});

export type AccountDto = z.infer<typeof accountDtoSchema>;
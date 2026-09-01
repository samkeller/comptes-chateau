import { z } from "zod";

/** Schéma du corps JSON renvoyé par le middleware d'erreurs pour toute réponse non 2xx. */
export const ApiErrorSchema = z.object({
    code: z.string(),
    message: z.string(),
});

export type ApiErrorBody = z.infer<typeof ApiErrorSchema>;

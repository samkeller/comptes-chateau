import z from "zod";

/**
 * Fonction utilitaire (commune ou back) qui valide et transforme une string en date via zod.
 * 
 * @example
 * dateTransform.parse("2024-06-05"); // Retourne un objet Date
 * dateTransform.parse(new Date()); // Retourne le même objet Date
 * dateTransform.parse("invalid-date"); // Lève une erreur
 * 
 * @example
 * export const ObjWithDate = z.object({
 *      date: dateTransform, <-- ici
 *  )
 * const normalized = OperationBatchCheckSchema.parse(payload);
 * 
 */
export const dateTransform = z.preprocess((arg) => {
    if (arg instanceof Date) return arg;
    if (typeof arg === "string") {
        const parsed = new Date(arg);
        return isNaN(parsed.getTime()) ? undefined : parsed;
    }
    return undefined;
}, z.date()); // Garantit qu'en SORTIE du parse, c'est une Date JS

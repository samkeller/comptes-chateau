/**
 * Détecte une violation de contrainte UNIQUE PostgreSQL (code 23505).
 * Factorise le check dupliqué dans NatureService / PosteService.
 */
export function isUniqueViolation(error: unknown): boolean {
    return (
        !!error &&
        typeof error === "object" &&
        "code" in error &&
        (error as { code: string }).code === "23505"
    );
}

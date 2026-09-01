import axios from "axios";
import { ApiErrorSchema, type ApiErrorBody } from "@chocosous/shared";

/**
 * Type guard pour vérifier si un objet correspond à la structure d'un ApiErrorBody.
 * @param data 
 * @returns 
 */
export function isApiErrorBody(data: unknown): data is ApiErrorBody {
    return ApiErrorSchema.safeParse(data).success;
}

/**
 * Erreur typée produite par l'intercepteur axios pour toute réponse non-2xx.
 */
export class ApiError extends Error {
    readonly code: string;
    readonly statusCode: number;

    constructor(statusCode: number, code: string, message: string) {
        super(message);
        this.name = "ApiError";
        this.statusCode = statusCode;
        this.code = code;
    }

    /**
     * Traduit un AxiosError en ApiError, ou retourne null si ce n'est pas possible.
     * @param error 
     * @returns 
     */
    static fromAxiosError(error: unknown): ApiError | null {
        if (!axios.isAxiosError(error) || !error.response) return null;

        const { status, data } = error.response;

        if (isApiErrorBody(data)) {
            return new ApiError(status, data.code, data.message);
        }

        return new ApiError(status, "UNKNOWN_ERROR", "Une erreur est survenue");
    }
}

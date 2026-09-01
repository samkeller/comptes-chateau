import { z } from "zod";

/** Schéma de validation des identifiants de connexion. */
export const LoginSchema = z.object({
    username: z.string().min(1).transform((value) => value.trim().toLowerCase()),
    password: z.string().min(1),
});

export type LoginRequest = z.infer<typeof LoginSchema>;

/** Réponse de connexion : sous-ensemble du profil utilisateur (sans le total d'XP). */
export interface LoginResponse {
    id: number;
    username: string;
    avatar: string;
}

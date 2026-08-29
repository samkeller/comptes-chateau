import { z } from "zod";

/** Profil utilisateur tel que renvoyé par l'API. */
export interface UserDto {
    id: number;
    username: string;
    avatar: string;
    totalXp: number;
}

/** Schéma de validation du changement d'avatar. */
export const AvatarSchema = z.object({
    avatar: z.string().regex(/^\d{3}-[\w-]+\.png$/, "Nom de fichier avatar invalide"),
});

export type AvatarPayload = z.infer<typeof AvatarSchema>;

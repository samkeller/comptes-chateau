/**
 * Indicateur permettant petit à petit les niveaux d'êtres + difficiles à atteindre.
 */
export const LEVEL_XP_FACTOR = 250;

export interface UserLevelProgress {
    /**
     * Experience totale
     */
    totalXp: number;
    /**
     * Niveau de l'utilisateur.
     */
    level: number;

    /**
     * Experience nécessaire pour atteindre le niveau actuel.
     */
    currentLevelXp: number;

    /**
     * Experience nécessaire pour le prochain niveau.
     */
    nextLevelXp: number;

    /**
     * Pourcentage de progression jusqu'au prochain niveau.
     */
    progressPercent: number;
}

export function getUserFullProgress(totalXp: number): UserLevelProgress {


    const level = Math.floor(Math.sqrt(totalXp / LEVEL_XP_FACTOR));
    const currentLevelXp = LEVEL_XP_FACTOR * level * level;
    const nextLevelXp = LEVEL_XP_FACTOR * (level + 1) * (level + 1);
    const xpThisLevel = totalXp - currentLevelXp;
    const range = nextLevelXp - currentLevelXp;
    const progressPercent = range > 0 ? Math.min(100, (xpThisLevel / range) * 100) : 100;

    return {
        totalXp,
        level,
        currentLevelXp,
        nextLevelXp,
        progressPercent,
    };
}

export function didLevelUp(
    previousXp: number,
    currentXp: number
): boolean {
    return (getUserFullProgress(previousXp).level < getUserFullProgress(currentXp).level
    );

}

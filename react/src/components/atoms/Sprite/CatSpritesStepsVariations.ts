
interface SpriteAnimation {
    /**
     * Numéro de la ligne dans le sprite sheet correspondant à l'action
     */
    rowNumber: number;
    /**
     * Nombre d'étapes d'animation dans la ligne
     */
    animationSteps: number;
    /**
     * Durée d'affichage de chaque frame en millisecondes
     */
    frameDuration: number;
}

const catsStepsVariations = {
    // Walk (Rythme standard de marche : 90ms)
    walkDown: { rowNumber: 3, animationSteps: 6, frameDuration: 90 },
    walkUp: { rowNumber: 4, animationSteps: 6, frameDuration: 90 },
    walkRight: { rowNumber: 5, animationSteps: 6, frameDuration: 90 },
    walkLeft: { rowNumber: 6, animationSteps: 6, frameDuration: 90 },

    // Run (Course rapide : 65ms)
    runDown: { rowNumber: 9, animationSteps: 4, frameDuration: 65 },
    runUp: { rowNumber: 10, animationSteps: 4, frameDuration: 65 },
    runRight: { rowNumber: 11, animationSteps: 5, frameDuration: 65 },
    runLeft: { rowNumber: 12, animationSteps: 5, frameDuration: 65 },

    // Lick paw (Toilette calme : 110ms)
    lickPawSitFront: { rowNumber: 13, animationSteps: 8, frameDuration: 110 },
    lickPawLieFront: { rowNumber: 14, animationSteps: 8, frameDuration: 110 },

    // Meow (Action courte et posée : 150ms)
    meowSitFront: { rowNumber: 15, animationSteps: 3, frameDuration: 150 },
    meowLieFront: { rowNumber: 16, animationSteps: 3, frameDuration: 150 },
    meowStandFront: { rowNumber: 17, animationSteps: 3, frameDuration: 150 },

    // Scratch (Grattage rapide : 80ms)
    scratchSitLeft: { rowNumber: 18, animationSteps: 8, frameDuration: 80 },
    scratchSitRight: { rowNumber: 19, animationSteps: 8, frameDuration: 80 },

    // Tail wag (Batement de queue régulier : 120ms)
    tailWagSitFront: { rowNumber: 20, animationSteps: 5, frameDuration: 120 },
    tailWagSitBack: { rowNumber: 21, animationSteps: 5, frameDuration: 120 },
    tailWagSitLeft: { rowNumber: 22, animationSteps: 5, frameDuration: 120 },
    tailWagSitRight: { rowNumber: 23, animationSteps: 5, frameDuration: 120 },

    tailWagStandFront: { rowNumber: 24, animationSteps: 5, frameDuration: 120 },
    tailWagStandBack: { rowNumber: 25, animationSteps: 5, frameDuration: 120 },
    tailWagStandLeft: { rowNumber: 26, animationSteps: 5, frameDuration: 120 },
    tailWagStandRight: { rowNumber: 27, animationSteps: 5, frameDuration: 120 },

    tailWagLieLeft: { rowNumber: 28, animationSteps: 3, frameDuration: 140 },
    tailWagLieRight: { rowNumber: 29, animationSteps: 3, frameDuration: 140 },

    // Paw swipe (Coup de patte vifs : 60ms)
    pawRightSwipeStandFront: { rowNumber: 30, animationSteps: 11, frameDuration: 60 },
    pawLeftSwipeStandFront: { rowNumber: 31, animationSteps: 11, frameDuration: 60 },
    pawSwipeStandBack: { rowNumber: 32, animationSteps: 5, frameDuration: 60 },
    pawLeftSwipeStandLeft: { rowNumber: 33, animationSteps: 11, frameDuration: 60 },
    pawRightSwipeStandLeft: { rowNumber: 34, animationSteps: 11, frameDuration: 60 },
    pawLeftSwipeStandRight: { rowNumber: 35, animationSteps: 11, frameDuration: 60 },
    pawRightSwipeStandRight: { rowNumber: 36, animationSteps: 11, frameDuration: 60 },

    pawRightSwipeSitFront: { rowNumber: 37, animationSteps: 11, frameDuration: 60 },
    pawLeftSwipeSitFront: { rowNumber: 38, animationSteps: 11, frameDuration: 60 },
    pawSwipeSitBack: { rowNumber: 39, animationSteps: 5, frameDuration: 60 },

    pawLeftSwipeSitLeft: { rowNumber: 40, animationSteps: 11, frameDuration: 60 },
    pawRightSwipeSitLeft: { rowNumber: 41, animationSteps: 11, frameDuration: 60 },
    pawLeftSwipeSitRight: { rowNumber: 42, animationSteps: 11, frameDuration: 60 },
    pawRightSwipeSitRight: { rowNumber: 43, animationSteps: 11, frameDuration: 60 },

    // Yawn (Bâillement lent : 140ms)
    yawnSitFront: { rowNumber: 44, animationSteps: 7, frameDuration: 140 },

    // Sleep (Respiration très lente pendant le sommeil : 350ms)
    sleep1LeftFront: { rowNumber: 45, animationSteps: 2, frameDuration: 350 },
    sleep1RightFront: { rowNumber: 46, animationSteps: 2, frameDuration: 350 },
    sleep1LeftBack: { rowNumber: 47, animationSteps: 2, frameDuration: 350 },
    sleep1RightBack: { rowNumber: 48, animationSteps: 2, frameDuration: 350 },

    sleep2LeftFront: { rowNumber: 49, animationSteps: 2, frameDuration: 350 },
    sleep2RightFront: { rowNumber: 50, animationSteps: 2, frameDuration: 350 },

    sleep3LeftFront: { rowNumber: 51, animationSteps: 2, frameDuration: 350 },
    sleep3RightFront: { rowNumber: 52, animationSteps: 2, frameDuration: 350 },

    sleep4LeftFront: { rowNumber: 53, animationSteps: 2, frameDuration: 350 },
    sleep4RightFront: { rowNumber: 54, animationSteps: 2, frameDuration: 350 },

    sleep5LeftFront: { rowNumber: 55, animationSteps: 2, frameDuration: 350 },
    sleep5RightFront: { rowNumber: 56, animationSteps: 2, frameDuration: 350 },

    // Eat food (Mastication modérée : 100ms)
    eatFoodStandFront: { rowNumber: 57, animationSteps: 10, frameDuration: 100 },
    eatFoodStandBack: { rowNumber: 58, animationSteps: 8, frameDuration: 100 },
    eatFoodStandLeft: { rowNumber: 59, animationSteps: 10, frameDuration: 100 },
    eatFoodStandRight: { rowNumber: 60, animationSteps: 10, frameDuration: 100 },

    // Hiss (Feulements brefs/vifs : 90ms)
    hissFrontLeft: { rowNumber: 61, animationSteps: 2, frameDuration: 90 },
    hissFrontRight: { rowNumber: 62, animationSteps: 2, frameDuration: 90 },

    // Jump (Saut dynamique : 75ms)
    jumpBack: { rowNumber: 63, animationSteps: 3, frameDuration: 75 },
    jumpLeft: { rowNumber: 64, animationSteps: 5, frameDuration: 75 },
    jumpRight: { rowNumber: 65, animationSteps: 5, frameDuration: 75 },

    // On hind legs (Se dresse : 110ms)
    onHindLegs: { rowNumber: 66, animationSteps: 4, frameDuration: 110 },
} as const satisfies Record<string, SpriteAnimation>

type SpriteActionVariants = keyof typeof catsStepsVariations;

export { catsStepsVariations, type SpriteActionVariants };



import berliozSprite from "@assets/images/cats_sprites/berlioz.png";
import toulouseSprite from "@assets/images/cats_sprites/toulouse.png";
import { CSSProperties, useEffect, useState } from "react";
import { catsStepsVariations, SpriteActionVariants } from "./CatSpritesStepsVariations";

interface SpriteProps {
    catVariant: "toulouse" | "berlioz"
    actionVariant: SpriteActionVariants
}

export default function Sprite({ catVariant: variant, actionVariant }: SpriteProps) {
    const [currentStep, setCurrentStep] = useState(0);

    const { rowNumber, animationSteps, frameDuration } = catsStepsVariations[actionVariant];
    const imgSrc = variant === "toulouse" ? toulouseSprite : berliozSprite;

    const size = 64; // Taille du sprite en pixels

    // 1. Réinitialiser la frame à 0 dès que l'action change
    useEffect(() => {
        setCurrentStep(0);
    }, [actionVariant]);

    // 2. Mettre à jour l'intervalle avec animationSteps & frameDuration en dépendance
    useEffect(() => {
        const intervalId = setInterval(() => {
            setCurrentStep((prevStep) => (prevStep + 1) % animationSteps);
        }, frameDuration);

        return () => clearInterval(intervalId);
    }, [animationSteps, frameDuration]);

    const [offsetX, offsetY] = [
        currentStep * size, // Décalage horizontal basé sur le step actuel
        (rowNumber - 1) * size // Décalage vertical basé sur le rowNumber (rowNumber commence à 1 car on est des humains qui comptons)
    ];

    const styles: CSSProperties = {
        display: "inline-block",
        width: `${size}px`,
        height: `${size}px`,
        backgroundImage: `url(${imgSrc})`,
        backgroundPosition: `-${offsetX}px -${offsetY}px`,
        backgroundRepeat: "no-repeat",
        imageRendering: "pixelated", // Empêche le flou/flicker sur le pixel art
        transform: "translateZ(0)", // Force l'accélération matérielle GPU pour des transitions fluides
        willChange: "background-position",
    };


    return <span style={styles} ></span>;
}
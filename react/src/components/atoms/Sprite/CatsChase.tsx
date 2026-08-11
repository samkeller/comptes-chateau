import { useEffect, useRef, useState } from "react";
import Sprite from "./Sprite";

export default function CatsChase() {
  const [positionX, setPositionX] = useState<number | null>(null);
  const [direction, setDirection] = useState<"left" | "right">("left");
  
  // Gère qui est devant (true = Berlioz en tête, false = Toulouse en tête)
  const [isBerliozFirst, setIsBerliozFirst] = useState(true);

  const containerRef = useRef<HTMLDivElement>(null);
  const catWidth = 128; // 64px * 2
  const speed = 3;

  // Initialisation de la position de départ (hors écran à droite)
  useEffect(() => {
    const parentWidth = containerRef.current?.parentElement?.clientWidth || window.innerWidth;
    setPositionX(parentWidth);
  }, []);

  useEffect(() => {
    if (positionX === null) return;

    let animationFrameId: number;

    const updatePosition = () => {
      const containerWidth = containerRef.current?.parentElement?.clientWidth || window.innerWidth;
      
      // Limites étendues pour que les chats sortent à 100% du conteneur
      const minX = -catWidth;
      const maxX = containerWidth;

      setPositionX((prevX) => {
        if (prevX === null) return null;

        if (direction === "left") {
          const nextX = prevX - speed;
          if (nextX <= minX) {
            // Hors écran à gauche -> Demi-tour vers la droite
            setDirection("right");
            // 50% de chance d'inverser qui court devant
            setIsBerliozFirst(Math.random() < 0.5);
            return minX;
          }
          return nextX;
        } else {
          const nextX = prevX + speed;
          if (nextX >= maxX) {
            // Hors écran à droite -> Demi-tour vers la gauche
            setDirection("left");
            // 50% de chance d'inverser qui court devant
            setIsBerliozFirst(Math.random() < 0.5);
            return maxX;
          }
          return nextX;
        }
      });

      animationFrameId = requestAnimationFrame(updatePosition);
    };

    animationFrameId = requestAnimationFrame(updatePosition);

    return () => cancelAnimationFrame(animationFrameId);
  }, [direction, positionX]);

  if (positionX === null) return null;

  const actionVariant = direction === "left" ? "runLeft" : "runRight";

  // L'ordre d'affichage dans la DOM dépend de qui mène et de la direction
  const firstCat = isBerliozFirst ? "berlioz" : "toulouse";
  const secondCat = isBerliozFirst ? "toulouse" : "berlioz";

  return (
    <div ref={containerRef} className="w-full relative h-16 overflow-hidden">
      <div
        className="absolute bottom-0 flex"
        style={{ transform: `translateX(${positionX}px)` }}
      >
        {/* Quand ils vont à gauche, le premier du tableau est devant. 
            Quand ils vont à droite, le second du tableau passe devant si le DOM ne bouge pas.
            On adapte l'ordre pour que le meneur reste toujours la tête de course ! */}
        {direction === "left" ? (
          <>
            <Sprite actionVariant={actionVariant} catVariant={firstCat} />
            <Sprite actionVariant={actionVariant} catVariant={secondCat} />
          </>
        ) : (
          <>
            <Sprite actionVariant={actionVariant} catVariant={secondCat} />
            <Sprite actionVariant={actionVariant} catVariant={firstCat} />
          </>
        )}
      </div>
    </div>
  );
}
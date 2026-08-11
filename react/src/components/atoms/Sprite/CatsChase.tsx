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

  const positionRef = useRef<number | null>(null);
  const directionRef = useRef<"left" | "right">("left");
  const isBerliozFirstRef = useRef(true);


  useEffect(() => {
    const parentWidth =
      containerRef.current?.parentElement?.clientWidth || window.innerWidth;

    positionRef.current = parentWidth;
    setPositionX(parentWidth);

    let animationFrameId: number;

    const updatePosition = () => {
      const containerWidth =
        containerRef.current?.parentElement?.clientWidth || window.innerWidth;

      const minX = -catWidth;
      const maxX = containerWidth;

      const currentX = positionRef.current;

      if (currentX !== null) {
        let nextX = currentX;

        if (directionRef.current === "left") {
          nextX = currentX - speed;

          if (nextX <= minX) {
            nextX = minX;
            directionRef.current = "right";
            setDirection("right");

            const berliozFirst = Math.random() < 0.5;
            isBerliozFirstRef.current = berliozFirst;
            setIsBerliozFirst(berliozFirst);
          }
        } else {
          nextX = currentX + speed;

          if (nextX >= maxX) {
            nextX = maxX;
            directionRef.current = "left";
            setDirection("left");

            const berliozFirst = Math.random() < 0.5;
            isBerliozFirstRef.current = berliozFirst;
            setIsBerliozFirst(berliozFirst);
          }
        }

        positionRef.current = nextX;
        setPositionX(nextX);
      }

      animationFrameId = requestAnimationFrame(updatePosition);
    };

    animationFrameId = requestAnimationFrame(updatePosition);

    return () => cancelAnimationFrame(animationFrameId);
  }, []);

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
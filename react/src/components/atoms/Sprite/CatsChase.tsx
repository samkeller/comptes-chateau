import { useEffect, useRef, useState } from "react";
import Sprite from "./Sprite";

const SPEED = 3;
const CAT_WIDTH = 128;

export default function CatsChase() {
  const containerRef = useRef<HTMLDivElement>(null);
  const trackRef = useRef<HTMLDivElement>(null);

  const [direction, setDirection] = useState<"left" | "right">("left");
  const [isBerliozFirst, setIsBerliozFirst] = useState(true);

  useEffect(() => {
    let animId: number;
    let dir: "left" | "right" = "left";

    const getBounds = () => {
      const parentWidth = containerRef.current?.parentElement?.clientWidth || window.innerWidth;
      return { min: -CAT_WIDTH, max: parentWidth };
    };

    let { max: maxX, min: minX } = getBounds();
    let x = maxX;

    const animate = () => {
      x += dir === "left" ? -SPEED : SPEED;

      if (dir === "left" && x <= minX) {
        dir = "right";
        setDirection("right");
        setIsBerliozFirst(Math.random() < 0.5);
      } else if (dir === "right" && x >= maxX) {
        dir = "left";
        setDirection("left");
        setIsBerliozFirst(Math.random() < 0.5);
      }

      if (trackRef.current) {
        trackRef.current.style.transform = `translateX(${x}px)`;
      }

      animId = requestAnimationFrame(animate);
    };

    animId = requestAnimationFrame(animate);
    return () => cancelAnimationFrame(animId);
  }, []);

  const actionVariant = direction === "left" ? "runLeft" : "runRight";
  const [firstCat, secondCat]: ["berlioz" | "toulouse", "berlioz" | "toulouse"] = isBerliozFirst
    ? ["berlioz", "toulouse"]
    : ["toulouse", "berlioz"];

  // Inverse l'ordre visuel en fonction de la direction sans dupliquer le JSX
  const leadCat: "berlioz" | "toulouse" = direction === "left" ? firstCat : secondCat;
  const chaserCat: "berlioz" | "toulouse" = direction === "left" ? secondCat : firstCat;

  return (
    <div ref={containerRef} className="w-full relative h-16 overflow-hidden">
      <div ref={trackRef} className="absolute bottom-0 flex">
        <Sprite actionVariant={actionVariant} catVariant={leadCat} />
        <Sprite actionVariant={actionVariant} catVariant={chaserCat} />
      </div>
    </div>
  );
}
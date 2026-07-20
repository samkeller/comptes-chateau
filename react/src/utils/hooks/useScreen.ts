import { useEffect, useState } from "react";

/**
 * Breakpoints utilisés par l'application.
 *
 * Les valeurs représentent les largeurs minimales des catégories.
 *
 * - Mobile : < 768px
 * - Tablette : >= 768px et < 1024px
 * - Desktop : >= 1024px
 */
const BREAKPOINTS = {
  mobile: 768,
  tablet: 1024,
} as const;

/**
 * Informations retournées par {@link useScreen}.
 */
export interface UseScreenResult {
  /**
   * Largeur actuelle de la fenêtre en pixels.
   */
  width: number;

  /**
   * `true` si l'écran est considéré comme un mobile.
   */
  isMobile: boolean;

  /**
   * `true` si l'écran est considéré comme une tablette.
   */
  isTablet: boolean;

  /**
   * `true` si l'écran est considéré comme un ordinateur.
   */
  isDesktop: boolean;
}

/**
 * Hook permettant de connaître la largeur actuelle de la fenêtre ainsi que
 * le type d'appareil en fonction des breakpoints de l'application.
 *
 * Le hook met automatiquement ses valeurs à jour lors d'un redimensionnement
 * de la fenêtre (`resize`).
 *
 * | Type | Largeur |
 * |------|----------|
 * | Mobile | `< 768px` |
 * | Tablette | `>= 768px && < 1024px` |
 * | Desktop | `>= 1024px` |
 *
 * ## Exemple
 *
 * ```tsx
 * const { width, isMobile, isTablet, isDesktop } = useScreen();
 *
 * if (isMobile) {
 *   return <MobileLayout />;
 * }
 *
 * return (
 *   <p>Largeur actuelle : {width}px</p>
 * );
 * ```
 *
 * @returns Les informations sur la taille actuelle de l'écran.
 */
export function useScreen(): UseScreenResult {
  /**
   * Retourne la largeur actuelle de la fenêtre.
   *
   * Une valeur de `0` est renvoyée lors du rendu côté serveur (SSR),
   * car l'objet `window` n'est pas disponible.
   */
  const getWidth = () =>
    typeof window !== "undefined" ? window.innerWidth : 0;

  const [width, setWidth] = useState<number>(getWidth);

  useEffect(() => {
    const onResize = () => {
      setWidth(getWidth());
    };

    window.addEventListener("resize", onResize);

    return () => {
      window.removeEventListener("resize", onResize);
    };
  }, []);

  /**
   * L'écran est considéré comme un mobile.
   */
  const isMobile = width < BREAKPOINTS.mobile;

  /**
   * L'écran est considéré comme une tablette.
   */
  const isTablet =
    width >= BREAKPOINTS.mobile && width < BREAKPOINTS.tablet;

  /**
   * L'écran est considéré comme un ordinateur.
   */
  const isDesktop = width >= BREAKPOINTS.tablet;

  return {
    width,
    isMobile,
    isTablet,
    isDesktop,
  };
}
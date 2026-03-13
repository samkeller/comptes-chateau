import tinycolor from "tinycolor2";

/**
 * Génère une couleur stable et lisible à partir d'une string.
 * Compatible avec un thème sombre (ex: lara-dark-teal).
 */
export function getNiceColorFromString(str: string): string {
    // hash simple de la string
    let hash = 0;
    for (let i = 0; i < str.length; i++) {
        hash = str.charCodeAt(i) + ((hash << 5) - hash);
        hash |= 0;
    }

    // hue stable
    const hue = Math.abs(hash) % 360;

    // saturation / luminosité adaptées thème sombre
    const color = tinycolor({
        h: hue,
        s: 55 + (Math.abs(hash) % 20), // 55–75%
        l: 45 + (Math.abs(hash) % 10)  // 45–55%
    });

    return color.toHexString();
}

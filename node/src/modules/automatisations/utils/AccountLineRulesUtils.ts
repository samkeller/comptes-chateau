import { capitalizeFirstLetter } from "../../../utils/StringUtils";

/**
 * Normalise un libellé de règle de catégorisation de ligne de compte (affichage).
 * @param label 
 * @returns 
 */
export function normalizeAccountLineRuleLabel(label: string): string {
  if (!label) throw new Error("Le libellé ne peut pas être vide.");

  let normalized = label
    .toLowerCase()
    // Supprime les accents correctement (ex: é -> e, ç -> c)
    .normalize("NFC")
    .replace(/[\u0300-\u036f]/g, "")
    // Remplace les espaces multiples par un seul espace
    .replace(/\s+/g, " ")
    .trim();

  normalized = capitalizeFirstLetter(normalized);

  if (normalized.length === 0) {
    throw new Error("Le libellé normalisé ne peut pas être vide.");
  }
  return normalized;
}


/**
 * Contrairement à normalizeAccountLineRuleLabel, cette fonction ne capitalise pas la première lettre.
 * Elle est utilisée pour la comparaison des libellés, afin d'éviter que "Bonjour" et "bonjour",  soient considérés comme différents.
 * DeepEqual:
 * Café Paris
 * Cafe Paris
 * CAFE PARIS
 * Café Paris
 * @param label 
 * @returns 
 */
export function normalizeForMatching(label: string | null | undefined): string | null {
  if (!label) return null;

  const normalized = label
    .toLowerCase()
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .replace(/\s+/g, " ")
    .trim();

  return normalized.length > 0 ? normalized : null;
}
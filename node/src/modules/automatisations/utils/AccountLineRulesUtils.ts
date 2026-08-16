import { capitalizeFirstLetter } from "../../../utils/StringUtils";

export function normalizeAccountLineRuleLabel(label: string | null | undefined): string | null {
  if (!label) return null;
  
  let normalized = label
    .toLowerCase()
    // Supprime les accents correctement (ex: é -> e, ç -> c)
    .normalize("NFC")
    .replace(/[\u0300-\u036f]/g, "")
    // Remplace les espaces multiples par un seul espace
    .replace(/\s+/g, " ")
    .trim();

    normalized = capitalizeFirstLetter(normalized);

  return normalized.length > 0 ? normalized : null;
}
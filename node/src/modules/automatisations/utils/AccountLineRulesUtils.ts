export function normalizeLabel(label: string | null | undefined): string | null {
  if (!label) return null;
  
  const normalized = label
    .toLowerCase()
    // Supprime les accents correctement (ex: é -> e, ç -> c)
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    // Conserve uniquement les lettres, chiffres et espaces
    .replace(/[^a-z0-9\s]/g, " ")
    // Remplace les espaces multiples par un seul espace
    .replace(/\s+/g, " ")
    .trim();

  return normalized.length > 0 ? normalized : null;
}
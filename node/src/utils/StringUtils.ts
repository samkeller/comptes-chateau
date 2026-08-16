export function capitalizeFirstLetter(val: string | null | undefined): string {
    if (!val) return '';
    return String(val).charAt(0).toUpperCase() + String(val).slice(1);
}

export const DEFAULT_SETUP_COLOR = "#4f46e5";

export function isHexColor(value: string): boolean {
    return /^#[0-9A-Fa-f]{6}$/.test(value);
}

export function toColorPickerValue(color: string): string {
    return color.replace("#", "");
}

export function fromColorPickerValue(value: unknown): string {
    if (typeof value !== "string") {
        return DEFAULT_SETUP_COLOR;
    }

    const withHash = value.startsWith("#") ? value : `#${value}`;
    return isHexColor(withHash) ? withHash : DEFAULT_SETUP_COLOR;
}

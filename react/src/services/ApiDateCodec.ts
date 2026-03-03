import { format } from "date-fns";

const API_DATE_REGEX = /^\d{4}-\d{2}-\d{2}$/;

export function formatApiDate(date: Date): string {
    return format(date, "yyyy-MM-dd");
}

export function parseApiDate(value: string | Date | null | undefined): Date | null {
    if (!value) {
        return null;
    }

    if (value instanceof Date) {
        return value;
    }

    if (!API_DATE_REGEX.test(value)) {
        return null;
    }

    const [yearString, monthString, dayString] = value.split("-");
    const year = Number(yearString);
    const month = Number(monthString);
    const day = Number(dayString);

    return new Date(year, month - 1, day);
}

export function parseApiDateTime(value: string | Date | null | undefined): Date | null {
    if (!value) {
        return null;
    }

    if (value instanceof Date) {
        return value;
    }

    const parsedDate = new Date(value);
    return Number.isNaN(parsedDate.getTime()) ? null : parsedDate;
}

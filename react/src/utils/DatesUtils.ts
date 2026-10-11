import { format, formatDistance, parse } from "date-fns"
import { fr } from "date-fns/locale"

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


/**
 * Parses an API date-time value into a Date object.
 * Accepts a date string, an existing Date object, or null/undefined.
 * @param value - The date-time value to parse.
 * @returns The parsed Date object, or null if the input is missing or invalid.
 * 
 * @example
 * // Parse an ISO 8601 string in UTC.
 * parseApiDateTime("2026-10-11T10:30:00.000Z");
 * // Returns: Date object representing 2026-10-11T10:30:00.000Z
 * 
 * @example
 * // Parse a Unix timestamp in milliseconds.
 * parseApiDateTime(1791714600000);
 * // Returns: Date object representing the corresponding instant

* @example
 * // Pass an existing Date object.
 * const date = new Date("2026-10-11T10:30:00.000Z");
 * parseApiDateTime(date);
 * // Returns: the same Date object
 * 
 * @example
 * // Handle a missing value.
 * parseApiDateTime(null); // Returns: null
 * parseApiDateTime(undefined); // Returns: null
 * parseApiDateTime(""); // Returns: null
 * 
 * @example
 * // Handle an invalid date string.
 * parseApiDateTime("not-a-date");
 * // Returns: null
 * 
 * @example
 * // Handle an invalid Date object.
 * parseApiDateTime(new Date("invalid"));
 * // Returns: the invalid Date object (not null)
*/
export function parseApiDateTime(value: string | number | Date | null | undefined): Date | null {
    if (!value) {
        return null;
    }

    if (value instanceof Date) {
        return value;
    }

    const parsedDate = new Date(value);
    return Number.isNaN(parsedDate.getTime())
        ? null
        : parsedDate;
}

/**
 * Transforme une string en date
 * @param stringifiedDate 
 * @returns 
 */
function parseDDMMYYYYToDate(stringifiedDate: string): Date {
    return parse(stringifiedDate, 'dd/MM/yyyy', new Date())
}

function parseDateToDDMMYYYY(date: Date): string {
    return format(date, 'dd/MM/yyyy')
}

function parseDateToDisplay(date: Date): string {
    return format(date, 'dd MM yyyy')
}

function formatDistanceToNow(date: Date): string {
    return formatDistance(date, new Date(), { addSuffix: true, locale: fr })
}

export { parseDDMMYYYYToDate, parseDateToDDMMYYYY, parseDateToDisplay, formatDistanceToNow }
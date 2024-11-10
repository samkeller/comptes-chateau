import { format, parse } from "date-fns"

/**
 * Transforme une string en date
 * @param stringifiedDate 
 * @returns 
 */
function parseDDMMYYYYToDate(stringifiedDate: string): Date {
    return parse(stringifiedDate, 'dd/MM/yyyy', new Date())
}

function parsePostgresToDate(stringifiedDate: string): Date {
    return parse(stringifiedDate, 'yyyy-MM-dd', new Date())
}

function parseDateToDDMMYYYY(date: Date): string {
    return format(date, 'dd/MM/yyyy')
}

function parseDateToDisplay(date: Date): string {
    return format(date, 'dd MM yyyy')
}

export { parseDDMMYYYYToDate, parseDateToDDMMYYYY, parsePostgresToDate, parseDateToDisplay }
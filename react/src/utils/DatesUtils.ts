import { format, parse } from "date-fns"

/**
 * Transforme une string en date
 * @param stringifiedDate 
 * @returns 
 */
function parseDDMMYYYYToDate(stringifiedDate: string): Date {
    return parse(stringifiedDate, 'dd/MM/yyyy', new Date())
}

/**
 * Transforme une date en string au format dd/MM/yyyy, compréhensible par le backend.
 * Prend en compte les paramètres régionaux pour éviter les problèmes de format de date (23h/00h).
 * @param date 
 * @returns 
 */
function toLocaleIsoString(date: Date): string {
    return date.toLocaleDateString('fr-FR')
}

function parseDateToDDMMYYYY(date: Date): string {
    return format(date, 'dd/MM/yyyy')
}

function parseDateToDisplay(date: Date): string {
    return format(date, 'dd MM yyyy')
}

export { parseDDMMYYYYToDate, toLocaleIsoString, parseDateToDDMMYYYY, parseDateToDisplay }
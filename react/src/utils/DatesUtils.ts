import { format, formatDistance, parse } from "date-fns"
import { fr } from "date-fns/locale"

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
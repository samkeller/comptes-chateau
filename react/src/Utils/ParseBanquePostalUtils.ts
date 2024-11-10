import { parseDDMMYYYYToDate } from "./DatesUtils"

interface BanquePostaleImport {
    accountNumber: string,
    type: string,
    exportDate: Date,
    solde: number,
    operations: BanquePostalImportItem[]
}

interface BanquePostalImportItem {
    date: Date,
    label: string,
    montant: number
}

function csvAmountToJsAmount(str: string): number {
    if (str) {
        return parseFloat(str.replace(",", "."))
    } else {
        return -Infinity
    }
}

function ParseBanquePostale(csvDatas: string): object {
    const parsedDatas = csvDatas.split("\r\n").map(v => v.split(';'))
    const importedDatas: BanquePostaleImport = {
        accountNumber: parsedDatas[0][1],
        type: parsedDatas[1][1],
        exportDate: parseDDMMYYYYToDate(parsedDatas[3][1]),
        solde: csvAmountToJsAmount(parsedDatas[4][1]),
        operations: []
    };

    // Ajout les prix
    // Rien sur la dernière ligne ?
    for (let index = 7; index < parsedDatas.length - 1; index++) {
        importedDatas.operations.push({
            date: parseDDMMYYYYToDate(parsedDatas[index][0]),
            label: parsedDatas[index][1].replace("\"", ""),
            montant: csvAmountToJsAmount(parsedDatas[index][2]),
        })
    }

    return importedDatas
}

export { ParseBanquePostale }

export type { BanquePostaleImport, BanquePostalImportItem }
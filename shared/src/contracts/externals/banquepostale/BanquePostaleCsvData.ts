/**
 * Fichier d'import complet CSV */
export interface BanquePostaleCsvData {
    accountNumber: string;
    type: string;
    exportDate: Date;
    balance: number;
    operations: BanquePostaleCsvOperation[];
}

/**
 * Ligne d'operation du fichier CSV Banque Postale.
 */
export interface BanquePostaleCsvOperation {
    dateOperation: Date;
    label: string;
    amount: number;
    rowNumber: number;
}
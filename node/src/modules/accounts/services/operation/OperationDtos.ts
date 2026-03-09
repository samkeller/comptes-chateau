export interface OperationBatchCheckInput {
    id: number;
    isChecked: boolean;
    dateValeur: string;
}

export interface OperationBatchCheckPayload {
    checks: OperationBatchCheckInput[];
}

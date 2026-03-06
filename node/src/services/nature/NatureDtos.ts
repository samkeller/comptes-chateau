export interface NatureDto {
    id: number;
    label: string;
    color: string;
    isHorsCompte: boolean;
    linkedAccountLines: number;
}

export interface SaveNaturePayload {
    label: string;
    color: string;
    isHorsCompte: boolean;
}

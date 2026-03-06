export interface PosteDto {
    id: number;
    label: string;
    color: string;
    linkedAccountLines: number;
}

export interface SavePostePayload {
    label: string;
    color: string;
}

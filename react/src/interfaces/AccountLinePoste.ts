export class AccountLinePoste {
    id: number = 0;
    label: string = "";
    color: string = "#000000";
    linkedAccountLines?: number;

    constructor(poste: Partial<AccountLinePoste>) {
        Object.assign(this, poste);
    }
}

export default AccountLinePoste;

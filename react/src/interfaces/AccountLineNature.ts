export class AccountLineNature {
    id: number = 0;
    label: string = "";
    color: string = "#000000";
    isHorsCompte: boolean = false;
    linkedAccountLines?: number;

    constructor(nature: Partial<AccountLineNature>) {
        Object.assign(this, nature);
    }
}

export default AccountLineNature;

import AccountLineNature from "./AccountLineNature";
import AccountLinePoste from "./AccountLinePoste";

export class AccountLineRule {
    id: number = 0;
    label: string = "";
    pattern: string = "";
    occurrencesCount: number = 0;
    accountId: number = 0;
    posteId?: number = 0;
    natureId?: number = 0;
    poste?: AccountLinePoste;
    nature?: AccountLineNature;

    constructor(nature: Partial<AccountLineRule>) {
        Object.assign(this, nature);
    }
}

export default AccountLineRule;

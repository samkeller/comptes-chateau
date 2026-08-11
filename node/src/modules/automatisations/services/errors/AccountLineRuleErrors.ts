export class AccountLineRuleValidationError extends Error {
    constructor(message: string) {
        super(message);
        this.name = "AccountLineRuleValidationError";
    }
}

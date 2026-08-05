export class AccountLineNatureValidationError extends Error {
    constructor(message: string) {
        super(message);
        this.name = "AccountLineNatureValidationError";
    }
}

export class AccountLineNatureConflictError extends Error {
    constructor(message: string) {
        super(message);
        this.name = "AccountLineNatureConflictError";
    }
}

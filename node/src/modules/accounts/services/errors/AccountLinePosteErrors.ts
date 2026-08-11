export class AccountLinePosteValidationError extends Error {
    constructor(message: string) {
        super(message);
        this.name = "AccountLinePosteValidationError";
    }
}

export class AccountLinePosteConflictError extends Error {
    constructor(message: string) {
        super(message);
        this.name = "AccountLinePosteConflictError";
    }
}

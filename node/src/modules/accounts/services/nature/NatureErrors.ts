export class NatureValidationError extends Error {
    constructor(message: string) {
        super(message);
        this.name = "NatureValidationError";
    }
}

export class NatureConflictError extends Error {
    constructor(message: string) {
        super(message);
        this.name = "NatureConflictError";
    }
}

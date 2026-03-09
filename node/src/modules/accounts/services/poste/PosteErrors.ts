export class PosteValidationError extends Error {
    constructor(message: string) {
        super(message);
        this.name = "PosteValidationError";
    }
}

export class PosteConflictError extends Error {
    constructor(message: string) {
        super(message);
        this.name = "PosteConflictError";
    }
}

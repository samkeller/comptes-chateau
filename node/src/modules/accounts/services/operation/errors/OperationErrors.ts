export class OperationValidationError extends Error {
    constructor(message: string) {
        super(message);
        this.name = "OperationValidationError";
    }
}

export class OperationNotFoundError extends Error {
    constructor(message: string) {
        super(message);
        this.name = "OperationNotFoundError";
    }
}

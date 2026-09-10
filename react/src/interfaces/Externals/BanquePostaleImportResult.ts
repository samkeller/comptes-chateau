import { parseApiDate } from "@/utils/DatesUtils"
import { BanquePostaleImportResultPayload, BanquePostaleCsvDataMetadata, BanquePostaleOperationImportDto, BanquePostaleAmbiguousResultPayload, BanquePostaleMatchedResultPayload } from "@chocosous/shared"



class BanquePostaleImportMatchingCandidate {
    id: number = 0
    accountId: number = 0
    compositeExternalId: string = ""
    dateOperation: Date = new Date()
    label: string = ""
    amount: number = 0
    rowNumber: number = 0
    metadata: BanquePostaleCsvDataMetadata = {} as BanquePostaleCsvDataMetadata

    constructor(matchingCandidate: Partial<BanquePostaleOperationImportDto>) {
        Object.assign(this, matchingCandidate);
        if (matchingCandidate.dateOperation) {
            const parsed =  parseApiDate(matchingCandidate.dateOperation)
            this.dateOperation = parsed || new Date()
        }
    }
}

class BanquePostaleImportResultMatched {
    type = "matched" as const
    accountLineId: number = 0
    candidate: BanquePostaleImportMatchingCandidate = {} as BanquePostaleImportMatchingCandidate

    constructor(matchedResult: Partial<BanquePostaleMatchedResultPayload>) {
        Object.assign(this, matchedResult);
        if (matchedResult.candidate) {
            this.candidate = new BanquePostaleImportMatchingCandidate(matchedResult.candidate);
        }
    }
}

class BanquePostaleImportResultAmbiguous {
    type = "ambiguous" as const
    accountLineId: number = 0
    candidates: BanquePostaleImportMatchingCandidate[] = []

    constructor(ambiguousResult: Partial<BanquePostaleAmbiguousResultPayload>) {
        Object.assign(this, ambiguousResult);
        if (ambiguousResult.candidates) {
            this.candidates = ambiguousResult.candidates.map(
                (candidate) => new BanquePostaleImportMatchingCandidate(candidate)
            );
        }
    }
}

class BanquePostaleImportResult {
    linesProcessed: number = 0
    linesCreated: number = 0
    linesSkipped: number = 0
    matched: BanquePostaleImportResultMatched[] = []
    ambiguous: BanquePostaleImportResultAmbiguous[] = []


    constructor(importResult: Partial<BanquePostaleImportResultPayload>) {
        Object.assign(this, importResult);

        if (importResult.matched && importResult.matched.length > 0) {
            this.matched = importResult.matched.map(item => new BanquePostaleImportResultMatched(item));
        }
        if (importResult.ambiguous && importResult.ambiguous.length > 0) {
            this.ambiguous = importResult.ambiguous.map(item => new BanquePostaleImportResultAmbiguous(item));
        }
    }
}

export default BanquePostaleImportResult;
export {
    BanquePostaleImportMatchingCandidate,
    BanquePostaleImportResultMatched,
    BanquePostaleImportResultAmbiguous
}
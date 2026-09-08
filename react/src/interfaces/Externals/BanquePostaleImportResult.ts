import { parseApiDate } from "@/utils/DatesUtils"
import { BanquePostaleImportResultPayload, BanquePostaleCsvDataMetadata, BanquePostaleOperationImportDto, BanquePostaleAmbiguousResultPayload, BanquePostaleMatchedResultPayload } from "@chocosous/shared"



class BanquePostaleImportMatchingCandidate {
    id: number = 0
    accountId: number = 0
    compositeExternalId: string = ""
    dateOperation: Date | null = null
    label: string = ""
    amount: number = 0
    rowNumber: number = 0
    metadata: BanquePostaleCsvDataMetadata = {} as BanquePostaleCsvDataMetadata

    constructor(matchingCandidate: Partial<BanquePostaleOperationImportDto>) {
        Object.assign(this, matchingCandidate);
        if (matchingCandidate.dateOperation) {
            this.dateOperation = parseApiDate(matchingCandidate.dateOperation)
        }
    }
}

class BanquePostaleImportResultMatched {
    type: "matched" = "matched"
    accountLineId: number = 0
    candidate: BanquePostaleImportMatchingCandidate = {} as BanquePostaleImportMatchingCandidate

    constructor(matchedResult: Partial<BanquePostaleMatchedResultPayload>) {
        Object.assign(this, matchedResult);
    }
}

class BanquePostaleImportResultAmbiguous {
    type: "ambiguous" = "ambiguous"
    accountLineId: number = 0
    candidates: BanquePostaleImportMatchingCandidate[] = []

    constructor(ambiguousResult: Partial<BanquePostaleAmbiguousResultPayload>) {
        Object.assign(this, ambiguousResult);
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
export { BanquePostaleImportResultMatched, BanquePostaleImportResultAmbiguous }
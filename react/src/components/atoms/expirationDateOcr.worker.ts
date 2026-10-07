import type { Worker as TesseractWorker } from "tesseract.js";

export type ExpirationOcrResult = { text: string } | { error: true };

const scope = self as unknown as {
    onmessage: ((event: MessageEvent<File>) => void) | null;
    postMessage: (result: ExpirationOcrResult) => void;
    close: () => void;
};

scope.onmessage = async (event: MessageEvent<File>): Promise<void> => {
    let worker: TesseractWorker | undefined;
    let result: ExpirationOcrResult = { error: true };
    try {
        const { createWorker, OEM } = await import("tesseract.js");
        let rejectFailure: (reason: unknown) => void = () => undefined;
        const failure = new Promise<never>((_resolve, reject) => { rejectFailure = reject; });
        worker = await Promise.race([
            createWorker("fra+eng", OEM.LSTM_ONLY, {
                workerPath: "/tesseract/worker.min.js",
                corePath: "/tesseract/core",
                langPath: "/tesseract/lang",
                workerBlobURL: false,
                gzip: false,
                cacheMethod: "none",
                errorHandler: (error: unknown) => rejectFailure(error),
            }),
            failure,
        ]);
        const { data } = await Promise.race([worker.recognize(event.data), failure]);
        result = { text: data.text };
    } catch {
        result = { error: true };
    } finally {
        await worker?.terminate().catch(() => undefined);
        scope.postMessage(result);
        // Fermer ce coordinateur détruit aussi le sous-worker, même si l'initialisation a échoué.
        scope.close();
    }
};

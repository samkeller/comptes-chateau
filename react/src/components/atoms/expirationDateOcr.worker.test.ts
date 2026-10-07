import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";

const { createWorker, recognize, terminate } = vi.hoisted(() => ({
    createWorker: vi.fn(),
    recognize: vi.fn(),
    terminate: vi.fn(),
}));

vi.mock("tesseract.js", () => ({ createWorker, OEM: { LSTM_ONLY: 1 } }));

interface WorkerScope {
    onmessage: ((event: MessageEvent<Blob>) => Promise<void>) | null;
    postMessage: ReturnType<typeof vi.fn>;
    close: ReturnType<typeof vi.fn>;
}

let scope: WorkerScope;

beforeEach(async () => {
    vi.resetModules();
    vi.clearAllMocks();
    scope = { onmessage: null, postMessage: vi.fn(), close: vi.fn() };
    vi.stubGlobal("self", scope);
    createWorker.mockResolvedValue({ recognize, terminate });
    recognize.mockResolvedValue({ data: { text: "DLC 31/12/2026" } });
    terminate.mockResolvedValue(undefined);
    await import("./expirationDateOcr.worker");
});

afterEach(() => vi.unstubAllGlobals());

async function scan(): Promise<void> {
    await scope.onmessage?.({ data: new Blob(["photo"], { type: "image/png" }) } as MessageEvent<Blob>);
}

describe("expiration OCR coordinator", () => {
    it("does not initialize OCR before receiving a photo", () => {
        expect(createWorker).not.toHaveBeenCalled();
    });

    it("uses only local assets, recognizes the photo and terminates before returning text", async () => {
        await scan();
        expect(createWorker).toHaveBeenCalledWith("fra+eng", 1, expect.objectContaining({
            workerPath: "/tesseract/worker.min.js",
            corePath: "/tesseract/core",
            langPath: "/tesseract/lang",
            workerBlobURL: false,
            gzip: false,
            cacheMethod: "none",
        }));
        expect(recognize).toHaveBeenCalledOnce();
        expect(terminate).toHaveBeenCalledOnce();
        expect(scope.postMessage).toHaveBeenCalledWith({ text: "DLC 31/12/2026" });
        expect(scope.close).toHaveBeenCalledOnce();
    });

    it("terminates and reports recognition errors without returning exception details", async () => {
        recognize.mockRejectedValueOnce(new Error("recognition failed"));
        await scan();
        expect(terminate).toHaveBeenCalledOnce();
        expect(scope.postMessage).toHaveBeenCalledWith({ error: true });
        expect(scope.close).toHaveBeenCalledOnce();
    });

    it("closes on initialization rejection even when there is no exposed Tesseract worker", async () => {
        createWorker.mockRejectedValueOnce(new Error("initialization failed"));
        await scan();
        expect(scope.postMessage).toHaveBeenCalledWith({ error: true });
        expect(scope.close).toHaveBeenCalledOnce();
    });

    it("escapes Tesseract's pending initialization promise when its error handler fires", async () => {
        createWorker.mockImplementationOnce((_langs: string, _oem: number, options: { errorHandler: (error: unknown) => void }) => {
            queueMicrotask(() => options.errorHandler(new Error("missing language data")));
            return new Promise<never>(() => undefined);
        });
        await scan();
        expect(scope.postMessage).toHaveBeenCalledWith({ error: true });
        expect(scope.close).toHaveBeenCalledOnce();
    });

    it("still returns the result and closes if termination fails", async () => {
        terminate.mockRejectedValueOnce(new Error("already stopped"));
        await scan();
        expect(scope.postMessage).toHaveBeenCalledWith({ text: "DLC 31/12/2026" });
        expect(scope.close).toHaveBeenCalledOnce();
    });
});

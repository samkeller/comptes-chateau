import type { Worker as TesseractWorker } from "tesseract.js";
import { parseExpirationDateFromText } from "../../utils/parseExpirationDateFromText";

export type ExpirationOcrResult = { text: string } | { error: true };

const scope = self as unknown as {
    onmessage: ((event: MessageEvent<File>) => void) | null;
    postMessage: (result: ExpirationOcrResult) => void;
    close: () => void;
};

const MIN_LONG_SIDE = 1600;
const MAX_LONG_SIDE = 2400;

/**
 * Redimensionne la photo, applique l'orientation EXIF, passe en niveaux de gris et étire le contraste :
 * Tesseract lit bien mieux les petites mentions imprimées sur un emballage chargé.
 * Retourne la photo d'origine si le navigateur ne permet pas ce traitement dans un worker.
 */
async function preprocess(photo: Blob): Promise<Blob> {
    if (typeof createImageBitmap !== "function" || typeof OffscreenCanvas === "undefined") return photo;
    try {
        const bitmap = await createImageBitmap(photo, { imageOrientation: "from-image" });
        const longSide = Math.max(bitmap.width, bitmap.height);
        const scale = longSide < MIN_LONG_SIDE ? MIN_LONG_SIDE / longSide : Math.min(1, MAX_LONG_SIDE / longSide);
        const width = Math.max(1, Math.round(bitmap.width * scale));
        const height = Math.max(1, Math.round(bitmap.height * scale));
        const canvas = new OffscreenCanvas(width, height);
        const context = canvas.getContext("2d", { willReadFrequently: true });
        if (!context) return photo;
        context.drawImage(bitmap, 0, 0, width, height);
        bitmap.close();
        const image = context.getImageData(0, 0, width, height);
        const pixels = image.data;
        const histogram = new Uint32Array(256);
        for (let index = 0; index < pixels.length; index += 4) {
            const gray = Math.round(0.299 * pixels[index] + 0.587 * pixels[index + 1] + 0.114 * pixels[index + 2]);
            pixels[index] = gray;
            histogram[gray]++;
        }
        // Bornes à 1 % / 99 % pour ignorer reflets et ombres isolés.
        const total = width * height;
        let low = 0, high = 255, cumulated = 0;
        for (; low < 255 && (cumulated += histogram[low]) < total * 0.01; low++);
        cumulated = 0;
        for (; high > 0 && (cumulated += histogram[high]) < total * 0.01; high--);
        const range = Math.max(1, high - low);
        for (let index = 0; index < pixels.length; index += 4) {
            const stretched = Math.min(255, Math.max(0, Math.round((pixels[index] - low) * 255 / range)));
            pixels[index] = pixels[index + 1] = pixels[index + 2] = stretched;
        }
        context.putImageData(image, 0, 0);
        return await canvas.convertToBlob({ type: "image/png" });
    } catch {
        return photo;
    }
}

scope.onmessage = async (event: MessageEvent<File>): Promise<void> => {
    let worker: TesseractWorker | undefined;
    let result: ExpirationOcrResult = { error: true };
    try {
        const { createWorker, OEM, PSM } = await import("tesseract.js");
        let rejectFailure: (reason: unknown) => void = () => undefined;
        const failure = new Promise<never>((_resolve, reject) => { rejectFailure = reject; });
        const [image, createdWorker] = await Promise.all([
            preprocess(event.data),
            Promise.race([
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
            ]),
        ]);
        worker = createdWorker;
        const texts: string[] = [];
        // Le mode « texte épars » retrouve une date isolée parmi les autres mentions ; le mode auto sert de repli.
        for (const mode of [PSM.SPARSE_TEXT, PSM.AUTO]) {
            await Promise.race([worker.setParameters({ tessedit_pageseg_mode: mode }), failure]);
            const { data } = await Promise.race([worker.recognize(image), failure]);
            texts.push(data.text);
            if (parseExpirationDateFromText(data.text)) break;
        }
        result = { text: texts.join("\n") };
    } catch {
        result = { error: true };
    } finally {
        await worker?.terminate().catch(() => undefined);
        scope.postMessage(result);
        // Fermer ce coordinateur détruit aussi le sous-worker, même si l'initialisation a échoué.
        scope.close();
    }
};

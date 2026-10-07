import { useEffect, useRef, useState, type ChangeEvent, type ReactElement } from "react";
import { Button } from "primereact/button";
import { showGlobalToast } from "../../services/GlobalToast";
import { parseExpirationDateFromText } from "../../utils/parseExpirationDateFromText";
import type { ExpirationOcrResult } from "./expirationDateOcr.worker";

interface ExpirationDateScannerProps {
    onDetected: (date: Date) => void;
    onManualEntry: () => void;
    disabled?: boolean;
}

const MAX_IMAGE_BYTES = 10 * 1024 * 1024;
const SCAN_TIMEOUT_MS = 90_000;
const MANUAL_ENTRY_MESSAGE = "Date non reconnue, saisis-la à la main";

export function ExpirationDateScanner({
    onDetected, onManualEntry, disabled = false,
}: ExpirationDateScannerProps): ReactElement {
    const inputRef = useRef<HTMLInputElement>(null);
    const workerRef = useRef<Worker | null>(null);
    const timeoutRef = useRef<ReturnType<typeof setTimeout> | null>(null);
    const [scanning, setScanning] = useState(false);
    const [error, setError] = useState<string | null>(null);
    if (disabled && scanning) setScanning(false);

    const stop = (): void => {
        if (workerRef.current) {
            workerRef.current.onmessage = null;
            workerRef.current.onerror = null;
            workerRef.current.terminate();
        }
        workerRef.current = null;
        if (timeoutRef.current !== null) clearTimeout(timeoutRef.current);
        timeoutRef.current = null;
    };

    useEffect(() => stop, []);
    useEffect(() => {
        if (disabled) {
            stop();
        }
    }, [disabled]);

    const scan = (event: ChangeEvent<HTMLInputElement>): void => {
        const file = event.target.files?.[0];
        event.target.value = "";
        if (!file || disabled || workerRef.current) return;
        setError(null);
        const fail = (reason: string = MANUAL_ENTRY_MESSAGE): void => {
            stop();
            setScanning(false);
            setError(reason);
            showGlobalToast({ severity: "warn", summary: MANUAL_ENTRY_MESSAGE });
            onManualEntry();
        };
        if (!file.type.startsWith("image/") || file.size === 0 || file.size > MAX_IMAGE_BYTES) {
            fail("Choisissez une image de moins de 10 Mo.");
            return;
        }
        setScanning(true);
        try {
            // Le coordinateur permet d'annuler aussi l'initialisation interne de Tesseract.
            const worker = new Worker(new URL("./expirationDateOcr.worker.ts", import.meta.url), { type: "module" });
            workerRef.current = worker;
            timeoutRef.current = setTimeout(fail, SCAN_TIMEOUT_MS);
            worker.onerror = () => fail();
            worker.onmessage = (message: MessageEvent<ExpirationOcrResult>): void => {
                const result = message.data;
                const date = "text" in result ? parseExpirationDateFromText(result.text) : null;
                if (date) {
                    stop();
                    setScanning(false);
                    onDetected(date);
                } else fail();
            };
            worker.postMessage(file);
        } catch {
            fail();
        }
    };

    return (
        <div className="flex flex-col gap-2">
            <input ref={inputRef} type="file" accept="image/*" capture="environment" hidden disabled={disabled || scanning} onChange={scan} />
            <div className="flex flex-wrap gap-2">
                <Button type="button" label="Scanner la date" icon="pi pi-camera" loading={scanning}
                    disabled={disabled || scanning} onClick={() => inputRef.current?.click()} />
                <Button type="button" label="Saisir manuellement" icon="pi pi-pencil" outlined disabled={disabled}
                    onClick={() => { stop(); setScanning(false); setError(null); onManualEntry(); }} />
            </div>
            {scanning && <p role="status" className="text-sm">Lecture de la photo sur cet appareil…</p>}
            {error && <p role="alert" className="text-sm text-red-600">{error}</p>}
        </div>
    );
}

export default ExpirationDateScanner;

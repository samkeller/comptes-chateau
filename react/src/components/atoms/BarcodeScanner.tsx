import { useEffect, useRef, useState } from "react";
import { BrowserMultiFormatReader } from "@zxing/browser";
import { BarcodeFormat, DecodeHintType } from "@zxing/library";
import { Message } from "primereact/message";
import { Button } from "primereact/button";

interface BarcodeScannerProps {
    onDetected: (code: string) => void;
    active: boolean;
    onCancel?: () => void;
}

type ScannerStatus = "starting" | "scanning";

interface NativeBarcodeDetector {
    detect(source: CanvasImageSource): Promise<{ rawValue: string }[]>;
}
type NativeBarcodeDetectorConstructor = new (options: { formats: string[] }) => NativeBarcodeDetector;

const SCAN_INTERVAL_MS = 150;
const MAX_FRAME_SIDE = 1280;
const NATIVE_FORMATS = ["ean_13", "ean_8", "upc_a", "upc_e"];

function createNativeDetector(): NativeBarcodeDetector | null {
    const Detector = (window as unknown as { BarcodeDetector?: NativeBarcodeDetectorConstructor }).BarcodeDetector;
    if (!Detector) return null;
    try { return new Detector({ formats: NATIVE_FORMATS }); } catch { return null; }
}

function cameraErrorMessage(cause: unknown): string {
    const name = cause instanceof Error ? cause.name : "";
    if (name === "NotAllowedError" || name === "SecurityError") {
        return "Accès à la caméra refusé. Autorise-le dans le navigateur ou saisis le code à la main.";
    }
    if (name === "NotFoundError" || name === "OverconstrainedError") return "Aucune caméra disponible. Saisis le code à la main.";
    if (name === "NotReadableError") return "La caméra est utilisée par une autre application. Ferme-la puis réessaie.";
    return "Impossible de démarrer la caméra. Saisis le code à la main.";
}

export default function BarcodeScanner({ onDetected, active, onCancel }: BarcodeScannerProps) {
    const containerRef = useRef<HTMLDivElement>(null);
    const onDetectedRef = useRef(onDetected);
    const [status, setStatus] = useState<ScannerStatus>("starting");
    const [error, setError] = useState<string | null>(null);
    const [restart, setRestart] = useState(0);
    const cameraUnavailable = !window.isSecureContext || !navigator.mediaDevices?.getUserMedia;

    useEffect(() => { onDetectedRef.current = onDetected; }, [onDetected]);

    useEffect(() => {
        if (!active || cameraUnavailable) return;
        let disposed = false;
        let stream: MediaStream | null = null;
        let timer: ReturnType<typeof setTimeout> | undefined;
        // Un élément propre à chaque montage évite qu'un démarrage tardif écrase le flux suivant.
        const video = document.createElement("video");
        video.autoplay = true;
        video.playsInline = true;
        video.muted = true;
        video.setAttribute("playsinline", "");
        video.setAttribute("muted", "");
        video.className = "w-full max-h-64 rounded-lg object-cover bg-black";
        video.setAttribute("aria-label", "Caméra de scan du code-barres");
        containerRef.current?.appendChild(video);

        const canvas = document.createElement("canvas");
        const context = canvas.getContext("2d", { willReadFrequently: true });
        const hints = new Map<DecodeHintType, unknown>();
        hints.set(DecodeHintType.POSSIBLE_FORMATS, [
            BarcodeFormat.EAN_13, BarcodeFormat.EAN_8, BarcodeFormat.UPC_A, BarcodeFormat.UPC_E,
        ]);
        hints.set(DecodeHintType.TRY_HARDER, true);
        const reader = new BrowserMultiFormatReader(hints);
        let nativeDetector = createNativeDetector();

        const release = (): void => {
            if (timer !== undefined) clearTimeout(timer);
            stream?.getTracks().forEach(track => track.stop());
            stream = null;
            video.srcObject = null;
        };

        const decodeWithZxing = (): string | null => {
            if (!context) return null;
            // Le canvas suit la taille réelle du flux, qui change souvent après le démarrage sur mobile.
            const scale = Math.min(1, MAX_FRAME_SIDE / Math.max(video.videoWidth, video.videoHeight));
            const width = Math.round(video.videoWidth * scale);
            const height = Math.round(video.videoHeight * scale);
            if (canvas.width !== width) canvas.width = width;
            if (canvas.height !== height) canvas.height = height;
            context.drawImage(video, 0, 0, width, height);
            try {
                return reader.decodeFromCanvas(canvas).getText();
            } catch {
                return null;
            }
        };

        const decodeFrame = async (): Promise<string | null> => {
            if (nativeDetector) {
                try {
                    const codes = await nativeDetector.detect(video);
                    return codes.find(code => /^\d{8,14}$/.test(code.rawValue))?.rawValue ?? null;
                } catch {
                    nativeDetector = null;
                }
            }
            return decodeWithZxing();
        };

        const tick = async (): Promise<void> => {
            if (disposed) return;
            if (video.readyState >= HTMLMediaElement.HAVE_CURRENT_DATA && video.videoWidth > 0 && video.videoHeight > 0) {
                const code = await decodeFrame();
                if (disposed) return;
                if (code) {
                    release();
                    onDetectedRef.current(code);
                    return;
                }
            }
            timer = setTimeout(() => { void tick(); }, SCAN_INTERVAL_MS);
        };

        void navigator.mediaDevices.getUserMedia({
            audio: false,
            video: { facingMode: { ideal: "environment" }, width: { ideal: 1280 }, height: { ideal: 720 } },
        }).then(async startedStream => {
            if (disposed) {
                startedStream.getTracks().forEach(track => track.stop());
                return;
            }
            stream = startedStream;
            video.srcObject = startedStream;
            await video.play();
            if (disposed) return;
            setError(null);
            setStatus("scanning");
            void tick();
        }).catch((cause: unknown) => {
            release();
            if (!disposed) setError(cameraErrorMessage(cause));
        });

        return () => {
            disposed = true;
            release();
            video.remove();
            setStatus("starting");
        };
    }, [active, cameraUnavailable, restart]);

    if (!active) return null;

    return (
        <div className="flex flex-col gap-2">
            <div ref={containerRef} />
            {!cameraUnavailable && !error && <p role="status" className="text-sm">
                {status === "starting" ? "Démarrage de la caméra…" : "Vise le code-barres avec la caméra."}
            </p>}
            {(cameraUnavailable || error) && <Message severity="warn"
                text={cameraUnavailable
                    ? "Caméra indisponible : utilise HTTPS (ou localhost), ou saisis le code à la main."
                    : error ?? ""} />}
            {!cameraUnavailable && error && <Button type="button" outlined
                label="Réessayer la caméra" icon="pi pi-refresh" onClick={() => {
                    setError(null);
                    setRestart(value => value + 1);
                }} />}
            {onCancel && <Button type="button" outlined severity="secondary" label="Arrêter la caméra"
                icon="pi pi-times" onClick={onCancel} />}
        </div>
    );
}

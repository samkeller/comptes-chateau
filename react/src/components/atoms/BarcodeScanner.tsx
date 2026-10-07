import { useEffect, useRef, useState } from "react";
import { BrowserMultiFormatReader, type IScannerControls } from "@zxing/browser";
import { BarcodeFormat, DecodeHintType } from "@zxing/library";
import { Message } from "primereact/message";
import { Button } from "primereact/button";

interface BarcodeScannerProps {
    onDetected: (code: string) => void;
    active: boolean;
}

export default function BarcodeScanner({ onDetected, active }: BarcodeScannerProps) {
    const containerRef = useRef<HTMLDivElement>(null);
    const onDetectedRef = useRef(onDetected);
    const lastDetection = useRef({ code: "", timestamp: 0 });
    const [error, setError] = useState<string | null>(null);
    const [restart, setRestart] = useState(0);
    const cameraUnavailable = !window.isSecureContext || !navigator.mediaDevices?.getUserMedia;

    useEffect(() => { onDetectedRef.current = onDetected; }, [onDetected]);

    useEffect(() => {
        if (!active) return;
        if (cameraUnavailable) return;
        let disposed = false;
        let detected = false;
        let controls: IScannerControls | undefined;
        // Un élément propre à chaque montage évite qu'un démarrage tardif écrase le flux suivant.
        const video = document.createElement("video");
        video.playsInline = true;
        video.muted = true;
        video.className = "w-full max-h-64 rounded-lg object-cover";
        video.setAttribute("aria-label", "Caméra de scan du code-barres");
        containerRef.current?.appendChild(video);

        const stop = (): void => {
            controls?.stop();
            const stream = video.srcObject;
            if (stream instanceof MediaStream) stream.getTracks().forEach(track => track.stop());
            video.srcObject = null;
        };
        const hints = new Map<DecodeHintType, BarcodeFormat[]>();
        hints.set(DecodeHintType.POSSIBLE_FORMATS, [
            BarcodeFormat.EAN_13, BarcodeFormat.EAN_8, BarcodeFormat.UPC_A, BarcodeFormat.UPC_E,
        ]);
        const reader = new BrowserMultiFormatReader(hints);
        void reader.decodeFromConstraints(
            { audio: false, video: { facingMode: "environment" } },
            video,
            (result, _error, scannerControls) => {
                if (disposed || detected || !result) return;
                const code = result.getText();
                const timestamp = Date.now();
                if (lastDetection.current.code === code && timestamp - lastDetection.current.timestamp < 2000) return;
                lastDetection.current = { code, timestamp };
                detected = true;
                scannerControls.stop();
                onDetectedRef.current(code);
            }
        ).then(startedControls => {
            controls = startedControls;
            if (disposed || detected) stop();
            else setError(null);
        }).catch((cause: unknown) => {
            stop();
            if (disposed) return;
            const name = cause instanceof Error ? cause.name : "";
            setError(name === "NotAllowedError" || name === "SecurityError"
                ? "Accès à la caméra refusé. Autorise-le dans le navigateur ou saisis le code à la main."
                : name === "NotFoundError" || name === "OverconstrainedError"
                    ? "Aucune caméra disponible. Saisis le code à la main."
                    : "Impossible de démarrer la caméra. Saisis le code à la main.");
        });

        return () => {
            disposed = true;
            stop();
            video.remove();
        };
    }, [active, cameraUnavailable, restart]);

    return (
        <div className="flex flex-col gap-2">
            <div ref={containerRef} />
            {active && (cameraUnavailable || error) && <Message severity="warn"
                text={cameraUnavailable
                    ? "Caméra indisponible : utilise HTTPS (ou localhost), ou saisis le code à la main."
                    : error ?? ""} />}
            {active && !cameraUnavailable && error && <Button type="button" outlined
                label="Réessayer la caméra" icon="pi pi-refresh" onClick={() => {
                    setError(null);
                    setRestart(value => value + 1);
                }} />}
        </div>
    );
}

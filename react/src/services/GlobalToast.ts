import type { ToastMessage } from "primereact/toast";

export type GlobalToastMessage = Pick<
    ToastMessage,
    "severity" | "summary" | "detail" | "life"
>;

type GlobalToastHandler = (message: GlobalToastMessage) => void;

let globalToastHandler: GlobalToastHandler | null = null;

export function setGlobalToastHandler(handler: GlobalToastHandler | null): void {
    globalToastHandler = handler;
}

export function showGlobalToast(message: GlobalToastMessage): void {
    globalToastHandler?.(message);
}

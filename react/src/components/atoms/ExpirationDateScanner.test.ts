import { Children, type ChangeEvent, type ReactElement, type ReactNode } from "react";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { ExpirationDateScanner } from "./ExpirationDateScanner";

const { useRef, useState, useEffect, toast } = vi.hoisted(() => ({
    useRef: vi.fn(),
    useState: vi.fn(),
    useEffect: vi.fn(),
    toast: vi.fn(),
}));

vi.mock("react", async (importOriginal) => ({
    ...await importOriginal<typeof import("react")>(),
    useRef, useState, useEffect,
}));
vi.mock("../../services/GlobalToast", () => ({ showGlobalToast: toast }));

class FakeWorker {
    onmessage: ((event: MessageEvent) => void) | null = null;
    onerror: (() => void) | null = null;
    postMessage = vi.fn();
    terminate = vi.fn();
    constructor() { workers.push(this); }
}

let workers: FakeWorker[];
const onDetected = vi.fn();
const onManualEntry = vi.fn();

beforeEach(() => {
    vi.useFakeTimers();
    vi.clearAllMocks();
    workers = [];
    useRef.mockImplementation((initial: unknown) => ({ current: initial }));
    useState.mockImplementation((initial: unknown) => [initial, vi.fn()]);
    vi.stubGlobal("Worker", FakeWorker);
});

afterEach(() => {
    vi.unstubAllGlobals();
    vi.useRealTimers();
});

function render(disabled = false): {
    selectPhoto: (file: File) => void;
    enterManually: () => void;
    unmount: () => void;
} {
    const element = ExpirationDateScanner({ onDetected, onManualEntry, disabled });
    const children = Children.toArray((element as ReactElement<{ children: ReactNode }>).props.children);
    const input = children[0] as ReactElement<{ onChange: (event: ChangeEvent<HTMLInputElement>) => void }>;
    const buttons = children[1] as ReactElement<{ children: ReactNode }>;
    const manualButton = Children.toArray(buttons.props.children)[1] as ReactElement<{ onClick: () => void }>;
    const mountEffect = useEffect.mock.calls[0][0] as () => () => void;
    return {
        selectPhoto: (file: File): void => {
            input.props.onChange({ target: { files: [file], value: "photo.png" } } as unknown as ChangeEvent<HTMLInputElement>);
        },
        enterManually: manualButton.props.onClick,
        unmount: mountEffect(),
    };
}

const photo = (): File => new File(["photo"], "photo.png", { type: "image/png" });
const expectedToast = { severity: "warn", summary: "Date non reconnue, saisis-la à la main" };

describe("ExpirationDateScanner event lifecycle", () => {
    it("starts OCR only after a photo is selected", () => {
        const scanner = render();
        expect(workers).toHaveLength(0);
        scanner.selectPhoto(photo());
        expect(workers).toHaveLength(1);
        expect(workers[0].postMessage).toHaveBeenCalledOnce();
        scanner.unmount();
    });

    it.each([{ text: "aucune date" }, { error: true }])("toasts and requests Calendar focus for %j", (result) => {
        const scanner = render();
        scanner.selectPhoto(photo());
        workers[0].onmessage?.({ data: result } as MessageEvent);
        expect(toast).toHaveBeenCalledWith(expectedToast);
        expect(onManualEntry).toHaveBeenCalledOnce();
        expect(onDetected).not.toHaveBeenCalled();
        expect(workers[0].terminate).toHaveBeenCalledOnce();
    });

    it("toasts and requests Calendar focus after a worker error", () => {
        const scanner = render();
        scanner.selectPhoto(photo());
        workers[0].onerror?.();
        expect(toast).toHaveBeenCalledWith(expectedToast);
        expect(onManualEntry).toHaveBeenCalledOnce();
        expect(workers[0].terminate).toHaveBeenCalledOnce();
    });

    it("times out stalled initialization and requests manual entry", () => {
        const scanner = render();
        scanner.selectPhoto(photo());
        vi.advanceTimersByTime(90_000);
        expect(toast).toHaveBeenCalledWith(expectedToast);
        expect(onManualEntry).toHaveBeenCalledOnce();
        expect(workers[0].terminate).toHaveBeenCalledOnce();
    });

    it("returns a recognized date without the fallback toast", () => {
        vi.setSystemTime(new Date(2026, 9, 7));
        const scanner = render();
        scanner.selectPhoto(photo());
        workers[0].onmessage?.({ data: { text: "DLC 31/12/2026" } } as MessageEvent);
        expect(onDetected).toHaveBeenCalledWith(new Date(2026, 11, 31));
        expect(onManualEntry).not.toHaveBeenCalled();
        expect(toast).not.toHaveBeenCalled();
        expect(workers[0].terminate).toHaveBeenCalledOnce();
    });

    it("rejects an oversized image before starting a worker", () => {
        const scanner = render();
        scanner.selectPhoto({ type: "image/png", size: 10 * 1024 * 1024 + 1 } as File);
        expect(workers).toHaveLength(0);
        expect(toast).toHaveBeenCalledWith(expectedToast);
        expect(onManualEntry).toHaveBeenCalledOnce();
    });

    it("does not start scanning when disabled", () => {
        render(true).selectPhoto(photo());
        expect(workers).toHaveLength(0);
        expect(onManualEntry).not.toHaveBeenCalled();
    });

    it("cancels an active scan when saving disables the component", () => {
        const refs: { current: unknown }[] = [];
        let refIndex = 0;
        useRef.mockImplementation((initial: unknown) => {
            const index = refIndex++;
            refs[index] ??= { current: initial };
            return refs[index];
        });
        render().selectPhoto(photo());
        refIndex = 0;
        render(true);
        const disabledEffect = useEffect.mock.calls[3][0] as () => void;
        disabledEffect();
        expect(workers[0].terminate).toHaveBeenCalledOnce();
        expect(workers[0].onmessage).toBeNull();
        vi.advanceTimersByTime(90_000);
        expect(onDetected).not.toHaveBeenCalled();
        expect(onManualEntry).not.toHaveBeenCalled();
        expect(toast).not.toHaveBeenCalled();
    });

    it.each(["unmount", "enterManually"] as const)("cancels pending work on %s without late timeout callbacks", (action) => {
        const scanner = render();
        scanner.selectPhoto(photo());
        scanner[action]();
        expect(workers[0].terminate).toHaveBeenCalledOnce();
        expect(workers[0].onmessage).toBeNull();
        expect(workers[0].onerror).toBeNull();
        vi.advanceTimersByTime(90_000);
        expect(toast).not.toHaveBeenCalled();
        expect(onManualEntry).toHaveBeenCalledTimes(action === "enterManually" ? 1 : 0);
    });
});

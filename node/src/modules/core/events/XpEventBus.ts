import customLog from "../../../jobs/customLog";
import type { XpRealtimeEvent } from "@chocosous/shared";

type XpEventListener = (event: XpRealtimeEvent) => void | Promise<void>;

class XpEventBus {
    private listeners = new Set<XpEventListener>();

    subscribe(listener: XpEventListener): () => void {
        this.listeners.add(listener);

        return () => {
            this.listeners.delete(listener);
        };
    }

    emit(event: XpRealtimeEvent): void {
        for (const listener of this.listeners) {
            Promise.resolve(listener(event)).catch((error: unknown) => {
                const reason = error instanceof Error ? error.message : String(error);
                customLog("ERROR", `Event listener failed: ${reason}`, "service");
            });
        }
    }

    getListenerCount(): number {
        return this.listeners.size;
    }
}

export const xpEventBus = new XpEventBus();

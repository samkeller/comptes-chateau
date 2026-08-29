import type { XpRealtimeEvent } from "@chocosous/shared";
import BaseService from "./BaseService";

type XpRealtimeListener = (event: XpRealtimeEvent) => void;

/** Vérifie qu'une donnée SSE reçue correspond bien à la structure d'un événement XP temps réel. */
function isXpRealtimeEvent(value: unknown): value is XpRealtimeEvent {
    if (!value || typeof value !== "object") {
        return false;
    }

    const candidate = value as Partial<XpRealtimeEvent>;
    return typeof candidate.eventId === "string"
        && typeof candidate.type === "string"
        && typeof candidate.userId === "number"
        && typeof candidate.occurredAt === "string";
}

class XpEventStreamService extends BaseService {
    private eventSource: EventSource | null = null;
    private listeners = new Set<XpRealtimeListener>();
    private shouldRun = false;
    private reconnectTimer: number | null = null;
    private readonly seenEventIds = new Set<string>();
    private readonly seenEventOrder: string[] = [];
    private readonly maxRememberedEvents = 200;

    start(): void {
        this.shouldRun = true;

        if (this.eventSource) {
            return;
        }

        this.openConnection();
    }

    stop(): void {
        this.shouldRun = false;
        this.clearReconnectTimer();

        if (this.eventSource) {
            this.eventSource.close();
            this.eventSource = null;
        }
    }

    subscribe(listener: XpRealtimeListener): () => void {
        this.listeners.add(listener);

        return () => {
            this.listeners.delete(listener);
        };
    }

    private openConnection(): void {
        // Dedicated SSE stream for XP updates, independent from regular HTTP responses.
        const streamUrl = this.eventsApi + `/stream`;

        this.eventSource = new EventSource(streamUrl, { withCredentials: true });

        // The backend currently emits a single domain event: xp.updated.
        this.eventSource.addEventListener("xp.updated", (event) => {
            this.handleIncomingEvent(event);
        });

        this.eventSource.onmessage = (event) => {
            // Fallback for proxies/clients that do not preserve named event listeners.
            this.handleIncomingEvent(event);
        };

        this.eventSource.onerror = () => {
            if (!this.shouldRun) {
                return;
            }

            // Native EventSource reconnect exists, but this explicit reconnect keeps control simple.
            this.eventSource?.close();
            this.eventSource = null;
            this.scheduleReconnect();
        };
    }

    /**
     * Explicitly schedule a reconnect to avoid relying on the native EventSource behavior, which may be inconsistent across browsers and proxies.
     * This also allows us to control the reconnect timing and avoid overwhelming the server with rapid reconnect attempts.
     * @returns 
     */
    private scheduleReconnect(): void {
        if (this.reconnectTimer !== null || !this.shouldRun) {
            return;
        }

        this.reconnectTimer = window.setTimeout(() => {
            this.reconnectTimer = null;

            if (!this.shouldRun || this.eventSource) {
                return;
            }

            this.openConnection();
        }, 2000);
    }

    /**
     * Remove any scheduled reconnect timer to prevent unnecessary reconnection attempts when the service is stopped or already connected. 
     * @returns 
     */
    private clearReconnectTimer(): void {
        if (this.reconnectTimer === null) {
            return;
        }

        window.clearTimeout(this.reconnectTimer);
        this.reconnectTimer = null;
    }

    /**
     * Given a raw SSE message event, parse it and notify listeners if it's a valid XpRealtimeEvent that hasn't been seen before.
     * @param event 
     * @returns 
     */
    private handleIncomingEvent(event: MessageEvent<string>): void {
        try {
            const parsed: unknown = JSON.parse(event.data);

            if (!isXpRealtimeEvent(parsed)) {
                return;
            }

            if (this.seenEventIds.has(parsed.eventId)) {
                return;
            }

            this.rememberEventId(parsed.eventId);

            for (const listener of this.listeners) {
                listener(parsed);
            }
        } catch {
            // Ignore malformed events to keep the stream alive.
        }
    }

    private rememberEventId(eventId: string): void {
        this.seenEventIds.add(eventId);
        this.seenEventOrder.push(eventId);

        if (this.seenEventOrder.length <= this.maxRememberedEvents) {
            return;
        }

        const removedId = this.seenEventOrder.shift();
        if (removedId) {
            this.seenEventIds.delete(removedId);
        }
    }
}

const xpEventStreamService = new XpEventStreamService();

export default xpEventStreamService;

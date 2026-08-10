export type XpRealtimeEventType = "xp.updated";

interface XpBaseEvent {
    eventId: string;
    type: XpRealtimeEventType;
    userId: number;
    occurredAt: string;
}

export interface XpUpdatedEvent extends XpBaseEvent {
    type: "xp.updated";
    gainedXp: number;
    previousTotalXp: number;
    newTotalXp: number;
}

export type XpRealtimeEvent = XpUpdatedEvent;

export function isXpRealtimeEvent(value: unknown): value is XpRealtimeEvent {
    if (!value || typeof value !== "object") {
        return false;
    }

    const candidate = value as Partial<XpRealtimeEvent>;
    return typeof candidate.eventId === "string"
        && typeof candidate.type === "string"
        && typeof candidate.userId === "number"
        && typeof candidate.occurredAt === "string";
}

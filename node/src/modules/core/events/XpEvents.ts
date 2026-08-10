export type XpEventType = "xp.updated";

interface XpBaseEvent {
    eventId: string;
    type: XpEventType;
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

export type XpEventType = "xp.updated";

interface XpBaseEvent {
    eventId: string;
    type: XpEventType;
    userId: number;
    occurredAt: string;
}

/** Événement temps réel émis lorsque l'XP d'un utilisateur est mise à jour. */
export interface XpUpdatedEvent extends XpBaseEvent {
    type: "xp.updated";
    gainedXp: number;
    previousTotalXp: number;
    newTotalXp: number;
}

export type XpRealtimeEvent = XpUpdatedEvent;

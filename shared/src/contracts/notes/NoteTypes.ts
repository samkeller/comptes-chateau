export const NOTE_TYPES = ["text", "checklist"] as const;

export type NoteType = typeof NOTE_TYPES[number];

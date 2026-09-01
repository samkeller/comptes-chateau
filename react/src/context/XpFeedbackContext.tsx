import type { XpRealtimeEvent } from "@chocosous/shared";
import xpEventStreamService from "@/services/XpEventStreamService";
import { createContext, ReactNode, useCallback, useContext, useEffect, useMemo, useRef, useState } from "react";
import { useConnectedUser } from "./ConnectedUserContext";
import { didLevelUp } from "@/utils/levelProgress";

interface XpFeedbackContextValue {
    pulseKey: number;
    pulseType: "gain" | "level-up" | null;
    lastGainedXp: number | null;
    previousTotalXp: number | null;
}

const XpFeedbackContext = createContext<XpFeedbackContextValue | null>(null);

export function XpFeedbackProvider({ children }: { children: ReactNode }) {
    const { connectedUser, refreshUser, setUserTotalXp } = useConnectedUser();
    const connectedUserRef = useRef(connectedUser);
    const refreshTimerRef = useRef<number | null>(null);
    const gainedXpResetTimerRef = useRef<number | null>(null);
    const pulseResetTimerRef = useRef<number | null>(null);

    const [pulseKey, setPulseKey] = useState(0);
    const [pulseType, setPulseType] = useState<"gain" | "level-up" | null>(null);
    const [lastGainedXp, setLastGainedXp] = useState<number | null>(null);
    const [previousTotalXp, setPreviousTotalXp] = useState<number | null>(null);

    useEffect(() => {
        connectedUserRef.current = connectedUser;
    }, [connectedUser]);

    const triggerPulse = useCallback((nextPulseType: "gain" | "level-up") => {
        setPulseType(nextPulseType);
        setPulseKey((currentKey) => currentKey + 1);

        if (pulseResetTimerRef.current !== null) {
            window.clearTimeout(pulseResetTimerRef.current);
        }

        pulseResetTimerRef.current = window.setTimeout(() => {
            setPulseType(null);
            pulseResetTimerRef.current = null;
        }, nextPulseType === "level-up" ? 1200 : 700);
    }, []);

    const scheduleRefresh = useCallback(() => {
        if (refreshTimerRef.current !== null) {
            window.clearTimeout(refreshTimerRef.current);
        }

        refreshTimerRef.current = window.setTimeout(() => {
            refreshUser().catch(() => undefined);
            refreshTimerRef.current = null;
        }, 1200);
    }, [refreshUser]);

    const onRealtimeEvent = useCallback((event: XpRealtimeEvent) => {
        const currentUser = connectedUserRef.current;

        if (!currentUser || currentUser.id !== event.userId) {
            return;
        }

        const shouldHighlightLevelUp = didLevelUp(event.previousTotalXp, event.newTotalXp);

        setUserTotalXp(event.newTotalXp);
        setPreviousTotalXp(event.previousTotalXp);
        setLastGainedXp(event.gainedXp);

        if (gainedXpResetTimerRef.current !== null) {
            window.clearTimeout(gainedXpResetTimerRef.current);
        }

        gainedXpResetTimerRef.current = window.setTimeout(() => {
            setLastGainedXp((current) => (current === event.gainedXp ? null : current));
            gainedXpResetTimerRef.current = null;
        }, 2000);

        triggerPulse(shouldHighlightLevelUp ? "level-up" : "gain");
        scheduleRefresh();
    }, [scheduleRefresh, setUserTotalXp, triggerPulse]);

    useEffect(() => {
        if (!connectedUser?.id) {
            // No authenticated user => no stream.
            xpEventStreamService.stop();
            return;
        }

        // One app-wide SSE subscription feeding the XP UI state.
        xpEventStreamService.start();
        const unsubscribe = xpEventStreamService.subscribe(onRealtimeEvent);

        return () => {
            // Cleanup subscription/timers to avoid leaking listeners in StrictMode.
            unsubscribe();
            xpEventStreamService.stop();

            if (refreshTimerRef.current !== null) {
                window.clearTimeout(refreshTimerRef.current);
                refreshTimerRef.current = null;
            }

            if (gainedXpResetTimerRef.current !== null) {
                window.clearTimeout(gainedXpResetTimerRef.current);
                gainedXpResetTimerRef.current = null;
            }

            if (pulseResetTimerRef.current !== null) {
                window.clearTimeout(pulseResetTimerRef.current);
                pulseResetTimerRef.current = null;
            }
        };
    }, [connectedUser?.id, onRealtimeEvent]);

    const value = useMemo<XpFeedbackContextValue>(() => {
        return {
            pulseKey,
            pulseType,
            lastGainedXp,
            previousTotalXp,
        };
    }, [lastGainedXp, previousTotalXp, pulseKey, pulseType]);

    return (
        <XpFeedbackContext.Provider value={value}>
            {children}
        </XpFeedbackContext.Provider>
    );
}

export function useXpFeedbackPulse(): XpFeedbackContextValue {
    const context = useContext(XpFeedbackContext);

    if (!context) {
        throw new Error("useXpFeedbackPulse must be used within XpFeedbackProvider");
    }

    return context;
}

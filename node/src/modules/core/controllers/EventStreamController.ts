import { Request, Response, Router } from "express";
import { xpEventBus } from "../events/XpEventBus";
import type { XpRealtimeEvent } from "@chocosous/shared";
import customLog from "../../../jobs/customLog";

const EventStreamRoutes = Router();

// SSE heartbeat to keep intermediaries/proxies from closing idle connections.
const HEARTBEAT_MS = 25000;

let activeConnections = 0;

// SSE frame format: id + event + data followed by a blank line.
function writeSseEvent(res: Response, event: XpRealtimeEvent): void {
    res.write(`id: ${event.eventId}\n`);
    res.write(`event: ${event.type}\n`);
    res.write(`data: ${JSON.stringify(event)}\n\n`);
}

EventStreamRoutes.get("/stream", (req: Request, res: Response) => {
    // Stream is session-protected: one stream only receives events for its own userId.
    const userId = req.session?.userId;

    if (typeof userId !== "number") {
        res.sendStatus(401);
        return;
    }

    res.status(200);
    res.setHeader("Content-Type", "text/event-stream");
    res.setHeader("Cache-Control", "no-cache, no-transform");
    res.setHeader("Connection", "keep-alive");
    res.setHeader("X-Accel-Buffering", "no");
    res.flushHeaders();

    activeConnections += 1;
    customLog("INFO", `SSE connected for user ${userId}. Active streams: ${activeConnections}`, "controller");

    const unsubscribe = xpEventBus.subscribe((event) => {
        // Filter events by user to avoid leaking another user's activity.
        if (event.userId !== userId) {
            return;
        }

        writeSseEvent(res, event);
    });

    const heartbeat = setInterval(() => {
        // SSE comments start with ':' and are ignored by clients but keep the pipe active.
        res.write(`: heartbeat ${Date.now()}\n\n`);
    }, HEARTBEAT_MS);

    req.on("close", () => {
        // Always cleanup listener + timer to prevent memory leaks.
        clearInterval(heartbeat);
        unsubscribe();

        activeConnections = Math.max(0, activeConnections - 1);
        customLog("INFO", `SSE disconnected for user ${userId}. Active streams: ${activeConnections}`, "controller");
    });
});

export default EventStreamRoutes;

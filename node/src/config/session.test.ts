import { describe, expect, it } from "vitest";
import { LoginSchema } from "@chocosous/shared";
import { getSessionDurationMs } from "./session";

describe("getSessionDurationMs", () => {
    it("keeps the default session duration when the device is not remembered", () => {
        expect(getSessionDurationMs(false)).toBe(24 * 60 * 60 * 1000);
    });

    it("extends the session to 60 days when the device is remembered", () => {
        expect(getSessionDurationMs(true)).toBe(60 * 24 * 60 * 60 * 1000);
    });
});

describe("LoginSchema rememberDevice", () => {
    const credentials = { username: "Gaelle", password: "secret" };

    it("defaults to a non-persistent session", () => {
        expect(LoginSchema.parse(credentials).rememberDevice).toBe(false);
    });

    it("accepts only a boolean remember-device choice", () => {
        expect(LoginSchema.parse({ ...credentials, rememberDevice: true }).rememberDevice).toBe(true);
        expect(LoginSchema.safeParse({ ...credentials, rememberDevice: "true" }).success).toBe(false);
    });
});
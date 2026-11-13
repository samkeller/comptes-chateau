import { readFileSync } from "node:fs";
import { createRequire } from "node:module";
import path from "node:path";
import { runInNewContext } from "node:vm";
import { describe, expect, it, vi } from "vitest";

const require = createRequire(import.meta.url);
const configSource = readFileSync(
    path.join(path.dirname(require.resolve("@chocosous/shared")), "config.js"),
    "utf8",
);

describe("Configuration partagee dans les environnements front et back", () => {
    it("se charge sans process et conserve les logs info dans le navigateur", () => {
        const browserConsole = { info: vi.fn(), debug: vi.fn() };
        const context = { exports: {}, console: browserConsole };

        runInNewContext(`${configSource}\nTestLogger.info("info"); TestLogger.debug("debug");`, context);

        expect(context.exports).toMatchObject({ TEST_LOG_LEVEL: "info" });
        expect(browserConsole.info).toHaveBeenCalledWith("info");
        expect(browserConsole.debug).not.toHaveBeenCalled();
    });

    it("respecte TEST_LOG_LEVEL dans Node", () => {
        const nodeConsole = { info: vi.fn(), warn: vi.fn() };
        const context = {
            exports: {},
            console: nodeConsole,
            process: { env: { TEST_LOG_LEVEL: "warn" } },
        };

        runInNewContext(`${configSource}\nTestLogger.info("info"); TestLogger.warn("warn");`, context);

        expect(context.exports).toMatchObject({ TEST_LOG_LEVEL: "warn" });
        expect(nodeConsole.info).not.toHaveBeenCalled();
        expect(nodeConsole.warn).toHaveBeenCalledWith("warn");
    });

    it("utilise info dans Node lorsque TEST_LOG_LEVEL est absent", () => {
        const context = { exports: {}, process: { env: {} } };

        runInNewContext(configSource, context);

        expect(context.exports).toMatchObject({ TEST_LOG_LEVEL: "info" });
    });
});

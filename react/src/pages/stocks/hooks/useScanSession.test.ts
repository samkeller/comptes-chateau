import { describe, expect, it } from "vitest";
import { isSafeImageUrl } from "./useScanSession";

describe("stock scan image URLs", () => {
    it.each(["", "https://example.org/image.jpg", "http://example.org/image.jpg"])(
        "accepts an optional web URL: %s", value => {
            expect(isSafeImageUrl(value)).toBe(true);
        }
    );
    it.each(["not a URL", "javascript:alert(1)", "data:image/svg+xml,test", "file:///tmp/image.jpg"])(
        "rejects unsupported URLs: %s", value => {
            expect(isSafeImageUrl(value)).toBe(false);
        }
    );
});

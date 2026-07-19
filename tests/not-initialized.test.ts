import { ai } from "@/index";
import { describe, expect, it } from "vitest";

describe("ai when ai.init has not been called yet", () => {
    it("throws a descriptive error", async () => {
        await expect(ai.dialog.generate("Say hello.")).rejects.toThrow(/has not been initialized/);
    });
});

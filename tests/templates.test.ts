import { ai } from "@/index";
import { setAIState } from "@/init/AIState";
import type AIProvider from "@/types/AIProvider";
import { afterEach, describe, expect, it, vi } from "vitest";

describe("ai.templates", () => {
    const originalDialog = ai.templates.dialog;

    afterEach(() => {
        ai.templates.dialog = originalDialog;
    });

    it("is used when building the prompt sent by ai.dialog.generate", async () => {
        ai.templates.dialog = { instructions: "Be extremely terse." };

        const generateText = vi.fn().mockResolvedValue("ok");
        const provider: AIProvider = { name: "mock-provider", dialog: { generateText } };
        setAIState(provider);

        await ai.dialog.generate("Say hello.");

        const prompt = generateText.mock.calls[0][0];
        expect(prompt).toContain("Be extremely terse.");
    });
});

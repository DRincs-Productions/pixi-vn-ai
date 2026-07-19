import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";

const providerMock = vi.hoisted(() => ({
    Provider: {
        init: vi.fn(),
        generateText: vi.fn(),
        generateImage: vi.fn(),
    },
}));
vi.mock("@/providers", () => providerMock);

const { ai } = await import("@/index");

describe("ai.templates", () => {
    const originalDialog = ai.templates.dialog;

    afterEach(() => {
        ai.templates.dialog = originalDialog;
    });

    beforeEach(() => {
        vi.clearAllMocks();
        providerMock.Provider.generateText.mockResolvedValue("ok");
    });

    it("is used when building the prompt sent by ai.text.generateDialog", async () => {
        ai.templates.dialog = { instructions: "Be extremely terse." };

        await ai.text.generateDialog("Say hello.");

        const prompt = providerMock.Provider.generateText.mock.calls[0][0];
        expect(prompt).toContain("Be extremely terse.");
    });
});

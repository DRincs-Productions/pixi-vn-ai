import { describe, expect, it, vi } from "vitest";

const webllmMock = vi.hoisted(() => ({
    CreateMLCEngine: vi.fn(),
}));
vi.mock("@mlc-ai/web-llm", () => webllmMock);

const { ai } = await import("@/index");

describe("ai.text.generateDialog without ever calling ai.init", () => {
    it("falls back to a local WebLLM engine", async () => {
        const engine = {
            chat: {
                completions: {
                    create: vi.fn().mockResolvedValue({
                        choices: [{ message: { content: "Local reply." } }],
                    }),
                },
            },
        };
        webllmMock.CreateMLCEngine.mockResolvedValue(engine);

        const result = await ai.text.generateDialog("Say hello.");

        expect(webllmMock.CreateMLCEngine).toHaveBeenCalledWith("SmolLM2-360M-Instruct-q4f16_1-MLC");
        expect(result).toBe("Local reply.");
    });
});

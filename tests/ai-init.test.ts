import { beforeEach, describe, expect, it, vi } from "vitest";

const aiSdkMock = vi.hoisted(() => ({
    generateText: vi.fn(),
    generateImage: vi.fn(),
}));
vi.mock("ai", () => aiSdkMock);

const webllmMock = vi.hoisted(() => ({
    CreateMLCEngine: vi.fn(),
}));
vi.mock("@mlc-ai/web-llm", () => webllmMock);

const { ai } = await import("@/index");

describe("ai.init", () => {
    beforeEach(() => {
        vi.clearAllMocks();
    });

    it("configures an AI SDK provider when textProvider is given, without touching WebLLM", async () => {
        aiSdkMock.generateText.mockResolvedValue({ text: "Hello there." });

        await ai.init({ textProvider: "mock-model" as never });

        expect(webllmMock.CreateMLCEngine).not.toHaveBeenCalled();
        const result = await ai.text.generateDialog("Say hello.");
        expect(result).toBe("Hello there.");
        expect(aiSdkMock.generateText).toHaveBeenCalledWith(
            expect.objectContaining({ model: "mock-model" }),
        );
    });

    it("falls back to a local WebLLM engine when no provider is given", async () => {
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

        await ai.init();
        const result = await ai.text.generateDialog("Say hello.");

        expect(webllmMock.CreateMLCEngine).toHaveBeenCalledWith("SmolLM2-360M-Instruct-q4f16_1-MLC");
        expect(result).toBe("Local reply.");
    });
});

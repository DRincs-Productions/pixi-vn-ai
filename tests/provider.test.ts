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

const { Provider } = await import("@/providers");

describe("Provider.generateText", () => {
    beforeEach(() => {
        vi.clearAllMocks();
        Provider.providers.textProvider = undefined;
        Provider.providers.imageProvider = undefined;
    });

    it("uses the AI SDK model when textProvider is set", async () => {
        Provider.providers.textProvider = "mock-model" as never;
        aiSdkMock.generateText.mockResolvedValue({ text: "Hello." });

        const result = await Provider.generateText("Say hello.");

        expect(result).toBe("Hello.");
        expect(aiSdkMock.generateText).toHaveBeenCalledWith({
            model: "mock-model",
            prompt: "Say hello.",
        });
        expect(webllmMock.CreateMLCEngine).not.toHaveBeenCalled();
    });

    it("falls back to a local WebLLM engine when textProvider is not set", async () => {
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

        const result = await Provider.generateText("Say hello.");

        expect(result).toBe("Local reply.");
        expect(webllmMock.CreateMLCEngine).toHaveBeenCalledWith("SmolLM2-360M-Instruct-q4f16_1-MLC");
    });
});

describe("Provider.generateImage", () => {
    beforeEach(() => {
        vi.clearAllMocks();
        Provider.providers.textProvider = undefined;
        Provider.providers.imageProvider = undefined;
    });

    it("uses the AI SDK image model when imageProvider is set and no reference image is given", async () => {
        Provider.providers.imageProvider = "mock-image-model" as never;
        aiSdkMock.generateImage.mockResolvedValue({
            image: { base64: "abc", mediaType: "image/png" },
        });

        const result = await Provider.generateImage("Draw a garden.");

        expect(result).toBe("data:image/png;base64,abc");
        expect(aiSdkMock.generateImage).toHaveBeenCalledWith({
            model: "mock-image-model",
            prompt: "Draw a garden.",
        });
    });

    it("uses the multimodal textProvider when a reference image is given", async () => {
        Provider.providers.textProvider = "mock-model" as never;
        Provider.providers.imageProvider = "mock-image-model" as never;
        aiSdkMock.generateText.mockResolvedValue({
            files: [{ base64: "def", mediaType: "image/jpeg" }],
        });

        const result = await Provider.generateImage("Draw a garden.", "ref.png");

        expect(result).toBe("data:image/jpeg;base64,def");
        expect(aiSdkMock.generateText).toHaveBeenCalled();
        expect(aiSdkMock.generateImage).not.toHaveBeenCalled();
    });

    it("falls back to text-to-image via textProvider when imageProvider is not set", async () => {
        Provider.providers.textProvider = "mock-model" as never;
        aiSdkMock.generateText.mockResolvedValue({
            files: [{ base64: "ghi", mediaType: "image/png" }],
        });

        const result = await Provider.generateImage("Draw a garden.");

        expect(result).toBe("data:image/png;base64,ghi");
    });

    it("throws when the model did not return an image", async () => {
        Provider.providers.textProvider = "mock-model" as never;
        aiSdkMock.generateText.mockResolvedValue({ files: [] });

        await expect(Provider.generateImage("Draw a garden.")).rejects.toThrow(
            /did not return an image/,
        );
    });

    it("throws when neither provider is set", async () => {
        await expect(Provider.generateImage("Draw a garden.")).rejects.toThrow(
            /does not support image generation/,
        );
    });
});

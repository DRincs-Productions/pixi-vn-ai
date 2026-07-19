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

describe("Provider.init", () => {
    beforeEach(() => {
        Provider.providers.textProvider = undefined;
        Provider.providers.imageProvider = undefined;
    });

    it("sets providers.textProvider and providers.imageProvider from the given options", async () => {
        await Provider.init({
            textProvider: "mock-model" as never,
            imageProvider: "mock-image-model" as never,
        });
        expect(Provider.providers.textProvider).toBe("mock-model");
        expect(Provider.providers.imageProvider).toBe("mock-image-model");
    });

    it("clears providers when called again with no options", async () => {
        await Provider.init({ textProvider: "mock-model" as never });
        expect(Provider.providers.textProvider).toBe("mock-model");

        await Provider.init();
        expect(Provider.providers.textProvider).toBeUndefined();
        expect(Provider.providers.imageProvider).toBeUndefined();
    });

    it("clears imageProvider when only textProvider is given on a later call", async () => {
        await Provider.init({ imageProvider: "mock-image-model" as never });
        expect(Provider.providers.imageProvider).toBe("mock-image-model");

        await Provider.init({ textProvider: "mock-model" as never });
        expect(Provider.providers.textProvider).toBe("mock-model");
        expect(Provider.providers.imageProvider).toBeUndefined();
    });
});

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

    it("falls back to a local WebLLM engine when textProvider is not set, caching it across calls", async () => {
        const create = vi
            .fn()
            .mockResolvedValueOnce({ choices: [{ message: { content: "Local reply." } }] })
            .mockResolvedValueOnce({ choices: [] });
        webllmMock.CreateMLCEngine.mockResolvedValue({ chat: { completions: { create } } });

        const first = await Provider.generateText("Say hello.");
        const second = await Provider.generateText("Say hello again.");

        expect(first).toBe("Local reply.");
        expect(second).toBe(""); // no message content: falls back to an empty string
        expect(webllmMock.CreateMLCEngine).toHaveBeenCalledTimes(1);
        expect(webllmMock.CreateMLCEngine).toHaveBeenCalledWith("SmolLM2-360M-Instruct-q4f16_1-MLC");
        expect(create).toHaveBeenCalledTimes(2);
        expect(create).toHaveBeenCalledWith({
            messages: [{ role: "user", content: "Say hello." }],
            stream: false,
        });
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

    it("uses the multimodal textProvider when a reference image is given, sending it as an image content part", async () => {
        Provider.providers.textProvider = "mock-model" as never;
        Provider.providers.imageProvider = "mock-image-model" as never;
        aiSdkMock.generateText.mockResolvedValue({
            files: [{ base64: "def", mediaType: "image/jpeg" }],
        });

        const result = await Provider.generateImage("Draw a garden.", "ref.png");

        expect(result).toBe("data:image/jpeg;base64,def");
        expect(aiSdkMock.generateText).toHaveBeenCalledWith({
            model: "mock-model",
            messages: [
                {
                    role: "user",
                    content: [
                        { type: "text", text: "Draw a garden." },
                        { type: "image", image: "ref.png" },
                    ],
                },
            ],
        });
        expect(aiSdkMock.generateImage).not.toHaveBeenCalled();
    });

    it("ignores the reference image when only imageProvider is set (no textProvider for the multimodal path)", async () => {
        Provider.providers.imageProvider = "mock-image-model" as never;
        aiSdkMock.generateImage.mockResolvedValue({
            image: { base64: "abc", mediaType: "image/png" },
        });

        const result = await Provider.generateImage("Draw a garden.", "ref.png");

        expect(result).toBe("data:image/png;base64,abc");
        expect(aiSdkMock.generateImage).toHaveBeenCalledWith({
            model: "mock-image-model",
            prompt: "Draw a garden.",
        });
        expect(aiSdkMock.generateText).not.toHaveBeenCalled();
    });

    it("falls back to text-to-image via textProvider when imageProvider is not set", async () => {
        Provider.providers.textProvider = "mock-model" as never;
        aiSdkMock.generateText.mockResolvedValue({
            files: [{ base64: "ghi", mediaType: "image/png" }],
        });

        const result = await Provider.generateImage("Draw a garden.");

        expect(result).toBe("data:image/png;base64,ghi");
        expect(aiSdkMock.generateText).toHaveBeenCalledWith({
            model: "mock-model",
            prompt: "Draw a garden.",
        });
    });

    it("throws when the multimodal reference-image call does not return an image", async () => {
        Provider.providers.textProvider = "mock-model" as never;
        aiSdkMock.generateText.mockResolvedValue({ files: [] });

        await expect(Provider.generateImage("Draw a garden.", "ref.png")).rejects.toThrow(
            /did not return an image/,
        );
    });

    it("throws when the text-to-image fallback does not return an image", async () => {
        Provider.providers.textProvider = "mock-model" as never;
        aiSdkMock.generateText.mockResolvedValue({ files: [] });

        await expect(Provider.generateImage("Draw a garden.")).rejects.toThrow(
            /did not return an image/,
        );
    });

    it("throws a descriptive error when neither provider is set", async () => {
        await expect(Provider.generateImage("Draw a garden.")).rejects.toThrow(
            /does not support image generation/,
        );
        expect(aiSdkMock.generateText).not.toHaveBeenCalled();
        expect(aiSdkMock.generateImage).not.toHaveBeenCalled();
    });
});

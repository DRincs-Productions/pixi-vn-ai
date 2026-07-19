import { beforeEach, describe, expect, it, vi } from "vitest";

const providerMock = vi.hoisted(() => ({
    Provider: {
        init: vi.fn(),
        generateText: vi.fn(),
        generateImage: vi.fn(),
    },
}));
vi.mock("@/providers", () => providerMock);

const { ai } = await import("@/index");

describe("ai.text.generateDialog", () => {
    beforeEach(() => {
        vi.clearAllMocks();
        providerMock.Provider.generateText.mockResolvedValue("The king reveals his secret.");
    });

    it("builds the prompt and forwards it to Provider.generateText", async () => {
        const result = await ai.text.generateDialog(
            "Generate a dialogue where the king reveals his secret.",
        );
        expect(result).toBe("The king reveals his secret.");
        expect(providerMock.Provider.generateText).toHaveBeenCalledTimes(1);
        const prompt = providerMock.Provider.generateText.mock.calls[0][0];
        expect(prompt).toContain("Generate a dialogue where the king reveals his secret.");
    });
});

describe("ai.image.generateBackground / ai.image.generateElement", () => {
    beforeEach(() => {
        vi.clearAllMocks();
        providerMock.Provider.generateImage.mockResolvedValue("data:image/png;base64,abc123");
    });

    it("generates a background image, forwarding the reference image and including the canvas size", async () => {
        const result = await ai.image.generateBackground("Generate the throne room at sunset.", {
            referenceImage: "ref.png",
        });
        expect(result).toBe("data:image/png;base64,abc123");
        expect(providerMock.Provider.generateImage).toHaveBeenCalledWith(expect.any(String), "ref.png");
        const prompt = providerMock.Provider.generateImage.mock.calls[0][0];
        expect(prompt).toContain("## Canvas Size");
    });

    it("generates an element image, falling back to the background image as reference and including alignment", async () => {
        const result = await ai.image.generateElement("Generate the advisor.", {
            backgroundImage: "bg.png",
            xAlign: 0.8,
            yAlign: 1,
        });
        expect(result).toBe("data:image/png;base64,abc123");
        expect(providerMock.Provider.generateImage).toHaveBeenCalledWith(expect.any(String), "bg.png");
        const prompt = providerMock.Provider.generateImage.mock.calls[0][0];
        expect(prompt).toContain("## Alignment");
        expect(prompt).toContain("xAlign (horizontal, from the left edge): 0.8");
        expect(prompt).toContain("yAlign (vertical, from the top edge): 1");
    });

    it("prefers the explicit reference image over the background image for an element", async () => {
        await ai.image.generateElement("Generate the advisor.", {
            referenceImage: "ref.png",
            backgroundImage: "bg.png",
        });
        expect(providerMock.Provider.generateImage).toHaveBeenCalledWith(expect.any(String), "ref.png");
    });
});

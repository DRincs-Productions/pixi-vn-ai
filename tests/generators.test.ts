import { ai } from "@/index";
import { setAIState } from "@/init/AIState";
import type AIProvider from "@/types/AIProvider";
import { beforeEach, describe, expect, it, vi } from "vitest";

describe("ai.dialog.generate", () => {
    let provider: AIProvider;

    beforeEach(() => {
        provider = {
            name: "mock-provider",
            dialog: {
                generateText: vi.fn().mockResolvedValue("The king reveals his secret."),
            },
        };
        setAIState(provider);
    });

    it("generates dialogue text using the configured provider", async () => {
        const result = await ai.dialog.generate("Generate a dialogue where the king reveals his secret.");
        expect(result).toBe("The king reveals his secret.");
        expect(provider.dialog!.generateText).toHaveBeenCalledTimes(1);
        const prompt = (provider.dialog!.generateText as ReturnType<typeof vi.fn>).mock.calls[0][0];
        expect(prompt).toContain("Generate a dialogue where the king reveals his secret.");
    });

    it("throws when the provider does not support dialog generation", async () => {
        setAIState({ name: "image-only" });
        await expect(ai.dialog.generate("Say hello.")).rejects.toThrow(
            /does not support dialog generation/,
        );
    });
});

describe("ai.image.generateBackground / ai.image.generateElement", () => {
    let provider: AIProvider;

    beforeEach(() => {
        provider = {
            name: "mock-provider",
            image: {
                generateImage: vi.fn().mockResolvedValue({ url: "https://example.com/image.png" }),
            },
        };
        setAIState(provider);
    });

    it("generates a background image, forwarding the reference image and including the canvas size", async () => {
        const result = await ai.image.generateBackground("Generate the throne room at sunset.", {
            referenceImage: "ref.png",
        });
        expect(result).toEqual({ url: "https://example.com/image.png" });
        expect(provider.image!.generateImage).toHaveBeenCalledWith(expect.any(String), "ref.png");
        const prompt = (provider.image!.generateImage as ReturnType<typeof vi.fn>).mock.calls[0][0];
        expect(prompt).toContain("## Canvas Size");
    });

    it("generates an element image, falling back to the background image as reference and including alignment", async () => {
        const result = await ai.image.generateElement("Generate the advisor.", {
            backgroundImage: "bg.png",
            xAlign: 0.8,
            yAlign: 1,
        });
        expect(result).toEqual({ url: "https://example.com/image.png" });
        expect(provider.image!.generateImage).toHaveBeenCalledWith(expect.any(String), "bg.png");
        const prompt = (provider.image!.generateImage as ReturnType<typeof vi.fn>).mock.calls[0][0];
        expect(prompt).toContain("## Alignment");
        expect(prompt).toContain("xAlign (horizontal, from the left edge): 0.8");
        expect(prompt).toContain("yAlign (vertical, from the top edge): 1");
    });

    it("prefers the explicit reference image over the background image for an element", async () => {
        await ai.image.generateElement("Generate the advisor.", {
            referenceImage: "ref.png",
            backgroundImage: "bg.png",
        });
        expect(provider.image!.generateImage).toHaveBeenCalledWith(expect.any(String), "ref.png");
    });

    it("throws when the provider does not support image generation", async () => {
        setAIState({ name: "dialog-only" });
        await expect(ai.image.generateBackground("Draw a garden.")).rejects.toThrow(
            /does not support image generation/,
        );
    });
});

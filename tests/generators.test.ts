import { ai, initAI } from "@/index";
import type AIProvider from "@/types/AIProvider";
import { beforeEach, describe, expect, it, vi } from "vitest";

describe("ai.dialog.generate / ai.image.generate", () => {
    let provider: AIProvider;

    beforeEach(() => {
        provider = {
            name: "mock-provider",
            dialog: {
                generateText: vi.fn().mockResolvedValue("The king reveals his secret."),
            },
            image: {
                generateImage: vi.fn().mockResolvedValue({ url: "https://example.com/image.png" }),
            },
        };
        initAI({ provider });
    });

    it("generates dialogue text using the configured provider", async () => {
        const result = await ai.dialog.generate("Generate a dialogue where the king reveals his secret.");
        expect(result).toBe("The king reveals his secret.");
        expect(provider.dialog!.generateText).toHaveBeenCalledTimes(1);
        const prompt = (provider.dialog!.generateText as ReturnType<typeof vi.fn>).mock.calls[0][0];
        expect(prompt).toContain("Generate a dialogue where the king reveals his secret.");
    });

    it("generates an image using the configured provider, forwarding the reference image", async () => {
        const result = await ai.image.generate("Generate the throne room at sunset.", {
            referenceImage: "ref.png",
        });
        expect(result).toEqual({ url: "https://example.com/image.png" });
        expect(provider.image!.generateImage).toHaveBeenCalledWith(expect.any(String), "ref.png");
    });

    it("throws when the provider does not support dialog generation", async () => {
        initAI({ provider: { name: "image-only", image: provider.image } });
        await expect(ai.dialog.generate("Say hello.")).rejects.toThrow(
            /does not support dialog generation/,
        );
    });

    it("throws when the provider does not support image generation", async () => {
        initAI({ provider: { name: "dialog-only", dialog: provider.dialog } });
        await expect(ai.image.generate("Draw a garden.")).rejects.toThrow(
            /does not support image generation/,
        );
    });
});

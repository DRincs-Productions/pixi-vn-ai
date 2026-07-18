import { generateImage, generateText, type ImageModel, type LanguageModel } from "ai";
import type AIProvider from "../types/AIProvider";
import type DialogProvider from "../types/DialogProvider";
import type ImageProvider from "../types/ImageProvider";

export interface AISDKProviderOptions {
    /**
     * The [AI SDK](https://ai-sdk.dev) language model used for dialogue generation, and as a
     * fallback for image generation on multimodal models (e.g. Gemini image generation).
     */
    languageModel?: LanguageModel;
    /**
     * The [AI SDK](https://ai-sdk.dev) image model used for text-to-image generation.
     */
    imageModel?: ImageModel;
}

/**
 * Provider backed by the [AI SDK](https://ai-sdk.dev), supporting OpenAI, Anthropic, Google,
 * Cloudflare, Ollama and any other AI SDK-compatible model provider.
 */
export default class AISDKProvider implements AIProvider {
    readonly name = "ai-sdk";
    readonly dialog?: DialogProvider;
    readonly image?: ImageProvider;

    constructor(private options: AISDKProviderOptions) {
        const { languageModel } = options;
        if (languageModel) {
            this.dialog = {
                generateText: async (prompt) => {
                    const result = await generateText({ model: languageModel, prompt });
                    return result.text;
                },
            };
        }

        if (options.imageModel || options.languageModel) {
            this.image = {
                generateImage: (prompt, referenceImage) =>
                    this.generateReferenceAwareImage(prompt, referenceImage),
            };
        }
    }

    private async generateReferenceAwareImage(
        prompt: string,
        referenceImage: unknown,
    ): Promise<unknown> {
        const { imageModel, languageModel } = this.options;
        const hasReferenceImage = referenceImage !== undefined && referenceImage !== null;

        if (hasReferenceImage && languageModel) {
            // generateImage() is text-to-image only: reference images need a multimodal
            // language model (e.g. Gemini image generation) driven through generateText().
            const result = await generateText({
                model: languageModel,
                messages: [
                    {
                        role: "user",
                        content: [
                            { type: "text", text: prompt },
                            { type: "image", image: referenceImage as never },
                        ],
                    },
                ],
            });
            return result.files[0] ?? result.text;
        }

        if (imageModel) {
            const result = await generateImage({ model: imageModel, prompt });
            return result.image;
        }

        if (languageModel) {
            const result = await generateText({ model: languageModel, prompt });
            return result.files[0] ?? result.text;
        }

        throw new Error("AISDKProvider: no image-capable model configured");
    }
}

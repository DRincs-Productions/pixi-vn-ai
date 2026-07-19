import { toDataUri } from "@/utils";
import { CreateMLCEngine, type MLCEngineInterface } from "@mlc-ai/web-llm";
import {
    generateImage as aiGenerateImage,
    generateText as aiGenerateText,
    type ImageModel,
    type LanguageModel,
} from "ai";

/**
 * Local model used for text generation when neither `textProvider` nor `imageProvider` is set.
 */
const DEFAULT_WEBLLM_MODEL = "SmolLM2-360M-Instruct-q4f16_1-MLC";

let webLLMEngine: Promise<MLCEngineInterface> | undefined;

/**
 * Lazily create (and cache) the local WebLLM engine, so it's only downloaded once.
 */
function getWebLLMEngine(): Promise<MLCEngineInterface> {
    webLLMEngine ??= CreateMLCEngine(DEFAULT_WEBLLM_MODEL);
    return webLLMEngine;
}

/**
 * Tracks which [AI SDK](https://ai-sdk.dev) models the developer selected via {@link Provider.init}.
 */
export namespace Provider {
    /**
     * The [AI SDK](https://ai-sdk.dev) models currently selected via {@link init}.
     */
    export const providers: {
        /**
         * Language model used for dialogue generation, and as a fallback for image generation on
         * multimodal models (e.g. Gemini image generation).
         */
        textProvider?: LanguageModel;
        /**
         * Image model used for image generation.
         */
        imageProvider?: ImageModel;
    } = {};

    /**
     * Initialize Pixi'VN AI. Call this once, typically at application startup, before using
     * `ai.text.generateDialog`, `ai.image.generateBackground` or `ai.image.generateElement`.
     * @param options The [AI SDK](https://ai-sdk.dev) models to use.
     */
    export async function init(options?: {
        /**
         * Language model used for `ai.text.generateDialog`, and as a fallback for image generation on
         * multimodal models (e.g. Gemini image generation).
         */
        textProvider?: LanguageModel;
        /**
         * Image model used for `ai.image.generateBackground` and `ai.image.generateElement`.
         */
        imageProvider?: ImageModel;
    }): Promise<void> {
        providers.textProvider = options?.textProvider;
        providers.imageProvider = options?.imageProvider;
    }

    /**
     * Generate text from a fully assembled prompt.
     *
     * Uses the [AI SDK](https://ai-sdk.dev) {@link providers.textProvider} when set, falling back
     * to a local [WebLLM](https://github.com/mlc-ai/web-llm) model otherwise.
     * @param prompt The final prompt produced by the {@link PromptBuilder}.
     * @returns The generated text.
     */
    export async function generateText(prompt: string): Promise<string> {
        const { textProvider } = providers;
        if (textProvider) {
            const result = await aiGenerateText({ model: textProvider, prompt });
            return result.text;
        }

        const engine = await getWebLLMEngine();
        const completion = await engine.chat.completions.create({
            messages: [{ role: "user", content: prompt }],
            stream: false,
        });
        return completion.choices[0]?.message?.content ?? "";
    }

    /**
     * Generate an image from a fully assembled prompt.
     *
     * Uses the [AI SDK](https://ai-sdk.dev) {@link providers.imageProvider} when set, falling back
     * to {@link providers.textProvider} on multimodal models (e.g. Gemini image generation) when
     * a reference image is given. [WebLLM](https://github.com/mlc-ai/web-llm) does not support
     * image generation, so calling this without either provider set throws.
     * @param prompt The final prompt produced by the {@link PromptBuilder}.
     * @param referenceImage Optional reference image (a URL or a data URI, e.g. the string
     *   returned by a previous call to this function), forwarded to providers that support
     *   image-to-image generation.
     * @returns The generated image, as a data URI (`data:<mediaType>;base64,<data>`), ready to
     *   use directly as a Pixi'VN image source.
     */
    export async function generateImage(prompt: string, referenceImage?: string): Promise<string> {
        const { imageProvider, textProvider } = providers;

        if (referenceImage !== undefined && textProvider) {
            // generateImage() is text-to-image only: reference images need a multimodal
            // language model (e.g. Gemini image generation) driven through generateText().
            const result = await aiGenerateText({
                model: textProvider,
                messages: [
                    {
                        role: "user",
                        content: [
                            { type: "text", text: prompt },
                            { type: "image", image: referenceImage },
                        ],
                    },
                ],
            });
            if (!result.files[0]) {
                throw new Error("Pixi'VN AI: the model did not return an image.");
            }
            return toDataUri(result.files[0]);
        }

        if (imageProvider) {
            const result = await aiGenerateImage({ model: imageProvider, prompt });
            return toDataUri(result.image);
        }

        if (textProvider) {
            const result = await aiGenerateText({ model: textProvider, prompt });
            if (!result.files[0]) {
                throw new Error("Pixi'VN AI: the model did not return an image.");
            }
            return toDataUri(result.files[0]);
        }

        throw new Error(
            "Pixi'VN AI: the local WebLLM fallback does not support image generation. Call ai.init with a textProvider or imageProvider to enable it.",
        );
    }
}

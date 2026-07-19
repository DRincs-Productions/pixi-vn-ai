import { buildPrompt } from "@/generators/GenerateEngine";
import { getAIState, setAIState } from "@/init/AIState";
import type { GenerateOptions } from "@/types";
import type AIProvider from "@/types/AIProvider";
import type Templates from "@/types/Templates";

/**
 * The small, provider-independent public API of Pixi'VN AI.
 *
 * Prompt engineering is entirely hidden: `ai.dialog.generate` and `ai.image.generate` build the
 * final prompt internally from the developer request, the configured templates, and the
 * {@link GenerateOptions} passed in (narrative history, speaker, listeners, scene, ...).
 */
export namespace ai {
    /**
     * Initialize Pixi'VN AI. Call this once, typically at application startup, before using
     * `ai.dialog.generate` or `ai.image.generate`.
     * @param options The provider (required) and templates (optional) to use.
     */
    export function init(options: {
        /**
         * The provider used by the whole library (WebLLM, an AI SDK model, or a custom provider).
         */
        provider: AIProvider;
        /**
         * Templates to override the built-in ones. Any template left out falls back to the default.
         */
        templates?: Partial<Templates>;
    }): void {
        setAIState(options.provider, options.templates);
    }

    export namespace dialog {
        /**
         * Generate a dialogue from a developer request, completely hiding prompt engineering.
         * @param request Natural language description of the dialogue to generate.
         * @param options Options controlling which context gets included in the prompt.
         * @returns The generated dialogue text.
         */
        export async function generate(
            request: string,
            options?: GenerateOptions,
        ): Promise<string> {
            const { provider } = getAIState();
            if (!provider.dialog) {
                throw new Error(
                    `Pixi'VN AI: provider "${provider.name}" does not support dialog generation.`,
                );
            }
            const prompt = buildPrompt("dialog", request, options);
            return provider.dialog.generateText(prompt);
        }
    }
    export namespace image {
        /**
         * Generate an image from a developer request, completely hiding prompt engineering.
         * @param request Natural language description of the image to generate.
         * @param options Options controlling which context gets included in the prompt.
         * @returns The generated image. The shape depends on the configured provider.
         */
        export async function generate(
            request: string,
            options?: GenerateOptions,
        ): Promise<unknown> {
            const { provider } = getAIState();
            if (!provider.image) {
                throw new Error(
                    `Pixi'VN AI: provider "${provider.name}" does not support image generation.`,
                );
            }
            const prompt = buildPrompt("image", request, options);
            return provider.image.generateImage(prompt, options?.referenceImage);
        }
    }
}

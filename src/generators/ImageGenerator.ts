import type GenerateOptions from "../types/GenerateOptions";
import { buildPrompt, getAIState } from "./GenerateEngine";

/**
 * Generate an image from a developer request, completely hiding prompt engineering.
 * @param request Natural language description of the image to generate.
 * @param options Options controlling which context gets included in the prompt.
 * @returns The generated image. The shape depends on the configured provider.
 */
export default async function generateImage(
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

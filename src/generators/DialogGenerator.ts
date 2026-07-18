import type GenerateOptions from "../types/GenerateOptions";
import { buildPrompt, getAIState } from "./GenerateEngine";

/**
 * Generate a dialogue from a developer request, completely hiding prompt engineering.
 * @param request Natural language description of the dialogue to generate.
 * @param options Options controlling which context gets included in the prompt.
 * @returns The generated dialogue text.
 */
export default async function generateDialog(
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

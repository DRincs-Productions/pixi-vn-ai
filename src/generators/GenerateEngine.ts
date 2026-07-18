import { getAIState } from "../init/AIState";
import PromptBuilder from "../prompt/PromptBuilder";
import type GenerateOptions from "../types/GenerateOptions";
import type Templates from "../types/Templates";

const promptBuilder = new PromptBuilder();

/**
 * Build the final prompt for a given template kind (dialog/image), applying whichever template
 * is currently configured (built-in or overridden via {@link initAI}).
 */
export function buildPrompt(
    templateKind: keyof Templates,
    request: string,
    options?: GenerateOptions,
): string {
    const { templates } = getAIState();
    return promptBuilder.build(templates[templateKind], request, options);
}

export { getAIState };

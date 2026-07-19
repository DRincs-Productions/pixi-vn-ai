import { ai } from "../ai";
import { getAIState } from "../init/AIState";
import { PromptBuilder } from "../prompt/PromptBuilder";
import type GenerateOptions from "../types/GenerateOptions";
import type Templates from "../types/Templates";

/**
 * Build the final prompt for a given template kind (dialog/image), applying whichever template
 * is currently configured (built-in or overridden via {@link ai.templates}).
 */
export function buildPrompt(
    templateKind: keyof Templates,
    request: string,
    options?: GenerateOptions,
): string {
    return PromptBuilder.build(ai.templates[templateKind], request, options);
}

export { getAIState };

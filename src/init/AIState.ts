import DefaultTemplates from "../prompt/DefaultTemplates";
import type AIProvider from "../types/AIProvider";
import type Templates from "../types/Templates";

interface AIState {
    provider: AIProvider;
    templates: Templates;
}

let state: AIState | undefined;

/**
 * Set the global AI state. Used internally by `ai.init`.
 */
export function setAIState(provider: AIProvider, templates?: Partial<Templates>): void {
    state = {
        provider,
        templates: {
            dialog: templates?.dialog ?? DefaultTemplates.dialog,
            image: templates?.image ?? DefaultTemplates.image,
        },
    };
}

/**
 * Get the global AI state, throwing a descriptive error if `ai.init` hasn't been called yet.
 */
export function getAIState(): AIState {
    if (!state) {
        throw new Error(
            "Pixi'VN AI has not been initialized. Call ai.init({ provider }) before using ai.dialog or ai.image.",
        );
    }
    return state;
}

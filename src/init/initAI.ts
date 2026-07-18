import type AIProvider from "../types/AIProvider";
import type Templates from "../types/Templates";
import { setAIState } from "./AIState";

export interface InitAIOptions {
    /**
     * The provider used by the whole library (WebLLM, an AI SDK model, or a custom provider).
     */
    provider: AIProvider;
    /**
     * Templates to override the built-in ones. Any template left out falls back to the default.
     */
    templates?: Partial<Templates>;
}

/**
 * Initialize Pixi'VN AI. Call this once, typically at application startup, before using
 * `ai.dialog.generate` or `ai.image.generate`.
 * @param options The provider (required) and templates (optional) to use.
 */
export default function initAI(options: InitAIOptions): void {
    setAIState(options.provider, options.templates);
}

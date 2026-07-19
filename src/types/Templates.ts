import type PromptTemplate from "./PromptTemplate";

/**
 * The set of templates used to build prompts.
 *
 * Passed (partially or fully) to {@link ai.init} to override the built-in templates.
 */
export default interface Templates {
    /**
     * Template used by {@link ai.dialog.generate}.
     */
    dialog: PromptTemplate;
    /**
     * Template used by {@link ai.image.generate}.
     */
    image: PromptTemplate;
}

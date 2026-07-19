import type PromptTemplate from "./PromptTemplate";

/**
 * The set of templates used to build prompts.
 *
 * Assign to {@link ai.templates} to override the built-in templates.
 */
export default interface Templates {
    /**
     * Template used by {@link ai.text.generateDialog}.
     */
    dialog: PromptTemplate;
    /**
     * Template used by {@link ai.image.generate}.
     */
    image: PromptTemplate;
}

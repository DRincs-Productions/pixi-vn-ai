/**
 * A prompt template supplies the static instructions injected as the first section of a
 * generated prompt (e.g. output format rules). Everything else (developer request, history,
 * scene, ...) is assembled by the {@link PromptBuilder}, so templates stay small and easy to
 * override via {@link ai.templates}.
 */
export default interface PromptTemplate {
    /**
     * Instructions given to the model, e.g. output format and behavior rules.
     */
    instructions: string;
}

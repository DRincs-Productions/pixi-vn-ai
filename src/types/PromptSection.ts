/**
 * A single, independent block of a generated prompt.
 *
 * The {@link PromptBuilder} assembles a prompt out of an ordered list of sections instead of
 * concatenating raw strings, so every piece of context (history, scene, speaker, ...) stays
 * isolated and easy to reason about.
 */
export default interface PromptSection {
    /**
     * Heading of the section (e.g. "Scene", "Narrative History").
     */
    title: string;
    /**
     * Body of the section. Plain text or a serialized JSON string.
     */
    content: string;
}

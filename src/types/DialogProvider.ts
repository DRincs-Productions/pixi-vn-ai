/**
 * Capability implemented by providers that can generate dialogue text.
 */
export default interface DialogProvider {
    /**
     * Generate text from a fully assembled prompt.
     * @param prompt The final prompt produced by the {@link PromptBuilder}.
     * @returns The generated text.
     */
    generateText(prompt: string): Promise<string>;
}

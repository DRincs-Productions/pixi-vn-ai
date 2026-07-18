/**
 * Capability implemented by providers that can generate images.
 */
export default interface ImageProvider {
    /**
     * Generate an image from a fully assembled prompt.
     * @param prompt The final prompt produced by the {@link PromptBuilder}.
     * @param referenceImage Optional reference image, forwarded from {@link GenerateOptions.referenceImage}.
     *   Providers that don't support image-to-image generation can ignore it.
     * @returns The generated image. The shape is provider-specific.
     */
    generateImage(prompt: string, referenceImage?: unknown): Promise<unknown>;
}

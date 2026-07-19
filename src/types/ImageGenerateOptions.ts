import type GenerateOptions from "./GenerateOptions";

/**
 * Options shared by {@link ai.image.generateBackground} and {@link ai.image.generateElement}.
 */
export default interface ImageGenerateOptions extends GenerateOptions {
    /**
     * Optional reference image (a URL or a data URI, e.g. the string returned by a previous
     * `ai.image.generateBackground`/`ai.image.generateElement` call), forwarded to providers that
     * support image-to-image generation.
     */
    referenceImage?: string;
}

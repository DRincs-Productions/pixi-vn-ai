import type ImageGenerateOptions from "./ImageGenerateOptions";

/**
 * Options accepted by {@link ai.image.generateElement}.
 *
 * Generates a single visual element (e.g. a character) meant to be layered on top of other
 * visuals: the area behind the subject is transparent, and {@link xAlign}/{@link yAlign} describe
 * where it will be positioned on screen so the model can compose it accordingly.
 */
export default interface ElementImageGenerateOptions extends ImageGenerateOptions {
    /**
     * The background image this element will be placed over, so the model can compose the
     * subject coherently with what's behind it (lighting, perspective, scale, ...).
     *
     * Forwarded to the provider as the reference image when {@link referenceImage} isn't set.
     */
    backgroundImage?: unknown;
    /**
     * Horizontal position of the element within the canvas, as a 0-1 fraction of the distance
     * from the left edge: `0` = flush against the left edge, `1` = flush against the right edge,
     * `0.5` = horizontally centered.
     */
    xAlign?: number;
    /**
     * Vertical position of the element within the canvas, as a 0-1 fraction of the distance from
     * the top edge: `0` = flush against the top edge, `1` = flush against the bottom edge,
     * `0.5` = vertically centered.
     */
    yAlign?: number;
}

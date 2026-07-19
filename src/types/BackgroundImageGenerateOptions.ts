import type ImageGenerateOptions from "./ImageGenerateOptions";

/**
 * Options accepted by {@link ai.image.generateBackground}.
 *
 * The generated image is meant to fill the whole game canvas: its size is read directly from
 * Pixi'VN and included in the prompt, so developers never have to pass it manually.
 */
export default interface BackgroundImageGenerateOptions extends ImageGenerateOptions {}

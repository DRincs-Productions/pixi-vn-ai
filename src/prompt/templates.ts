import type { PromptTemplate } from "@/types";

/**
 * Built-in template used by {@link ai.dialog.generate}.
 *
 * Instructs the model to produce output that Pixi'VN can render directly: simple, readable
 * Markdown, with HTML allowed only when it's the only way to achieve a visual effect.
 */
export const DEFAULT_DIALOG_TEMPLATE: PromptTemplate = {
    instructions: `You are generating narrative dialogue for a visual novel.
Generate Markdown text.
Keep the Markdown simple and readable.
Do not use headings.
Do not use tables.
Do not use unnecessary lists.
Use bold and italic only when they improve readability.
HTML is allowed only when necessary; prefer <span> for styling (e.g. colors). Avoid excessive HTML usage.
Return only the generated content.
Do not explain the generated result.`,
};

/**
 * Built-in template used by {@link ai.image.generateBackground}.
 *
 * Instructs the model to fill the whole canvas (size given in the prompt) with no borders or
 * letterboxing, using the reference image (when provided) or the textual context otherwise.
 */
export const DEFAULT_BACKGROUND_IMAGE_TEMPLATE: PromptTemplate = {
    instructions: `You are generating a background illustration for a visual novel scene.
This image fills the entire game canvas: match the canvas size given below and cover the full frame edge-to-edge, with no borders, letterboxing or unused margins.
If a reference image is provided, use it as the basis for the generated image.
Otherwise, generate the image purely from the textual context below.
Match the requested scene, style and subjects as closely as possible.`,
};

/**
 * Built-in template used by {@link ai.image.generateElement}.
 *
 * Instructs the model to generate a single subject with a fully transparent background, composed
 * according to the background reference and alignment (when provided).
 */
export const DEFAULT_ELEMENT_IMAGE_TEMPLATE: PromptTemplate = {
    instructions: `You are generating a single visual element (e.g. a character) for a visual novel, meant to be layered on top of a background.
The area behind the subject must be fully transparent: do not generate any background, ground or scenery of your own.
If a background reference image is provided, use it only to match lighting, perspective and scale; do not reproduce it.
If alignment values are provided, compose the subject so it reads naturally when placed at that position on screen.
Match the requested scene, style and subjects as closely as possible.`,
};

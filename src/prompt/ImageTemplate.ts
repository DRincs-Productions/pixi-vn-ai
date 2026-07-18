import type PromptTemplate from "../types/PromptTemplate";

/**
 * Built-in template used by {@link ai.image.generate}.
 *
 * Instructs the model to use the reference image (when provided) and otherwise rely on the
 * textual context (scene, style, serialized subjects, ...) to generate the image.
 */
const ImageTemplate: PromptTemplate = {
    instructions: [
        "You are generating a scene illustration for a visual novel.",
        "If a reference image is provided, use it as the basis for the generated image.",
        "Otherwise, generate the image purely from the textual context below.",
        "Match the requested scene, style and subjects as closely as possible.",
    ].join("\n"),
};

export default ImageTemplate;

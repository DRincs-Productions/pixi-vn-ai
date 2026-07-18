import { generateDialog, generateImage } from "./generators";

export { default as initAI, type InitAIOptions } from "./init/initAI";
export { AISDKProvider, type AISDKProviderOptions, WebLLMProvider } from "./providers";
export { DefaultTemplates, DialogTemplate, ImageTemplate, PromptBuilder } from "./prompt";
export type {
    AIProvider,
    DialogProvider,
    GenerateOptions,
    ImageProvider,
    PromptSection,
    PromptTemplate,
    Templates,
} from "./types";

/**
 * The small, provider-independent public API of Pixi'VN AI.
 *
 * Prompt engineering is entirely hidden: `ai.dialog.generate` and `ai.image.generate` build the
 * final prompt internally from the developer request, the configured templates, and the
 * {@link GenerateOptions} passed in (narrative history, speaker, listeners, scene, ...).
 */
export const ai = {
    dialog: {
        generate: generateDialog,
    },
    image: {
        generate: generateImage,
    },
};

import { ai } from "@/ai";
import AIImageSprite from "@/canvas/AIImageSprite";
import type {
    BackgroundImageGenerateOptions,
    CharacterItem,
    DialogGenerateOptions,
    ElementImageGenerateOptions,
} from "@/types";
import { narration } from "@drincs/pixi-vn";
import { canvas } from "@drincs/pixi-vn/canvas";

/**
 * Generate a background image and show it on the canvas, filling it edge-to-edge. This is the
 * combination of `ai.image.generateBackground` and Pixi'VN's `showImage`, using
 * {@link AIImageSprite} so the generated image itself is saved with the game and can be restored
 * on load without generating it again.
 * @param alias The unique alias of the background. You can use this alias to refer to it later
 *   (e.g. to replace it with another generated background).
 * @param request Natural language description of the background to generate.
 * @param options Options controlling which context gets included in the prompt.
 * @returns The {@link AIImageSprite} added to the canvas.
 */
export async function showBackground(
    alias: string,
    request: string,
    options?: BackgroundImageGenerateOptions,
): Promise<AIImageSprite> {
    const generatedImage = await ai.image.generateBackground(request, options);
    return showGeneratedImage(alias, generatedImage);
}

/**
 * Generate a single visual element and show it on the canvas, positioned with
 * {@link ElementImageGenerateOptions.align} (the only supported way to position it: there is no
 * raw x/y here, since the position is already the one the image itself was composed for). This is
 * the combination of `ai.image.generateElement` and Pixi'VN's `showImage`, using
 * {@link AIImageSprite} so the generated image itself is saved with the game and can be restored
 * on load without generating it again.
 * @param alias The unique alias of the element. You can use this alias to refer to it later
 *   (e.g. to replace it with another generated element).
 * @param request Natural language description of the element to generate.
 * @param options Options controlling which context gets included in the prompt, and where the
 *   element is positioned on the canvas (`align`).
 * @returns The {@link AIImageSprite} added to the canvas.
 */
export async function showElement(
    alias: string,
    request: string,
    options?: ElementImageGenerateOptions,
): Promise<AIImageSprite> {
    const generatedImage = await ai.image.generateElement(request, options);
    return showGeneratedImage(alias, generatedImage, options?.align);
}

/**
 * Generate a dialogue from a developer request and set it as the current Pixi'VN narration
 * dialogue. This is the combination of `ai.text.generateDialog` and Pixi'VN's
 * `narration.dialogue`.
 * @param request Natural language description of the dialogue to generate.
 * @param character The character speaking, if any. Set as the dialogue's character, and also
 *   used as {@link DialogGenerateOptions.speaker} (so the model knows who it's writing for) when
 *   `options.speaker` isn't already set.
 * @param options Options controlling which context gets included in the prompt.
 * @returns The generated dialogue text.
 */
export async function showDialog(
    request: string,
    character?: CharacterItem,
    options?: DialogGenerateOptions,
): Promise<string> {
    const text = await ai.text.generateDialog(request, {
        ...options,
        speaker: options?.speaker ?? character,
    });
    narration.dialogue = character ? { character, text } : text;
    return text;
}

/**
 * Show a generated image on the canvas as an {@link AIImageSprite}, reusing whatever component
 * previously existed under the same alias (if any) so its properties (position, scale, ...)
 * carry over, following the same pattern as Pixi'VN's `showImage`.
 * @param alias The unique alias of the image.
 * @param generatedImage The generated image, as a data URI.
 * @param align Where to position the image on the canvas (see {@link ElementImageGenerateOptions.align}).
 */
async function showGeneratedImage(
    alias: string,
    generatedImage: string,
    align?: { x: number; y: number },
): Promise<AIImageSprite> {
    const oldMemory = canvas.find(alias)?.memory;
    const component = new AIImageSprite(align ? { align } : undefined, generatedImage);
    component.label = alias;
    await component.load();
    if (oldMemory) {
        await canvas.copyCanvasElementProperty(oldMemory, component);
    }
    canvas.add(alias, component, { ignoreOldStyle: true });
    return component;
}

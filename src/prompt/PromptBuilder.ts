import type {
    BackgroundImageGenerateOptions,
    DialogGenerateOptions,
    ElementImageGenerateOptions,
    PromptSection,
    PromptTemplate,
} from "@/types";
import { stepHistory } from "@drincs/pixi-vn/history";

/**
 * The union of every field {@link DialogGenerateOptions}, {@link BackgroundImageGenerateOptions}
 * and {@link ElementImageGenerateOptions} can carry, since the builder assembles sections for all
 * of them without knowing which one it was called for.
 */
type PromptOptions = DialogGenerateOptions &
    BackgroundImageGenerateOptions &
    ElementImageGenerateOptions;

/**
 * Centralizes prompt construction so that generators never concatenate strings directly.
 *
 * Assembles a prompt out of independent {@link PromptSection}s (instructions, developer request,
 * narrative history, scene, ...), including only the sections that are actually relevant for the
 * given request.
 */
export namespace PromptBuilder {
    /**
     * Assemble the sections of a prompt, without applying any specific format to the final string.
     * @param template The template supplying the instructions section.
     * @param request The developer's natural language request.
     * @param options The generate options driving which sections get included.
     * @param extraSections Additional sections appended at the end, e.g. the canvas size for
     *   {@link ai.image.generateBackground}. Callers that read state {@link PromptBuilder} doesn't
     *   have access to (like Pixi'VN's canvas) are responsible for building these themselves.
     */
    export function buildSections(
        template: PromptTemplate,
        request: string,
        options: PromptOptions = {},
        extraSections: PromptSection[] = [],
    ): PromptSection[] {
        const sections: PromptSection[] = [];
        const {
            speaker,
            listeners,
            history = true,
            context,
            scene,
            style,
            language,
            referenceImage,
            backgroundImage,
            xAlign,
            yAlign,
        } = options;

        sections.push({ title: "Instructions", content: template.instructions });
        sections.push({ title: "Developer Request", content: request });

        if (history) {
            const historyJson = getNarrativeHistoryJson();
            if (historyJson) {
                sections.push({ title: "Narrative History", content: historyJson });
            }
        }

        if (scene) {
            sections.push({ title: "Scene", content: scene });
        }

        if (style) {
            sections.push({ title: "Style", content: style });
        }

        if (language) {
            sections.push({ title: "Language", content: language });
        }

        if (context) {
            sections.push({ title: "Context", content: context });
        }

        if (speaker) {
            const speakerJson = serializeObject(speaker);
            if (speakerJson) {
                sections.push({ title: "Speaker", content: speakerJson });
            }
        }

        if (listeners) {
            const listenersJson = serializeObject(listeners);
            if (listenersJson) {
                sections.push({ title: "Listeners", content: listenersJson });
            }
        }

        if (referenceImage) {
            sections.push({
                title: "Reference Image",
                content:
                    "A reference image has been provided and should be used as visual guidance.",
            });
        }

        if (backgroundImage) {
            sections.push({
                title: "Background Reference",
                content:
                    "The background image this element will be placed over has been provided: use it as visual guidance for lighting, perspective and scale.",
            });
        }

        if (xAlign !== undefined || yAlign !== undefined) {
            sections.push({
                title: "Alignment",
                content: [
                    "The element will be positioned on the canvas using the following alignment (0-1 fraction of the distance from each edge; 0 = flush against the start edge, 1 = flush against the end edge, 0.5 = centered):",
                    xAlign !== undefined
                        ? `xAlign (horizontal, from the left edge): ${xAlign}`
                        : undefined,
                    yAlign !== undefined
                        ? `yAlign (vertical, from the top edge): ${yAlign}`
                        : undefined,
                ]
                    .filter((line) => line !== undefined)
                    .join("\n"),
            });
        }

        sections.push(...extraSections);

        return sections;
    }

    /**
     * Build the final prompt string for the given template, request and options.
     * @param template The template supplying the instructions section.
     * @param request The developer's natural language request.
     * @param options The generate options driving which sections get included.
     * @param extraSections Additional sections appended at the end.
     */
    export function build(
        template: PromptTemplate,
        request: string,
        options: PromptOptions = {},
        extraSections: PromptSection[] = [],
    ): string {
        return buildSections(template, request, options, extraSections)
            .map((section) => `## ${section.title}\n${section.content}`)
            .join("\n\n");
    }

    /**
     * Retrieve the Pixi'VN narrative history and serialize it into JSON.
     *
     * This is the only place in the library that reads Pixi'VN's history state, so developers
     * never have to pass the history manually: {@link GenerateOptions.history} is enough.
     * @returns The serialized history, or undefined if there is no history to inject.
     */
    function getNarrativeHistoryJson(): string | undefined {
        const history = stepHistory.narrativeHistory;
        if (!history || history.length === 0) {
            return undefined;
        }
        return JSON.stringify(history, null, 2);
    }

    /**
     * Serialize a developer-provided object (or array of objects) into JSON.
     *
     * Pixi'VN AI never defines a `Character` model: developers pass whatever serializable shape
     * fits their game (a Pixi'VN `Character`, a plain object, a string, ...) and this is the only
     * place that turns it into prompt-ready JSON.
     * @param value The value to serialize. `undefined`/`null` are treated as "not provided".
     * @returns The serialized value, or undefined if there is nothing to inject.
     */
    function serializeObject(value: unknown): string | undefined {
        if (value === undefined || value === null) {
            return undefined;
        }
        if (Array.isArray(value) && value.length === 0) {
            return undefined;
        }
        return JSON.stringify(value, null, 2);
    }
}

import { getNarrativeHistoryJson, serializeObject } from "../context";
import type GenerateOptions from "../types/GenerateOptions";
import type PromptSection from "../types/PromptSection";
import type PromptTemplate from "../types/PromptTemplate";

/**
 * Centralizes prompt construction so that generators never concatenate strings directly.
 *
 * The builder assembles a prompt out of independent {@link PromptSection}s (instructions,
 * developer request, narrative history, scene, ...), including only the sections that are
 * actually relevant for the given request.
 */
export default class PromptBuilder {
    /**
     * Assemble the sections of a prompt, without applying any specific format to the final string.
     * @param template The template supplying the instructions section.
     * @param request The developer's natural language request.
     * @param options The generate options driving which sections get included.
     */
    buildSections(
        template: PromptTemplate,
        request: string,
        options: GenerateOptions = {},
    ): PromptSection[] {
        const sections: PromptSection[] = [];

        if (template.instructions) {
            sections.push({ title: "Instructions", content: template.instructions });
        }

        sections.push({ title: "Developer Request", content: request });

        if (options.history) {
            const historyJson = getNarrativeHistoryJson();
            if (historyJson) {
                sections.push({ title: "Narrative History", content: historyJson });
            }
        }

        if (options.scene) {
            sections.push({ title: "Scene", content: options.scene });
        }

        if (options.style) {
            sections.push({ title: "Style", content: options.style });
        }

        if (options.language) {
            sections.push({ title: "Language", content: options.language });
        }

        if (options.context) {
            sections.push({ title: "Context", content: options.context });
        }

        const speakerJson = serializeObject(options.speaker);
        if (speakerJson) {
            sections.push({ title: "Speaker", content: speakerJson });
        }

        const listenersJson = serializeObject(options.listeners);
        if (listenersJson) {
            sections.push({ title: "Listeners", content: listenersJson });
        }

        if (options.referenceImage !== undefined && options.referenceImage !== null) {
            sections.push({
                title: "Reference Image",
                content:
                    "A reference image has been provided and should be used as visual guidance.",
            });
        }

        return sections;
    }

    /**
     * Build the final prompt string for the given template, request and options.
     * @param template The template supplying the instructions section.
     * @param request The developer's natural language request.
     * @param options The generate options driving which sections get included.
     */
    build(template: PromptTemplate, request: string, options: GenerateOptions = {}): string {
        return this.buildSections(template, request, options)
            .map((section) => `## ${section.title}\n${section.content}`)
            .join("\n\n");
    }
}

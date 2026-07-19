import type PromptTemplate from "@/types/PromptTemplate";
import { beforeEach, describe, expect, it, vi } from "vitest";

const pixiVnMock = vi.hoisted(() => ({
    stepHistory: {
        narrativeHistory: [] as unknown[],
    },
}));

vi.mock("@drincs/pixi-vn", () => pixiVnMock);

const { PromptBuilder } = await import("@/prompt/PromptBuilder");

const template: PromptTemplate = { instructions: "Be concise." };

describe("PromptBuilder", () => {
    beforeEach(() => {
        pixiVnMock.stepHistory.narrativeHistory = [];
    });

    it("includes only Instructions and Developer Request when no options are given", () => {
        const sections = PromptBuilder.buildSections(template, "Generate a greeting.");
        expect(sections.map((s) => s.title)).toEqual(["Instructions", "Developer Request"]);
        expect(sections[1].content).toBe("Generate a greeting.");
    });

    it("includes sections in the documented order, skipping irrelevant ones", () => {
        pixiVnMock.stepHistory.narrativeHistory = [{ stepIndex: 0 }];
        const sections = PromptBuilder.buildSections(template, "Generate a greeting.", {
            history: true,
            scene: "Throne room at dusk.",
            style: "Melancholic",
            language: "English",
            context: "The king is tired.",
            speaker: { name: "King" },
            listeners: [{ name: "Queen" }],
            referenceImage: "data:image/png;base64,xyz",
        });

        expect(sections.map((s) => s.title)).toEqual([
            "Instructions",
            "Developer Request",
            "Narrative History",
            "Scene",
            "Style",
            "Language",
            "Context",
            "Speaker",
            "Listeners",
            "Reference Image",
        ]);
    });

    it("omits the Narrative History section when history is not requested", () => {
        pixiVnMock.stepHistory.narrativeHistory = [{ stepIndex: 0 }];
        const sections = PromptBuilder.buildSections(template, "Generate a greeting.");
        expect(sections.map((s) => s.title)).not.toContain("Narrative History");
    });

    it("omits the Narrative History section when history is requested but empty", () => {
        const sections = PromptBuilder.buildSections(template, "Generate a greeting.", {
            history: true,
        });
        expect(sections.map((s) => s.title)).not.toContain("Narrative History");
    });

    it("serializes speaker and listeners as JSON", () => {
        const sections = PromptBuilder.buildSections(template, "Generate a greeting.", {
            speaker: { name: "King" },
        });
        const speakerSection = sections.find((s) => s.title === "Speaker");
        expect(speakerSection).toBeDefined();
        expect(JSON.parse(speakerSection!.content)).toEqual({ name: "King" });
    });

    it("builds a single prompt string with all sections", () => {
        const prompt = PromptBuilder.build(template, "Generate a greeting.", {
            scene: "A garden.",
        });
        expect(prompt).toContain("## Instructions\nBe concise.");
        expect(prompt).toContain("## Developer Request\nGenerate a greeting.");
        expect(prompt).toContain("## Scene\nA garden.");
    });
});

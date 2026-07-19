import type PromptTemplate from "@/types/PromptTemplate";
import { beforeEach, describe, expect, it, vi } from "vitest";

const pixiVnHistoryMock = vi.hoisted(() => ({
    stepHistory: {
        narrativeHistory: [] as unknown[],
    },
}));
vi.mock("@drincs/pixi-vn/history", () => pixiVnHistoryMock);

const pixiVnMock = vi.hoisted(() => ({
    RegisteredCharacters: { get: vi.fn() },
}));
vi.mock("@drincs/pixi-vn", () => pixiVnMock);

const utilsMock = vi.hoisted(() => ({
    resolveAssetImage: vi.fn(),
    toDataUri: vi.fn(),
}));
vi.mock("@/utils", () => utilsMock);

const { PromptBuilder } = await import("@/prompt/PromptBuilder");

const template: PromptTemplate = { instructions: "Be concise." };

describe("PromptBuilder", () => {
    beforeEach(() => {
        vi.clearAllMocks();
        pixiVnHistoryMock.stepHistory.narrativeHistory = [];
        pixiVnMock.RegisteredCharacters.get.mockReturnValue(undefined);
        utilsMock.resolveAssetImage.mockImplementation(async (alias: unknown) =>
            alias === true ? "data:image/png;base64,canvas" : `data:image/png;base64,${alias}`,
        );
    });

    describe("buildSections", () => {
        it("includes only Instructions and Developer Request when no options are given", async () => {
            const sections = await PromptBuilder.buildSections(template, "Generate a greeting.");
            expect(sections.map((s) => s.title)).toEqual(["Instructions", "Developer Request"]);
            expect(sections[0].content).toBe("Be concise.");
            expect(sections[1].content).toBe("Generate a greeting.");
        });

        it("includes sections in the documented order, skipping irrelevant ones", async () => {
            pixiVnHistoryMock.stepHistory.narrativeHistory = [{ stepIndex: 0 }];
            const sections = await PromptBuilder.buildSections(template, "Generate a greeting.", {
                history: true,
                scene: "Throne room at dusk.",
                style: "Melancholic",
                language: "English",
                context: "The king is tired.",
                speaker: { name: "King" },
                listeners: [{ name: "Queen" }],
                referenceImage: "ref.png",
                backgroundImage: "bg.png",
                align: { x: 0.5, y: 1 },
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
                "Background Reference",
                "Alignment",
            ]);
        });

        it("appends extraSections after every other section", async () => {
            const sections = await PromptBuilder.buildSections(
                template,
                "Generate a greeting.",
                { scene: "A garden." },
                [{ title: "Canvas Size", content: "1920x1080" }],
            );
            expect(sections.map((s) => s.title)).toEqual([
                "Instructions",
                "Developer Request",
                "Scene",
                "Canvas Size",
            ]);
        });

        describe("history", () => {
            it("defaults to true: includes Narrative History when there is history and no option is given", async () => {
                pixiVnHistoryMock.stepHistory.narrativeHistory = [{ stepIndex: 0 }];
                const sections = await PromptBuilder.buildSections(template, "Generate a greeting.");
                const section = sections.find((s) => s.title === "Narrative History");
                expect(section).toBeDefined();
                expect(JSON.parse(section!.content)).toEqual([{ stepIndex: 0 }]);
                expect(section!.description).toBe("The narrative history so far, serialized as JSON.");
            });

            it("omits Narrative History when history: false is passed explicitly", async () => {
                pixiVnHistoryMock.stepHistory.narrativeHistory = [{ stepIndex: 0 }];
                const sections = await PromptBuilder.buildSections(template, "Generate a greeting.", {
                    history: false,
                });
                expect(sections.map((s) => s.title)).not.toContain("Narrative History");
            });

            it("omits Narrative History when history is requested but empty", async () => {
                const sections = await PromptBuilder.buildSections(template, "Generate a greeting.", {
                    history: true,
                });
                expect(sections.map((s) => s.title)).not.toContain("Narrative History");
            });
        });

        describe("scene / style / language / context", () => {
            it("includes Scene and Style with plain content and no description", async () => {
                const sections = await PromptBuilder.buildSections(template, "Generate a greeting.", {
                    scene: "A garden.",
                    style: "Whimsical.",
                });
                const scene = sections.find((s) => s.title === "Scene");
                const style = sections.find((s) => s.title === "Style");
                expect(scene).toEqual({ title: "Scene", content: "A garden." });
                expect(style).toEqual({ title: "Style", content: "Whimsical." });
            });

            it("includes Language with a description explaining it drives the output language", async () => {
                const sections = await PromptBuilder.buildSections(template, "Generate a greeting.", {
                    language: "French",
                });
                const language = sections.find((s) => s.title === "Language");
                expect(language?.content).toBe("French");
                expect(language?.description).toBe(
                    "The language the generated content must be written in.",
                );
            });

            it("includes Context with plain content and no description", async () => {
                const sections = await PromptBuilder.buildSections(template, "Generate a greeting.", {
                    context: "The king is tired.",
                });
                expect(sections.find((s) => s.title === "Context")).toEqual({
                    title: "Context",
                    content: "The king is tired.",
                });
            });

            it("omits Scene/Style/Language/Context when not provided", async () => {
                const sections = await PromptBuilder.buildSections(template, "Generate a greeting.");
                const titles = sections.map((s) => s.title);
                expect(titles).not.toContain("Scene");
                expect(titles).not.toContain("Style");
                expect(titles).not.toContain("Language");
                expect(titles).not.toContain("Context");
            });
        });

        describe("speaker / listeners", () => {
            it("wraps a single character in an array and serializes it as JSON", async () => {
                const sections = await PromptBuilder.buildSections(template, "Generate a greeting.", {
                    speaker: { name: "King" },
                });
                const speaker = sections.find((s) => s.title === "Speaker");
                expect(speaker?.description).toBe("The character(s) speaking, serialized as JSON.");
                expect(JSON.parse(speaker!.content)).toEqual([{ name: "King" }]);
            });

            it("keeps an array of characters as-is", async () => {
                const sections = await PromptBuilder.buildSections(template, "Generate a greeting.", {
                    listeners: [{ name: "Queen" }, { name: "Advisor" }],
                });
                const listeners = sections.find((s) => s.title === "Listeners");
                expect(JSON.parse(listeners!.content)).toEqual([
                    { name: "Queen" },
                    { name: "Advisor" },
                ]);
            });

            it("resolves a character ID against RegisteredCharacters", async () => {
                pixiVnMock.RegisteredCharacters.get.mockImplementation((id: string) =>
                    id === "king" ? { id: "king", name: "The King" } : undefined,
                );
                const sections = await PromptBuilder.buildSections(template, "Generate a greeting.", {
                    speaker: "king",
                });
                const speaker = sections.find((s) => s.title === "Speaker");
                expect(pixiVnMock.RegisteredCharacters.get).toHaveBeenCalledWith("king");
                expect(JSON.parse(speaker!.content)).toEqual([{ id: "king", name: "The King" }]);
            });

            it("falls back to { id } when a character ID isn't registered", async () => {
                pixiVnMock.RegisteredCharacters.get.mockReturnValue(undefined);
                const sections = await PromptBuilder.buildSections(template, "Generate a greeting.", {
                    listeners: "unknown-id",
                });
                const listeners = sections.find((s) => s.title === "Listeners");
                expect(JSON.parse(listeners!.content)).toEqual([{ id: "unknown-id" }]);
            });

            it("omits Speaker/Listeners for an empty array", async () => {
                const sections = await PromptBuilder.buildSections(template, "Generate a greeting.", {
                    speaker: [],
                    listeners: [],
                });
                const titles = sections.map((s) => s.title);
                expect(titles).not.toContain("Speaker");
                expect(titles).not.toContain("Listeners");
            });
        });

        describe("reference image / background image", () => {
            it("resolves referenceImage via resolveAssetImage and embeds the result as content", async () => {
                const sections = await PromptBuilder.buildSections(template, "Generate a greeting.", {
                    referenceImage: "ref.png",
                });
                expect(utilsMock.resolveAssetImage).toHaveBeenCalledWith("ref.png");
                const section = sections.find((s) => s.title === PromptBuilder.REFERENCE_IMAGE_TITLE);
                expect(section?.content).toBe("data:image/png;base64,ref.png");
                expect(section?.description).toBeTruthy();
            });

            it("resolves backgroundImage via resolveAssetImage and embeds the result as content", async () => {
                const sections = await PromptBuilder.buildSections(template, "Generate a greeting.", {
                    backgroundImage: "bg.png",
                });
                expect(utilsMock.resolveAssetImage).toHaveBeenCalledWith("bg.png");
                const section = sections.find(
                    (s) => s.title === PromptBuilder.BACKGROUND_REFERENCE_TITLE,
                );
                expect(section?.content).toBe("data:image/png;base64,bg.png");
            });

            it("passes `true` through to resolveAssetImage to capture the current canvas", async () => {
                const sections = await PromptBuilder.buildSections(template, "Generate a greeting.", {
                    backgroundImage: true,
                });
                expect(utilsMock.resolveAssetImage).toHaveBeenCalledWith(true);
                const section = sections.find(
                    (s) => s.title === PromptBuilder.BACKGROUND_REFERENCE_TITLE,
                );
                expect(section?.content).toBe("data:image/png;base64,canvas");
            });

            it("omits Reference Image / Background Reference when not provided", async () => {
                const sections = await PromptBuilder.buildSections(template, "Generate a greeting.");
                const titles = sections.map((s) => s.title);
                expect(titles).not.toContain(PromptBuilder.REFERENCE_IMAGE_TITLE);
                expect(titles).not.toContain(PromptBuilder.BACKGROUND_REFERENCE_TITLE);
                expect(utilsMock.resolveAssetImage).not.toHaveBeenCalled();
            });
        });

        describe("alignment", () => {
            it("serializes align as JSON with an explanatory description", async () => {
                const sections = await PromptBuilder.buildSections(template, "Generate a greeting.", {
                    align: { x: 0.25, y: 0.75 },
                });
                const alignment = sections.find((s) => s.title === "Alignment");
                expect(alignment).toBeDefined();
                expect(JSON.parse(alignment!.content)).toEqual({ x: 0.25, y: 0.75 });
                expect(alignment!.description).toBeTruthy();
            });

            it("omits Alignment when align is not provided", async () => {
                const sections = await PromptBuilder.buildSections(template, "Generate a greeting.");
                expect(sections.map((s) => s.title)).not.toContain("Alignment");
            });
        });
    });

    describe("formatSections / build", () => {
        it("formats a section without a description as a heading followed by its content", () => {
            const formatted = PromptBuilder.formatSections([
                { title: "Scene", content: "A garden." },
            ]);
            expect(formatted).toBe("### Scene\n\nA garden.");
        });

        it("formats a section with a description, fencing the content as a code block", () => {
            const formatted = PromptBuilder.formatSections([
                { title: "Speaker", description: "JSON blob.", content: '{"name":"King"}' },
            ]);
            expect(formatted).toBe('### Speaker\n\nJSON blob.\n\n```\n{"name":"King"}\n```');
        });

        it("joins multiple sections with a blank line", () => {
            const formatted = PromptBuilder.formatSections([
                { title: "Instructions", content: "Be concise." },
                { title: "Developer Request", content: "Generate a greeting." },
            ]);
            expect(formatted).toBe(
                "### Instructions\n\nBe concise.\n\n### Developer Request\n\nGenerate a greeting.",
            );
        });

        it("build() assembles the sections produced by buildSections into one string", async () => {
            const prompt = await PromptBuilder.build(template, "Generate a greeting.", {
                scene: "A garden.",
            });
            expect(prompt).toContain("### Instructions\n\nBe concise.");
            expect(prompt).toContain("### Developer Request\n\nGenerate a greeting.");
            expect(prompt).toContain("### Scene\n\nA garden.");
        });

        it("build() includes extraSections in the final string", async () => {
            const prompt = await PromptBuilder.build(template, "Generate a greeting.", {}, [
                { title: "Canvas Size", content: "1920x1080" },
            ]);
            expect(prompt).toContain("### Canvas Size\n\n1920x1080");
        });
    });

    describe("section title constants", () => {
        it("REFERENCE_IMAGE_TITLE / BACKGROUND_REFERENCE_TITLE match the titles buildSections actually uses", async () => {
            const sections = await PromptBuilder.buildSections(template, "Generate a greeting.", {
                referenceImage: "ref.png",
                backgroundImage: "bg.png",
            });
            const titles = sections.map((s) => s.title);
            expect(titles).toContain(PromptBuilder.REFERENCE_IMAGE_TITLE);
            expect(titles).toContain(PromptBuilder.BACKGROUND_REFERENCE_TITLE);
        });
    });
});

import { beforeEach, describe, expect, it, vi } from "vitest";

const providerMock = vi.hoisted(() => ({
    Provider: {
        init: vi.fn(),
        generateText: vi.fn(),
        generateImage: vi.fn(),
    },
}));
vi.mock("@/providers", () => providerMock);

const utilsMock = vi.hoisted(() => ({
    resolveAssetImage: vi.fn(),
    toDataUri: vi.fn(),
}));
vi.mock("@/utils", () => utilsMock);

const canvasMock = vi.hoisted(() => ({
    canvas: {
        width: 1920,
        height: 1080,
        find: vi.fn(),
        add: vi.fn(),
        copyCanvasElementProperty: vi.fn(),
    },
}));
vi.mock("@drincs/pixi-vn/canvas", async (importOriginal) => {
    const actual = await importOriginal<typeof import("@drincs/pixi-vn/canvas")>();
    return { ...actual, canvas: canvasMock.canvas };
});

const narrationMock = vi.hoisted(() => ({
    narration: { dialogue: undefined as unknown },
}));
vi.mock("@drincs/pixi-vn", async (importOriginal) => {
    const actual = await importOriginal<typeof import("@drincs/pixi-vn")>();
    return { ...actual, narration: narrationMock.narration };
});

const aiImageSpriteMock = vi.hoisted(() => {
    class StubAIImageSprite {
        options: unknown;
        generatedImage: string;
        label?: string;
        load = vi.fn().mockResolvedValue(undefined);
        constructor(options: unknown, generatedImage: string) {
            this.options = options;
            this.generatedImage = generatedImage;
        }
    }
    return { StubAIImageSprite };
});
vi.mock("@/canvas/AIImageSprite", () => ({ default: aiImageSpriteMock.StubAIImageSprite }));

const { showBackground, showDialog, showElement } = await import("@/show");

beforeEach(() => {
    vi.clearAllMocks();
    canvasMock.canvas.find.mockReturnValue(undefined);
    narrationMock.narration.dialogue = undefined;
});

describe("showBackground", () => {
    it("generates the background and adds an AIImageSprite to the canvas under the given alias", async () => {
        providerMock.Provider.generateImage.mockResolvedValue("data:image/png;base64,bg123");

        const component = await showBackground("background", "The throne room.");

        expect(component).toBeInstanceOf(aiImageSpriteMock.StubAIImageSprite);
        expect(component.generatedImage).toBe("data:image/png;base64,bg123");
        expect(component.options).toBeUndefined();
        expect(component.load).toHaveBeenCalledTimes(1);
        expect(canvasMock.canvas.add).toHaveBeenCalledWith(
            "background",
            component,
            expect.objectContaining({ ignoreOldStyle: true }),
        );
    });

    it("copies over the properties of a previous element under the same alias", async () => {
        providerMock.Provider.generateImage.mockResolvedValue("data:image/png;base64,bg123");
        const oldMemory = { x: 10 };
        canvasMock.canvas.find.mockReturnValue({ memory: oldMemory });

        const component = await showBackground("background", "The throne room.");

        expect(canvasMock.canvas.copyCanvasElementProperty).toHaveBeenCalledWith(
            oldMemory,
            component,
        );
    });

    it("does not copy properties when there was nothing under the alias before", async () => {
        providerMock.Provider.generateImage.mockResolvedValue("data:image/png;base64,bg123");

        await showBackground("background", "The throne room.");

        expect(canvasMock.canvas.copyCanvasElementProperty).not.toHaveBeenCalled();
    });
});

describe("showElement", () => {
    it("positions the element via align and forwards align to the prompt", async () => {
        providerMock.Provider.generateImage.mockResolvedValue("data:image/png;base64,el123");

        const component = await showElement("advisor", "The advisor.", {
            align: { x: 0.8, y: 1 },
        });

        expect(component.options).toEqual({ align: { x: 0.8, y: 1 } });
        const prompt = providerMock.Provider.generateImage.mock.calls[0][0];
        expect(prompt).toContain("Alignment");
    });

    it("passes no positioning options when align isn't set", async () => {
        providerMock.Provider.generateImage.mockResolvedValue("data:image/png;base64,el123");

        const component = await showElement("advisor", "The advisor.");

        expect(component.options).toBeUndefined();
    });
});

describe("showDialog", () => {
    it("sets narration.dialogue to plain text when no character is given", async () => {
        providerMock.Provider.generateText.mockResolvedValue("Welcome, traveler.");

        const text = await showDialog("Greet the traveler.");

        expect(text).toBe("Welcome, traveler.");
        expect(narrationMock.narration.dialogue).toBe("Welcome, traveler.");
    });

    it("sets narration.dialogue with the character, and uses it as the default speaker", async () => {
        providerMock.Provider.generateText.mockResolvedValue("Welcome, traveler.");

        const text = await showDialog("Greet the traveler.", "advisor");

        expect(text).toBe("Welcome, traveler.");
        expect(narrationMock.narration.dialogue).toEqual({
            character: "advisor",
            text: "Welcome, traveler.",
        });
        const prompt = providerMock.Provider.generateText.mock.calls[0][0];
        expect(prompt).toContain("Speaker");
        expect(prompt).toContain("advisor");
    });

    it("prefers an explicit options.speaker over the character parameter for the prompt", async () => {
        providerMock.Provider.generateText.mockResolvedValue("Welcome, traveler.");

        await showDialog("Greet the traveler.", "advisor", { speaker: "king" });

        const prompt = providerMock.Provider.generateText.mock.calls[0][0];
        expect(prompt).toContain("king");
        expect(prompt).not.toContain("advisor");
    });
});

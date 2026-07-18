import { beforeEach, describe, expect, it, vi } from "vitest";

const pixiVnMock = vi.hoisted(() => ({
    stepHistory: {
        narrativeHistory: [] as unknown[],
    },
}));

vi.mock("@drincs/pixi-vn", () => pixiVnMock);

const { getNarrativeHistoryJson } = await import("@/context/HistoryContext");

describe("getNarrativeHistoryJson", () => {
    beforeEach(() => {
        pixiVnMock.stepHistory.narrativeHistory = [];
    });

    it("returns undefined when there is no narrative history", () => {
        expect(getNarrativeHistoryJson()).toBeUndefined();
    });

    it("serializes the Pixi'VN narrative history to JSON", () => {
        pixiVnMock.stepHistory.narrativeHistory = [
            { stepIndex: 0, dialogue: { text: "The king enters the throne room." } },
        ];
        const json = getNarrativeHistoryJson();
        expect(json).toBeDefined();
        expect(JSON.parse(json!)).toEqual(pixiVnMock.stepHistory.narrativeHistory);
    });
});

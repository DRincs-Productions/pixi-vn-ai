import { stepHistory } from "@drincs/pixi-vn";

/**
 * Retrieve the Pixi'VN narrative history and serialize it into JSON.
 *
 * This is the only place in the library that reads Pixi'VN's history state, so developers
 * never have to pass the history manually: {@link GenerateOptions.history} is enough.
 * @returns The serialized history, or undefined if there is no history to inject.
 */
export function getNarrativeHistoryJson(): string | undefined {
    const history = stepHistory.narrativeHistory;
    if (!history || history.length === 0) {
        return undefined;
    }
    return JSON.stringify(history, null, 2);
}

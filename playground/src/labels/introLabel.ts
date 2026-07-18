import { narration, newLabel } from "@drincs/pixi-vn";

// A tiny scripted scene used only to populate Pixi'VN's narrative history,
// so the playground has something real to feed into `ai.dialog.generate({ history: true })`.
export const introLabel = newLabel("pixi-vn-ai-playground-intro", [
    async () => {
        narration.dialogue = {
            character: "advisor",
            text: "Your Majesty, the council awaits your decision.",
        };
    },
    async () => {
        narration.dialogue = {
            character: "king",
            text: "Let them wait. I have not yet decided what to reveal.",
        };
    },
    async () => {
        narration.dialogue = {
            character: "advisor",
            text: "The people grow restless. Silence will not protect you much longer.",
        };
    },
    async () => {
        narration.dialogue = {
            character: "king",
            text: "Then perhaps it is time they knew the truth about the crown.",
        };
    },
]);

export async function runIntroLabel() {
    await narration.call(introLabel, {});
    for (let i = 1; i < introLabel.stepCount; i++) {
        await narration.continue({});
    }
}

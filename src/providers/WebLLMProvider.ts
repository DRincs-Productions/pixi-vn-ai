import type { MLCEngineInterface } from "@mlc-ai/web-llm";
import type AIProvider from "../types/AIProvider";
import type DialogProvider from "../types/DialogProvider";

/**
 * Default local provider, backed by [WebLLM](https://github.com/mlc-ai/web-llm).
 *
 * Pixi'VN AI does not create or load the WebLLM engine itself, since that requires an
 * async model download and a progress callback the developer wants to control (e.g. to show
 * a loading bar). Create the engine with `CreateMLCEngine` (or `CreateWebWorkerMLCEngine`) and
 * pass it in:
 *
 * ```ts
 * const engine = await CreateMLCEngine("Llama-3.1-8B-Instruct-q4f32_1-MLC");
 * initAI({ provider: new WebLLMProvider(engine) });
 * ```
 */
export default class WebLLMProvider implements AIProvider {
    readonly name = "webllm";
    readonly dialog: DialogProvider;

    constructor(private engine: MLCEngineInterface) {
        this.dialog = {
            generateText: (prompt) => this.generateText(prompt),
        };
    }

    private async generateText(prompt: string): Promise<string> {
        const completion = await this.engine.chat.completions.create({
            messages: [{ role: "user", content: prompt }],
            stream: false,
        });
        return completion.choices[0]?.message?.content ?? "";
    }
}

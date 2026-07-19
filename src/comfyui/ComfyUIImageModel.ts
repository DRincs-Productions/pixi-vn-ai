import { Client, outToB64Urls } from "@stable-canvas/comfyui-client";
import type { ImageModel } from "ai";

/**
 * The `ImageModelV2` shape, picked out of the "ai" package's own `ImageModel` union so this file
 * doesn't need a direct dependency on `@ai-sdk/provider` just for types.
 */
type ImageModelV2 = Extract<ImageModel, { specificationVersion: "v2" }>;
type ImageModelV2CallOptions = Parameters<ImageModelV2["doGenerate"]>[0];

export interface ComfyUIImageModelOptions {
    /**
     * The ComfyUI server address, e.g. `"127.0.0.1:8188"` or `"my-comfyui.example.com"`.
     */
    apiHost: string;
    /**
     * Whether to connect over SSL/WSS.
     * @default false
     */
    ssl?: boolean;
    /**
     * The ComfyUI workflow to run, exported in **API format** (ComfyUI menu: "Save (API Format)").
     * Pixi'VN AI has no way to know how your workflow is structured (checkpoint, sampler, custom
     * nodes, ...), so you provide it, along with where to inject the prompt via
     * {@link promptNodeId}/{@link promptInputName}.
     */
    workflow: Record<string, unknown>;
    /**
     * The ID of the node (as it appears in {@link workflow}) whose input holds the positive
     * prompt text (typically a `CLIPTextEncode` node).
     */
    promptNodeId: string;
    /**
     * The name of the input on {@link promptNodeId} that holds the prompt text.
     * @default "text"
     */
    promptInputName?: string;
    /**
     * Milliseconds to wait for the workflow to finish before giving up.
     * @default 300000 (5 minutes)
     */
    timeoutMs?: number;
}

/**
 * An [AI SDK](https://ai-sdk.dev) `ImageModelV2` backed by a self-hosted
 * [ComfyUI](https://github.com/comfyanonymous/ComfyUI) server, so it can be passed directly as
 * `ai.init({ imageProvider: new ComfyUIImageModel({ ... }) })`.
 *
 * Since ComfyUI runs arbitrary node graphs rather than accepting a plain prompt, this model only
 * injects the developer request into the workflow node/input given by {@link
 * ComfyUIImageModelOptions.promptNodeId}/{@link ComfyUIImageModelOptions.promptInputName}: every
 * other parameter (checkpoint, sampler, seed, size, ...) is whatever the given workflow specifies.
 */
export default class ComfyUIImageModel implements ImageModelV2 {
    readonly specificationVersion = "v2" as const;
    readonly provider = "comfyui";
    readonly modelId: string;
    readonly maxImagesPerCall = 1;

    private readonly client: Client;

    constructor(private readonly options: ComfyUIImageModelOptions) {
        this.modelId = `comfyui:${options.promptNodeId}`;
        this.client = new Client({ api_host: options.apiHost, ssl: options.ssl });
    }

    async doGenerate(callOptions: ImageModelV2CallOptions) {
        const { promptNodeId, promptInputName = "text", timeoutMs = 5 * 60 * 1000 } = this.options;

        const workflow = structuredClone(this.options.workflow) as Record<
            string,
            { inputs: Record<string, unknown> }
        >;
        const node = workflow[promptNodeId];
        if (!node) {
            throw new Error(
                `ComfyUIImageModel: no node with id "${promptNodeId}" in the given workflow.`,
            );
        }
        node.inputs[promptInputName] = callOptions.prompt;

        const result = await this.client.enqueue_polling(workflow, { timeout_ms: timeoutMs });
        const images = await outToB64Urls(result);

        return {
            images,
            warnings: [],
            response: {
                timestamp: new Date(),
                modelId: this.modelId,
                headers: undefined,
            },
        };
    }
}

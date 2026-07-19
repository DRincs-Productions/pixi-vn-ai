import { beforeEach, describe, expect, it, vi } from "vitest";

const comfyMock = vi.hoisted(() => ({
    enqueuePolling: vi.fn(),
    outToB64Urls: vi.fn(),
}));

vi.mock("@stable-canvas/comfyui-client", () => ({
    // A regular `function` (not an arrow function) so `new Client(...)` works: arrow functions
    // aren't constructible, which is exactly what tripped this up initially.
    Client: vi.fn().mockImplementation(function (this: { enqueue_polling: unknown }) {
        this.enqueue_polling = comfyMock.enqueuePolling;
    }),
    outToB64Urls: comfyMock.outToB64Urls,
}));

const { default: ComfyUIImageModel } = await import("@/comfyui/ComfyUIImageModel");
const { Client } = await import("@stable-canvas/comfyui-client");

const WORKFLOW = {
    "6": {
        class_type: "CLIPTextEncode",
        inputs: { text: "placeholder", clip: ["4", 1] },
    },
    "9": {
        class_type: "SaveImage",
        inputs: { images: ["8", 0] },
    },
};

describe("ComfyUIImageModel", () => {
    beforeEach(() => {
        vi.clearAllMocks();
        comfyMock.enqueuePolling.mockResolvedValue({
            images: [{ type: "url", data: "http://127.0.0.1:8188/view?filename=out.png" }],
            prompt_id: "abc",
        });
        comfyMock.outToB64Urls.mockResolvedValue(["data:image/png;base64,abc123"]);
    });

    it("constructs the underlying Client with the given host and ssl option", () => {
        new ComfyUIImageModel({
            apiHost: "127.0.0.1:8188",
            ssl: true,
            workflow: WORKFLOW,
            promptNodeId: "6",
        });
        expect(Client).toHaveBeenCalledWith({ api_host: "127.0.0.1:8188", ssl: true });
    });

    it("declares itself as an ImageModelV2", () => {
        const model = new ComfyUIImageModel({
            apiHost: "127.0.0.1:8188",
            workflow: WORKFLOW,
            promptNodeId: "6",
        });
        expect(model.specificationVersion).toBe("v2");
        expect(model.provider).toBe("comfyui");
        expect(model.maxImagesPerCall).toBe(1);
    });

    it("injects the prompt into the given node/input and returns the base64 images", async () => {
        const model = new ComfyUIImageModel({
            apiHost: "127.0.0.1:8188",
            workflow: WORKFLOW,
            promptNodeId: "6",
        });

        const result = await model.doGenerate({ prompt: "A cat wizard." } as never);

        expect(result.images).toEqual(["data:image/png;base64,abc123"]);
        expect(comfyMock.enqueuePolling).toHaveBeenCalledTimes(1);
        const [submittedWorkflow] = comfyMock.enqueuePolling.mock.calls[0];
        expect(submittedWorkflow["6"].inputs.text).toBe("A cat wizard.");
        expect(comfyMock.outToB64Urls).toHaveBeenCalledWith({
            images: [{ type: "url", data: "http://127.0.0.1:8188/view?filename=out.png" }],
            prompt_id: "abc",
        });
    });

    it("uses a custom promptInputName when given", async () => {
        const model = new ComfyUIImageModel({
            apiHost: "127.0.0.1:8188",
            workflow: {
                "6": { class_type: "CLIPTextEncode", inputs: { prompt: "placeholder" } },
            },
            promptNodeId: "6",
            promptInputName: "prompt",
        });

        await model.doGenerate({ prompt: "A cat wizard." } as never);

        const [submittedWorkflow] = comfyMock.enqueuePolling.mock.calls[0];
        expect(submittedWorkflow["6"].inputs.prompt).toBe("A cat wizard.");
    });

    it("does not mutate the original workflow object across calls", async () => {
        const model = new ComfyUIImageModel({
            apiHost: "127.0.0.1:8188",
            workflow: WORKFLOW,
            promptNodeId: "6",
        });

        await model.doGenerate({ prompt: "First request." } as never);
        await model.doGenerate({ prompt: "Second request." } as never);

        expect(WORKFLOW["6"].inputs.text).toBe("placeholder");
        const [firstCallWorkflow] = comfyMock.enqueuePolling.mock.calls[0];
        const [secondCallWorkflow] = comfyMock.enqueuePolling.mock.calls[1];
        expect(firstCallWorkflow["6"].inputs.text).toBe("First request.");
        expect(secondCallWorkflow["6"].inputs.text).toBe("Second request.");
    });

    it("respects a custom timeoutMs", async () => {
        const model = new ComfyUIImageModel({
            apiHost: "127.0.0.1:8188",
            workflow: WORKFLOW,
            promptNodeId: "6",
            timeoutMs: 15000,
        });

        await model.doGenerate({ prompt: "A cat wizard." } as never);

        expect(comfyMock.enqueuePolling).toHaveBeenCalledWith(
            expect.any(Object),
            expect.objectContaining({ timeout_ms: 15000 }),
        );
    });

    it("throws a descriptive error when promptNodeId doesn't exist in the workflow", async () => {
        const model = new ComfyUIImageModel({
            apiHost: "127.0.0.1:8188",
            workflow: WORKFLOW,
            promptNodeId: "not-a-real-node",
        });

        await expect(model.doGenerate({ prompt: "A cat wizard." } as never)).rejects.toThrow(
            /no node with id "not-a-real-node"/,
        );
        expect(comfyMock.enqueuePolling).not.toHaveBeenCalled();
    });
});

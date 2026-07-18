import type DialogProvider from "./DialogProvider";
import type ImageProvider from "./ImageProvider";

/**
 * A Pixi'VN AI provider.
 *
 * A provider adapts a specific backend (WebLLM, an AI SDK model, a custom HTTP API, ...) to the
 * capabilities Pixi'VN AI needs. A provider is free to implement only the capabilities it
 * supports: a text-only provider can omit {@link image}, and vice versa.
 */
export default interface AIProvider {
    /**
     * Name of the provider, used for logging/debugging purposes.
     */
    readonly name: string;
    /**
     * Dialogue generation capability. Omit if the provider doesn't support it.
     */
    dialog?: DialogProvider;
    /**
     * Image generation capability. Omit if the provider doesn't support it.
     */
    image?: ImageProvider;
}

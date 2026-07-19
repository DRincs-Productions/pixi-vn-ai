import type { GeneratedFile } from "ai";

/**
 * Encode a generated file as a data URI, ready to use directly as a Pixi'VN image source.
 */
export default function toDataUri(file: GeneratedFile): string {
    return `data:${file.mediaType};base64,${file.base64}`;
}

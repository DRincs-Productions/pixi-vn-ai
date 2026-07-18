/**
 * Serialize a developer-provided object (or array of objects) into JSON.
 *
 * Pixi'VN AI never defines a `Character` model: developers pass whatever serializable shape
 * fits their game (a Pixi'VN `Character`, a plain object, a string, ...) and this is the only
 * place that turns it into prompt-ready JSON.
 * @param value The value to serialize. `undefined`/`null` are treated as "not provided".
 * @returns The serialized value, or undefined if there is nothing to inject.
 */
export function serializeObject(value: unknown): string | undefined {
    if (value === undefined || value === null) {
        return undefined;
    }
    if (Array.isArray(value) && value.length === 0) {
        return undefined;
    }
    return JSON.stringify(value, null, 2);
}

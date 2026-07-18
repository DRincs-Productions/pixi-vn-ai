import { serializeObject } from "@/context/ObjectsContext";
import { describe, expect, it } from "vitest";

describe("serializeObject", () => {
    it("returns undefined for undefined and null", () => {
        expect(serializeObject(undefined)).toBeUndefined();
        expect(serializeObject(null)).toBeUndefined();
    });

    it("returns undefined for an empty array", () => {
        expect(serializeObject([])).toBeUndefined();
    });

    it("serializes a plain object to JSON", () => {
        const value = { name: "King", mood: "worried" };
        expect(JSON.parse(serializeObject(value)!)).toEqual(value);
    });

    it("serializes an array of objects to JSON", () => {
        const value = [{ name: "King" }, { name: "Queen" }];
        expect(JSON.parse(serializeObject(value)!)).toEqual(value);
    });
});

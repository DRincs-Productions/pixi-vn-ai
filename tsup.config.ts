import { defineConfig } from "tsup";

export default defineConfig([
    {
        target: "es2020",
        entry: {
            index: "src/index.ts",
            prompt: "src/prompt/index.ts",
            providers: "src/providers/index.ts",
        },
        format: ["cjs", "esm"],
        dts: true,
        treeshake: true,
        clean: false,
        minify: true,
        bundle: true,
        skipNodeModulesBundle: false,
        external: ["@drincs/pixi-vn", "pixi.js", "ai", "@mlc-ai/web-llm"],
        esbuildOptions(options) {
            options.alias = {
                ...options.alias,
                "pixi.js": "@drincs/pixi-vn/pixi.js",
            };
        },
        outExtension({ format }) {
            return {
                js: format === "esm" ? ".mjs" : ".cjs",
            };
        },
    },
]);

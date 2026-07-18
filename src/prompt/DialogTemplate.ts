import type PromptTemplate from "../types/PromptTemplate";

/**
 * Built-in template used by {@link ai.dialog.generate}.
 *
 * Instructs the model to produce output that Pixi'VN can render directly: simple, readable
 * Markdown, with HTML allowed only when it's the only way to achieve a visual effect.
 */
const DialogTemplate: PromptTemplate = {
    instructions: [
        "You are generating narrative dialogue for a visual novel.",
        "Generate Markdown text.",
        "Keep the Markdown simple and readable.",
        "Do not use headings.",
        "Do not use tables.",
        "Do not use unnecessary lists.",
        "Use bold and italic only when they improve readability.",
        "HTML is allowed only when necessary; prefer <span> for styling (e.g. colors). Avoid excessive HTML usage.",
        "Return only the generated content.",
        "Do not explain the generated result.",
    ].join("\n"),
};

export default DialogTemplate;

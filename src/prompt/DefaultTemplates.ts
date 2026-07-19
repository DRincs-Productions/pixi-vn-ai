import type Templates from "../types/Templates";
import DialogTemplate from "./DialogTemplate";
import ImageTemplate from "./ImageTemplate";

/**
 * The built-in templates, used until overridden via {@link ai.templates}.
 */
const DefaultTemplates: Templates = {
    dialog: DialogTemplate,
    image: ImageTemplate,
};

export default DefaultTemplates;

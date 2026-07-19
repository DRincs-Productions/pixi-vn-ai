import type Templates from "../types/Templates";
import DialogTemplate from "./DialogTemplate";
import ImageTemplate from "./ImageTemplate";

/**
 * The built-in templates, used whenever {@link ai.init} is called without (or with a partial)
 * `templates` option.
 */
const DefaultTemplates: Templates = {
    dialog: DialogTemplate,
    image: ImageTemplate,
};

export default DefaultTemplates;

import { Assets, type AssetAliasIdType } from "@drincs/pixi-vn/canvas";

/**
 * Resolve a Pixi'VN asset alias into its actual URL.
 */
export default function resolveAssetUrl(alias: AssetAliasIdType): string {
    const resolved = Assets.resolver.resolveUrl(alias);
    return typeof resolved === "string" ? resolved : resolved[alias];
}

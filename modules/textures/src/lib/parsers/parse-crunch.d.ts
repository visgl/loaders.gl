import { TextureLevel } from "@loaders.gl/textures/types/texture";

/**
 * Parse texture data as "CRN" format. 
 * Function is "async" as emscriptified decoder module is loaded asyncronously
 * @param data - binary data of compressed texture
 * @returns Promise of Array of the texture levels
 */
export function parseCrunch(data, options: any): Promise<TextureLevel[]>;

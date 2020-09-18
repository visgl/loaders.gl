/**
 * Converter from i3s layer to 3d-tiles tileset
 */
export default class Tiles3DConverter {
  /**
   * Run conversion
   * @param options
   * @param options.inputUrl the url to read the tileset from
   * @param options.outputPath the output filename
   * @param options.tilesetName the output name of the tileset
   * @param options.maxDepth The max tree depth of conversion
   */
  convert(options: {inputUrl: string; outputPath: string; tilesetName: string; maxDepth?: number});
}

/**
  * Converter for a 3d tileset
  */
export default class I3SConverter {
  // constructor();

  /**
   * Convert a 3d tileset
   * @param options
   * @param options.inputUrl the url to read the tileset from
   * @param options.outputPath the output filename
   * @param options.tilesetName the output name of the tileset
   * @param options.maxDepth The max tree depth of conversion
   */
  convert(options: {
    inputUrl: string;
    outputPath: string;
    tilesetName: string;
    maxDepth?: number;
    draco?: boolean;
  }): Promise<any>;
}

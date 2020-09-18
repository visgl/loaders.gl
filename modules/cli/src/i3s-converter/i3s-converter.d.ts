/**
 * Converter from 3d-tiles tileset to i3s layer
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
   * @param options.slpk Generate slpk (Scene Layer Packages) output file
   * @param options.inputType Input type of file. Can be 3DTILES or I3S
   * @param options.sevenZipExe Location of 7z.exe archiver to create slpk on Windows
   */
  convert(options: {
    inputUrl: string;
    outputPath: string;
    tilesetName: string;
    sevenZipExe: string;
    maxDepth?: number;
    slpk?: boolean;
    inputType: string;
  }): Promise<any>;
}

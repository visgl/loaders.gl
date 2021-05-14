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
   * @param options.sevenZipExe Location of 7z.exe archiver to create slpk on Windows
   * @param options.egmFilePath location of *.pgm file to convert heights from ellipsoidal to gravity-related format
   * @param options.token Token for Cesium ION tilesets authentication
   * @param options.draco Generate I3S 1.7 draco compressed geometries
   * @param options.validate -enable validation
   */
  convert(options: {
    inputUrl: string;
    outputPath: string;
    tilesetName: string;
    sevenZipExe: string;
    egmFilePath?: string;
    maxDepth?: number;
    slpk?: boolean;
    token?: string;
    draco?: boolean;
    validate?: boolean;
  }): Promise<any>;
}

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
   * @param options.egmFilePath location of *.pgm file to convert heights from ellipsoidal to gravity-related format
   * @param options.maxDepth The max tree depth of conversion
   */
  convert(options: {
    inputUrl: string;
    outputPath: string;
    tilesetName: string;
    egmFilePath?: string;
    maxDepth?: number;
  });

  /**
   * The recursive function of traversal of a nodes tree
   * @param parentSourceNode the parent node tile object (@loaders.gl/tiles/Tile3D)
   * @param parentNode object in resulting tileset
   * @param level a current level of a tree depth
   */
  _addChildren(parentSourceNode: object, parentNode: object, level: number): Promise<void>;

  /**
   * Load a child node having information from the node header
   * @param parentNode a parent node tile object (@loaders.gl/tiles/Tile3D)
   * @param childNodeInfo child information from 3DNodeIndexDocument
   *   (https://github.com/Esri/i3s-spec/blob/master/docs/1.7/nodeReference.cmn.md)
   */
  _loadChildNode(parentNode: object, childNodeInfo: object): Promise<void>;

  /**
   * Make an url of a resource from its relative url having the base url
   * @param baseUrl the base url. A resulting url will be related from this url
   * @param relativeUrl a realtive url of a resource
   */
  _relativeUrlToFullUrl(baseUrl: string, relativeUrl: string): string;
}

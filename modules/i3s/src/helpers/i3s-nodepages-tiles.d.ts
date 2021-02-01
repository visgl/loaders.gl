/**
 * class I3SNodePagesTiles - loads nodePages and form i3s tiles from them
 */
export default class I3SNodePagesTiles {
  /**
   * @constructs
   * Create a I3SNodePagesTiles instance.
   * @param tileset - i3s tileset header ('layers/0')
   * @param options - i3s loader options
   */
  constructor(tileset: Object, options: Object);

  /**
   * Loads some nodePage and return a particular node from it
   * @param id - id of node through all node pages
   */
  getNodeById(id: number);

  /**
   * Forms tile header using node and tileset data
   * @param id - id of node through all node pages
   */
  formTileFromNodePages(id: number);
}

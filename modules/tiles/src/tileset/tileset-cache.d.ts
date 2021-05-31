/**
 * Stores tiles with content loaded.
 *
 * @private
 */
export default class TilesetCache {
  constructor();

  reset();

  touch(tile);

  add(tileset, tile, addCallback);

  unloadTile(tileset, tile, unloadCallback);

  unloadTiles(tileset, unloadCallback);

  trim();
}

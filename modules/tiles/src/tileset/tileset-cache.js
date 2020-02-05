// This file is derived from the Cesium code base under Apache 2 license
// See LICENSE.md and https://github.com/AnalyticalGraphicsInc/cesium/blob/master/LICENSE.md

import DoublyLinkedList from '../utils/doubly-linked-list';

function defined(x) {
  return x !== undefined && x !== null;
}

/**
 * Stores tiles with content loaded.
 *
 * @private
 */
export default class TilesetCache {
  constructor() {
    // [head, sentinel) -> tiles that weren't selected this frame and may be removed from the cache
    // (sentinel, tail] -> tiles that were selected this frame
    this._list = new DoublyLinkedList();
    this._sentinel = this._list.add('sentinel');
    this._trimTiles = false;
  }

  reset() {
    // Move sentinel node to the tail so, at the start of the frame, all tiles
    // may be potentially replaced.  Tiles are moved to the right of the sentinel
    // when they are selected so they will not be replaced.
    this._list.splice(this._list.tail, this._sentinel);
  }

  touch(tile) {
    const node = tile._cacheNode;
    if (defined(node)) {
      this._list.splice(this._sentinel, node);
    }
  }

  add(tileset, tile, addCallback) {
    if (!defined(tile._cacheNode)) {
      tile._cacheNode = this._list.add(tile);

      if (addCallback) {
        addCallback(tileset, tile);
      }
    }
  }

  unloadTile(tileset, tile, unloadCallback) {
    const node = tile._cacheNode;
    if (!defined(node)) {
      return;
    }

    this._list.remove(node);
    tile._cacheNode = undefined;
    if (unloadCallback) {
      unloadCallback(tileset, tile);
    }
  }

  unloadTiles(tileset, unloadCallback) {
    const trimTiles = this._trimTiles;
    this._trimTiles = false;

    const list = this._list;

    const maximumMemoryUsageInBytes = tileset.maximumMemoryUsage * 1024 * 1024;

    // Traverse the list only to the sentinel since tiles/nodes to the
    // right of the sentinel were used this frame.
    // The sub-list to the left of the sentinel is ordered from LRU to MRU.
    const sentinel = this._sentinel;
    let node = list.head;

    while (
      node !== sentinel &&
      (tileset.gpuMemoryUsageInBytes > maximumMemoryUsageInBytes || trimTiles)
    ) {
      const tile = node.item;
      node = node.next;
      this.unloadTile(tileset, tile, unloadCallback);
    }
  }

  trim() {
    this._trimTiles = true;
  }
}

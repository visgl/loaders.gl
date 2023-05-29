// loaders.gl, MIT license

// This file is derived from the Cesium code base under Apache 2 license
// See LICENSE.md and https://github.com/AnalyticalGraphicsInc/cesium/blob/master/LICENSE.md

import type {Tileset3D} from './tileset-3d';
import type {Tile3D} from './tile-3d';
import {DoublyLinkedList} from '../utils/doubly-linked-list';

/**
 * Stores tiles with content loaded.
 * @private
 */
export class TilesetCache {
  private _list: DoublyLinkedList;
  private _sentinel: any;
  private _trimTiles: boolean;

  constructor() {
    // [head, sentinel) -> tiles that weren't selected this frame and may be removed from the cache
    // (sentinel, tail] -> tiles that were selected this frame
    this._list = new DoublyLinkedList();
    this._sentinel = this._list.add('sentinel');
    this._trimTiles = false;
  }

  reset(): void {
    // Move sentinel node to the tail so, at the start of the frame, all tiles
    // may be potentially replaced.  Tiles are moved to the right of the sentinel
    // when they are selected so they will not be replaced.
    this._list.splice(this._list.tail, this._sentinel);
  }

  touch(tile: Tile3D): void {
    const node = tile._cacheNode;
    if (node) {
      this._list.splice(this._sentinel, node);
    }
  }

  add(
    tileset: Tileset3D,
    tile: Tile3D,
    addCallback?: (tileset: Tileset3D, tile: Tile3D) => void
  ): void {
    if (!tile._cacheNode) {
      tile._cacheNode = this._list.add(tile);

      if (addCallback) {
        addCallback(tileset, tile);
      }
    }
  }

  unloadTile(
    tileset: Tileset3D,
    tile: Tile3D,
    unloadCallback?: (tileset: Tileset3D, tile: Tile3D) => void
  ): void {
    const node = tile._cacheNode;
    if (!node) {
      return;
    }

    this._list.remove(node);
    tile._cacheNode = null;
    if (unloadCallback) {
      unloadCallback(tileset, tile);
    }
  }

  unloadTiles(tileset, unloadCallback): void {
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
      // @ts-expect-error
      const tile = node.item;
      // @ts-expect-error
      node = node.next;
      this.unloadTile(tileset, tile, unloadCallback);
    }
  }

  trim(): void {
    this._trimTiles = true;
  }
}

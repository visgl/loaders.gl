// This file is derived from the Cesium code base under Apache 2 license
// See LICENSE.md and https://github.com/AnalyticalGraphicsInc/cesium/blob/master/LICENSE.md

import {fetchFile, load} from '@loaders.gl/core';
import {Tiles3DLoader} from '@loaders.gl/3d-tiles';
import {Tileset3D} from '@loaders.gl/tiles';

/** @typedef {import('@loaders.gl/tiles').Tile3D} Tile3D */

/**
 * @returns {Promise<Tile3D>}
 */
export async function loadRootTile(t, tilesetUrl) {
  try {
    // Load tileset
    const tilesetJson = await load(tilesetUrl, Tiles3DLoader);
    const tileset = new Tileset3D(tilesetJson, tilesetUrl);

    // Load root tile
    /** @type {Tile3D} */
    // @ts-ignore
    const sourceRootTile = tileset.root;
    await tileset._loadTile(sourceRootTile);
    return sourceRootTile;
  } catch (error) {
    t.fail(`Failed to load tile from ${tilesetUrl}: ${error}`);
    throw error;
  }
}

export async function loadTileset(t, tilesetUrl) {
  try {
    // Load tileset
    const tileset = await load(tilesetUrl, Tiles3DLoader);
    const tileset3d = new Tileset3D(tileset, tilesetUrl);
    return tileset3d;
  } catch (error) {
    t.fail(`Failed to load tile from ${tilesetUrl}: ${error}`);
    throw error;
  }
}

export async function loadRootTileFromTileset(t, tilesetUrl) {
  try {
    // Load tileset
    const tileset = await load(tilesetUrl, Tiles3DLoader);
    const tileset3d = new Tileset3D(tileset);

    // Load binary data for root tile
    // @ts-ignore root is possibly null
    const response = await fetchFile(tileset3d.root.contentUrl);
    return response.arrayBuffer();
    // return tile;
  } catch (error) {
    t.fail(`Failed to load tile from ${tilesetUrl}: ${error}`);
    throw error;
  }
}

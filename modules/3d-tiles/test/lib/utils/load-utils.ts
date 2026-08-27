// loaders.gl
// SPDX-License-Identifier: MIT AND Apache-2.0
// Copyright vis.gl contributors

// This file is derived from the Cesium code base under Apache 2 license
// See LICENSE.md and https://github.com/AnalyticalGraphicsInc/cesium/blob/master/LICENSE.md

import {coreApi, fetchFile, load} from '@loaders.gl/core';
import {Tiles3DLoader} from '@loaders.gl/3d-tiles';
import {Tiles3DSource, Tileset3D} from '@loaders.gl/tiles';
import type {Tile3D} from '@loaders.gl/tiles';

/** @typedef {import('@loaders.gl/tiles').Tile3D} Tile3D */

/** Loads and parses the root content tile for a local 3D Tiles fixture. */
export async function loadRootTile(tilesetUrl: string): Promise<Tile3D> {
  const tilesetJson = await load(tilesetUrl, Tiles3DLoader, {worker: false});
  const tileset = new Tileset3D(new Tiles3DSource({...tilesetJson, coreApi}));

  /** @type {Tile3D} */
  // @ts-ignore
  const sourceRootTile = tileset.root as Tile3D;
  await tileset._loadTile(sourceRootTile);
  return sourceRootTile;
}

/** Loads a local tileset fixture into the shared runtime. */
export async function loadTileset(tilesetUrl: string): Promise<Tileset3D> {
  const tileset = await load(tilesetUrl, Tiles3DLoader, {worker: false});
  return new Tileset3D(new Tiles3DSource({...tileset, coreApi}));
}

/** Returns the unparsed root-content bytes declared by a local tileset fixture. */
export async function loadRootTileFromTileset(tilesetUrl: string): Promise<ArrayBuffer> {
  const tileset = await load(tilesetUrl, Tiles3DLoader, {worker: false});
  const tileset3d = new Tileset3D(new Tiles3DSource({...tileset, coreApi}));

  // @ts-ignore root is possibly null
  const response = await fetchFile(tileset3d.root.contentUrl);
  return response.arrayBuffer();
}

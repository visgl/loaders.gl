// loaders.gl
// SPDX-License-Identifier: MIT AND Apache-2.0
// Copyright vis.gl contributors

// This file is derived from the Cesium code base under Apache 2 license
// See LICENSE.md and https://github.com/AnalyticalGraphicsInc/cesium/blob/master/LICENSE.md

// Reference code:
// https://github.com/AnalyticalGraphicsInc/cesium/blob/master/Source/Scene/Composite3DTileContent.js#L182

import type {LoaderContext} from '@loaders.gl/loader-utils';
import type {Tiles3DLoaderOptions} from '../../tiles-3d-loader';
import {parse3DTileHeaderSync} from './helpers/parse-3d-tile-header';
import {Tiles3DTileContent} from '../../types';

/** Resolve circulate dependency by passing in parsing function as argument */
type Parse3DTile = (
  arrayBuffer: ArrayBuffer,
  byteOffset: number,
  options: Tiles3DLoaderOptions | undefined,
  context: LoaderContext | undefined,
  subtile
) => Promise<number>;

// eslint-disable-next-line max-params
export async function parseComposite3DTile(
  tile: Tiles3DTileContent,
  arrayBuffer: ArrayBuffer,
  byteOffset: number,
  options: Tiles3DLoaderOptions | undefined,
  context: LoaderContext | undefined,
  parse3DTile: Parse3DTile
): Promise<number> {
  byteOffset = parse3DTileHeaderSync(tile, arrayBuffer, byteOffset);

  const view = new DataView(arrayBuffer);

  // Extract number of tiles
  tile.tilesLength = view.getUint32(byteOffset, true);
  byteOffset += 4;

  // extract each tile from the byte stream
  tile.tiles = [];
  while (tile.tiles.length < tile.tilesLength && (tile.byteLength || 0) - byteOffset > 12) {
    const subtile: Tiles3DTileContent = {shape: 'tile3d'};
    tile.tiles.push(subtile);
    byteOffset = await parse3DTile(arrayBuffer, byteOffset, options, context, subtile);
    // TODO - do we need to add any padding in between tiles?
  }

  return byteOffset;
}

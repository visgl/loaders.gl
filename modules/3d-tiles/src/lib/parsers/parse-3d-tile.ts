// loaders.gl
// SPDX-License-Identifier: MIT AND Apache-2.0
// Copyright vis.gl contributors

// This file is derived from the Cesium code base under Apache 2 license
// See LICENSE.md and https://github.com/AnalyticalGraphicsInc/cesium/blob/master/LICENSE.md

import {TILE3D_TYPE} from '../constants';
import {getMagicString} from './helpers/parse-utils';

import {parsePointCloud3DTile} from './parse-3d-tile-point-cloud';
import {parseBatchedModel3DTile} from './parse-3d-tile-batched-model';
import {parseInstancedModel3DTile} from './parse-3d-tile-instanced-model';
import {parseComposite3DTile} from './parse-3d-tile-composite';
import {parseGltf3DTile} from './parse-3d-tile-gltf';
import {LoaderContext} from '@loaders.gl/loader-utils';
import {Tiles3DLoaderOptions} from '../../tiles-3d-loader';
import {Tiles3DTileContent} from '../../types';
import type {Tiles3DBinaryContentType, Tiles3DContentType} from './preprocess-3d-tile-content';

/**
 * Parses one binary or JSON glTF 3D Tiles content payload.
 *
 * Composite children omit `contentType` and continue to identify themselves from their embedded
 * magic. Top-level payloads pass the structure-first label so JSON glTF and normalized `glb`
 * content can share the established glTF parser.
 *
 * @param arrayBuffer - Complete resource or enclosing composite bytes.
 * @param byteOffset - First byte of the content inside `arrayBuffer`.
 * @param options - 3D Tiles and delegated glTF loader options.
 * @param context - Loader context used for nested glTF resources.
 * @param tile - Mutable result object populated by the format parser.
 * @param contentType - Optional resource-boundary classification from preprocessing.
 * @returns Number of bytes consumed by the parsed content.
 */
export async function parse3DTile(
  arrayBuffer: ArrayBuffer,
  byteOffset = 0,
  options: Tiles3DLoaderOptions | undefined,
  context: LoaderContext | undefined,
  tile: Tiles3DTileContent = {shape: 'tile3d'},
  contentType?: Tiles3DContentType
): Promise<number> {
  tile.byteOffset = byteOffset;
  tile.type = getParserContentType(contentType) || getMagicString(arrayBuffer, byteOffset);

  switch (tile.type) {
    case TILE3D_TYPE.COMPOSITE:
      // Note: We pass this function as argument so that embedded tiles can be parsed recursively
      return await parseComposite3DTile(
        tile,
        arrayBuffer,
        byteOffset,
        options,
        context,
        parse3DTile
      );

    case TILE3D_TYPE.BATCHED_3D_MODEL:
      return await parseBatchedModel3DTile(tile, arrayBuffer, byteOffset, options, context);

    case TILE3D_TYPE.GLTF:
      return await parseGltf3DTile(tile, arrayBuffer, options, context);

    case TILE3D_TYPE.INSTANCED_3D_MODEL:
      return await parseInstancedModel3DTile(tile, arrayBuffer, byteOffset, options, context);

    case TILE3D_TYPE.POINT_CLOUD:
      return await parsePointCloud3DTile(tile, arrayBuffer, byteOffset, options, context);

    default:
      throw new Error(`3DTileLoader: unknown type ${tile.type}`); // eslint-disable-line
  }
}

/**
 * Maps the structure-first preprocessor label to the historical parser magic.
 *
 * Binary glTF uses `glTF` as its on-wire magic, while preprocessing calls it `glb` to distinguish
 * it from JSON glTF. Both glTF representations use the same downstream glTF parser.
 *
 * @param contentType - Preprocessed content label, when parsing starts at the resource boundary.
 * @returns Parser type or `undefined` when nested composite parsing should read its own magic.
 */
function getParserContentType(
  contentType?: Tiles3DContentType
): Tiles3DBinaryContentType | 'glTF' | undefined {
  if (contentType === 'glb' || contentType === 'gltf') {
    return TILE3D_TYPE.GLTF as 'glTF';
  }
  if (contentType === 'externalTileset' || !contentType) {
    return undefined;
  }
  return contentType as Tiles3DBinaryContentType;
}

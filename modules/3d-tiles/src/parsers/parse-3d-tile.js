import {TILE3D_TYPE} from '../constants';
import {getMagicString} from './helpers/parse-utils';

import parsePointCloud3DTile from './parse-3d-tile-point-cloud';
import parseBatchedModel3DTile from './parse-3d-tile-batched-model';
import parseInstancedModel3DTile from './parse-3d-tile-instanced-model';
import parseComposite3DTile from './parse-3d-tile-composite';

// Extracts
export default async function parse3DTile(arrayBuffer, byteOffset = 0, options = {}, tile = {}) {
  tile.byteOffset = byteOffset;
  tile.type = getMagicString(arrayBuffer, byteOffset);

  switch (tile.type) {
    case TILE3D_TYPE.COMPOSITE:
      // Note: We pass this function as argument so that embedded tiles can be parsed recursively
      return parseComposite3DTile(tile, arrayBuffer, byteOffset, options, parse3DTile);

    case TILE3D_TYPE.BATCHED_3D_MODEL:
      return parseBatchedModel3DTile(tile, arrayBuffer, byteOffset, options);

    case TILE3D_TYPE.INSTANCED_3D_MODEL:
      return parseInstancedModel3DTile(tile, arrayBuffer, byteOffset, options);

    case TILE3D_TYPE.POINT_CLOUD:
      return parsePointCloud3DTile(tile, arrayBuffer, byteOffset, options);

    default:
      throw new Error(`3DTileLoader: unknown type ${tile.type}`); // eslint-disable-line
  }
}

import {MAGIC} from '../constants';
import {getMagicString} from './parse-utils';

import parsePointCloud3DTileSync from './parse-point-cloud-3d-tile';
import parseBatchedModel3DTileSync from './parse-batched-model-3d-tile';
import parseInstancedModel3DTileSync from './parse-instanced-model-3d-tile';
import parseComposite3DTileSync from './parse-composite-3d-tile';

// Extracts
export default function parse3DTileSync(arrayBuffer, byteOffset = 0, options = {}, tile = {}) {
  const magicString = getMagicString(arrayBuffer, byteOffset);

  switch (magicString) {
    case MAGIC.COMPOSITE:
      // Note: We pass this function as argument so that embedded tiles can be parsed recursively
      return parseComposite3DTileSync(tile, arrayBuffer, byteOffset, options, parse3DTileSync);

    case MAGIC.BATCHED_3D_MODEL:
      return parseBatchedModel3DTileSync(tile, arrayBuffer, byteOffset, options);

    case MAGIC.INSTANCED_3D_MODEL:
      return parseInstancedModel3DTileSync(tile, arrayBuffer, byteOffset, options);

    case MAGIC.POINTCLOUD:
      return parsePointCloud3DTileSync(tile, arrayBuffer, byteOffset, options);

    default:
      throw new Error(`Unknown tile type ${magicString}`); // eslint-disable-line
  }
}

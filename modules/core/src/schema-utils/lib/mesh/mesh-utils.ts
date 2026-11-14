// loaders.gl
// SPDX-License-Identifier: MIT
// Copyright (c) vis.gl contributors

// Mesh category utilities
// TODO - move to mesh category module, or to math.gl/geometry module
import type {TypedArray} from '../../types/types';

export {getMeshBoundingBox} from './get-mesh-bounding-box';

type TypedArrays = {[key: string]: TypedArray};

/**
 * Get number of vertices in mesh
 * @param attributes
 */
export function getMeshSize(attributes: TypedArrays): number {
  let size = 0;
  for (const attributeName in attributes) {
    const attribute = attributes[attributeName];
    if (ArrayBuffer.isView(attribute)) {
      // @ts-ignore DataView doesn't have BYTES_PER_ELEMENT
      size += attribute.byteLength * attribute.BYTES_PER_ELEMENT;
    }
  }
  return size;
}

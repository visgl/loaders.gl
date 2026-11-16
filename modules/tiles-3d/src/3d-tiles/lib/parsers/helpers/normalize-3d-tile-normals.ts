// loaders.gl
// SPDX-License-Identifier: MIT
// Copyright vis.gl contributors

import {Vector3} from '@math.gl/core';
import {octDecode} from '@math.gl/geometry';
import {Tiles3DTileContent} from '../../../types';

const scratchNormal = new Vector3();

export function normalize3DTileNormalAttribute(
  tile: Tiles3DTileContent,
  normals: Float32Array | Uint8Array | null
): {size: number; value: Float32Array} | null {
  if (!normals) {
    return null;
  }

  if (tile.isOctEncoded16P) {
    /** Each octahedral component pair decodes to one XYZ normal. */
    const pointCount = normals.length / 2;
    const decodedArray = new Float32Array(pointCount * 3);
    for (let i = 0; i < pointCount; i++) {
      octDecode(normals[i * 2], normals[i * 2 + 1], scratchNormal);
      // @ts-ignore
      scratchNormal.toArray(decodedArray, i * 3);
    }

    return {
      size: 3,
      value: decodedArray
    };
  }

  return {
    size: 3,
    value: normals as Float32Array
  };
}

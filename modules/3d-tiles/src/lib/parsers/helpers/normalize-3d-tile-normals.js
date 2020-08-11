import {Vector3} from '@math.gl/core';
import {GL, octDecode} from '@loaders.gl/math';

const scratchNormal = new Vector3();

export function normalize3DTileNormalAttribute(tile, normals) {
  if (!normals) {
    return null;
  }

  if (tile.isOctEncoded16P) {
    const decodedArray = new Float32Array(tile.pointsLength * 3);
    for (let i = 0; i < tile.pointsLength; i++) {
      octDecode(normals[i * 2], normals[i * 2 + 1], scratchNormal);
      scratchNormal.toArray(decodedArray, i * 3);
    }

    return {
      type: GL.FLOAT,
      size: 2,
      value: decodedArray
    };
  }

  return {
    type: GL.FLOAT,
    size: 2,
    value: normals
  };
}

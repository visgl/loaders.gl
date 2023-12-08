// loaders.gl
// SPDX-License-Identifier: MIT
// Copyright vis.gl contributors

import {GLType} from '@loaders.gl/math'; // '@math.gl/geometry';
import {assert} from '@loaders.gl/loader-utils';

const COMPONENTS_PER_ATTRIBUTE = {
  SCALAR: 1,
  VEC2: 2,
  VEC3: 3,
  VEC4: 4,
  MAT2: 4,
  MAT3: 9,
  MAT4: 16
};

// TODO - could just return typed array views...
// prettier-ignore
const UNPACKER = {
  SCALAR: (values, i) => values[i],
  VEC2: (values, i) => [values[2 * i + 0], values[2 * i + 1]],
  VEC3: (values, i) => [values[3 * i + 0], values[3 * i + 1], values[3 * i + 2]],
  VEC4: (values, i) => [values[4 * i + 0], values[4 * i + 1], values[4 * i + 2], values[4 * i + 3]],
  // TODO: check column major
  MAT2: (values, i) => [
    values[4 * i + 0], values[4 * i + 1],
    values[4 * i + 2], values[4 * i + 3]
  ],
  MAT3: (values, i) => [
    values[9 * i + 0], values[9 * i + 1], values[9 * i + 2],
    values[9 * i + 3], values[9 * i + 4], values[9 * i + 5],
    values[9 * i + 6], values[9 * i + 7], values[9 * i + 8]
  ],
  MAT4: (values, i) => [
    values[16 * i + 0], values[16 * i + 1], values[16 * i + 2], values[16 * i + 3],
    values[16 * i + 4], values[16 * i + 5], values[16 * i + 6], values[16 * i + 7],
    values[16 * i + 8], values[16 * i + 9], values[16 * i + 10], values[16 * i + 11],
    values[16 * i + 12], values[16 * i + 13], values[16 * i + 14], values[16 * i + 15]
  ]
};

const PACKER = {
  SCALAR: (x, values, i) => {
    values[i] = x;
  },
  VEC2: (x, values, i) => {
    values[2 * i + 0] = x[0];
    values[2 * i + 1] = x[1];
  },
  VEC3: (x, values, i) => {
    values[3 * i + 0] = x[0];
    values[3 * i + 1] = x[1];
    values[3 * i + 2] = x[2];
  },
  VEC4: (x, values, i) => {
    values[4 * i + 0] = x[0];
    values[4 * i + 1] = x[1];
    values[4 * i + 2] = x[2];
    values[4 * i + 3] = x[3];
  },
  // TODO: check column major correctness
  MAT2: (x, values, i) => {
    values[4 * i + 0] = x[0];
    values[4 * i + 1] = x[1];
    values[4 * i + 2] = x[2];
    values[4 * i + 3] = x[3];
  },
  MAT3: (x, values, i) => {
    values[9 * i + 0] = x[0];
    values[9 * i + 1] = x[1];
    values[9 * i + 2] = x[2];
    values[9 * i + 3] = x[3];
    values[9 * i + 4] = x[4];
    values[9 * i + 5] = x[5];
    values[9 * i + 6] = x[6];
    values[9 * i + 7] = x[7];
    values[9 * i + 8] = x[8];
    values[9 * i + 9] = x[9];
  },
  MAT4: (x, values, i) => {
    values[16 * i + 0] = x[0];
    values[16 * i + 1] = x[1];
    values[16 * i + 2] = x[2];
    values[16 * i + 3] = x[3];
    values[16 * i + 4] = x[4];
    values[16 * i + 5] = x[5];
    values[16 * i + 6] = x[6];
    values[16 * i + 7] = x[7];
    values[16 * i + 8] = x[8];
    values[16 * i + 9] = x[9];
    values[16 * i + 10] = x[10];
    values[16 * i + 11] = x[11];
    values[16 * i + 12] = x[12];
    values[16 * i + 13] = x[13];
    values[16 * i + 14] = x[14];
    values[16 * i + 15] = x[15];
  }
};

export function createTypedArrayFromAccessor(tile3DAccessor, buffer, byteOffset, length) {
  const {componentType} = tile3DAccessor;
  assert(tile3DAccessor.componentType);
  const type = typeof componentType === 'string' ? GLType.fromName(componentType) : componentType;
  const size = COMPONENTS_PER_ATTRIBUTE[tile3DAccessor.type];
  const unpacker = UNPACKER[tile3DAccessor.type];
  const packer = PACKER[tile3DAccessor.type];

  byteOffset += tile3DAccessor.byteOffset;
  const values = GLType.createTypedArray(type, buffer, byteOffset, size * length);

  return {
    values,
    type,
    size,
    unpacker,
    packer
  };
}

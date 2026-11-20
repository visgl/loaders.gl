// loaders.gl
// SPDX-License-Identifier: MIT
// Copyright vis.gl contributors

import type {TypedArrayConstructor} from '@math.gl/core/types';

/** Component names and legacy numeric identifiers accepted in 3D Tiles binary tables. */
const TILE_COMPONENT_ARRAYS: Readonly<Record<string, TypedArrayConstructor>> = {
  BYTE: Int8Array,
  UNSIGNED_BYTE: Uint8Array,
  SHORT: Int16Array,
  UNSIGNED_SHORT: Uint16Array,
  INT: Int32Array,
  UNSIGNED_INT: Uint32Array,
  FLOAT: Float32Array,
  DOUBLE: Float64Array,
  UNSIGNED_SHORT_4_4_4_4: Uint16Array,
  UNSIGNED_SHORT_5_5_5_1: Uint16Array,
  UNSIGNED_SHORT_5_6_5: Uint16Array,
  5120: Int8Array,
  5121: Uint8Array,
  5122: Int16Array,
  5123: Uint16Array,
  5124: Int32Array,
  5125: Uint32Array,
  5126: Float32Array,
  5130: Float64Array,
  32819: Uint16Array,
  32820: Uint16Array,
  33635: Uint16Array
};

/** Returns the array constructor for a component identifier read from a binary table. */
export function getTileComponentArrayType(componentType: string | number): TypedArrayConstructor {
  if (!Object.hasOwn(TILE_COMPONENT_ARRAYS, componentType)) {
    throw new Error(`Unsupported 3D Tiles component type: ${componentType}`);
  }
  return TILE_COMPONENT_ARRAYS[componentType];
}

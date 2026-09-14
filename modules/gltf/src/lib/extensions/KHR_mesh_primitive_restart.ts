// loaders.gl
// SPDX-License-Identifier: MIT
// Copyright vis.gl contributors

import type {NumericArray} from '@loaders.gl/loader-utils';
import type {GLTFLoaderOptions} from '../../gltf-loader';
import type {GLTFAccessor, GLTFMeshPrimitive} from '../types/gltf-json-schema';
import type {GLTFWithBuffers} from '../types/gltf-types';
import type {
  GLTFPrimitiveIndexRange,
  GLTFPrimitiveRestartData
} from '../types/gltf-vector-topology';
import {GLTFIterator} from '../api/gltf-iterator';

/** Draft Khronos primitive-restart extension name. */
export const name = 'KHR_mesh_primitive_restart';

const SUPPORTED_MODES = new Set([2, 3, 5, 6]);

/** Decode primitive-restart ranges for all indexed primitives in the asset. */
export async function decode(gltfData: GLTFWithBuffers, options: GLTFLoaderOptions): Promise<void> {
  if (!gltfData.json.extensionsUsed?.includes(name)) {
    return;
  }
  if (!gltfData.json.extensionsRequired?.includes(name)) {
    throw new Error(`${name} must be declared in extensionsRequired`);
  }
  if (!options.gltf?.loadBuffers) {
    return;
  }

  const iterator = new GLTFIterator(gltfData);
  for (const mesh of iterator.meshes) {
    for (const primitive of iterator.getReferences(mesh).primitives) {
      decodePrimitiveRestart(iterator, primitive);
    }
  }
}

/** Decode and validate one primitive's restart markers. */
function decodePrimitiveRestart(iterator: GLTFIterator, primitive: GLTFMeshPrimitive): void {
  if (primitive.indices === undefined) {
    return;
  }
  const accessor = iterator.data.accessors?.[primitive.indices];
  if (!accessor) {
    throw new Error(`${name}: primitive references missing indices accessor ${primitive.indices}`);
  }
  const restartIndex = getRestartIndex(accessor);
  const indices = iterator.getTypedArrayForAccessor(primitive.indices) as NumericArray;
  const containsRestart = Array.prototype.includes.call(indices, restartIndex);

  if (!SUPPORTED_MODES.has(primitive.mode ?? 4)) {
    if (containsRestart) {
      throw new Error(`${name}: primitive restart is not valid for mode ${primitive.mode ?? 4}`);
    }
    return;
  }

  Object.defineProperty(primitive, 'primitiveRestart', {
    configurable: true,
    enumerable: false,
    writable: true,
    value: {
      restartIndex,
      ranges: getPrimitiveRestartRanges(indices, restartIndex)
    } satisfies GLTFPrimitiveRestartData
  });
}

/** Return the restart value for a valid unsigned scalar index accessor. */
function getRestartIndex(accessor: GLTFAccessor): number {
  if (accessor.type !== 'SCALAR') {
    throw new Error(`${name}: indices accessor must have SCALAR type`);
  }
  switch (accessor.componentType) {
    case 5121:
      return 0xff;
    case 5123:
      return 0xffff;
    case 5125:
      return 0xffffffff;
    default:
      throw new Error(`${name}: indices accessor must use an unsigned integer component type`);
  }
}

/** Split an index accessor into non-empty source ranges without copying index data. */
export function getPrimitiveRestartRanges(
  indices: ArrayLike<number>,
  restartIndex: number
): GLTFPrimitiveIndexRange[] {
  const ranges: GLTFPrimitiveIndexRange[] = [];
  let rangeStart = 0;
  for (let index = 0; index <= indices.length; index++) {
    if (index === indices.length || indices[index] === restartIndex) {
      if (index > rangeStart) {
        ranges.push({offset: rangeStart, count: index - rangeStart});
      }
      rangeStart = index + 1;
    }
  }
  return ranges;
}

// loaders.gl
// SPDX-License-Identifier: MIT
// Copyright vis.gl contributors

import type {NumericArray} from '@loaders.gl/loader-utils';
import type {GLTFLoaderOptions} from '../../gltf-loader';
import type {GLTFAccessor, GLTFMeshPrimitive} from '../types/gltf-json-schema';
import type {GLTFWithBuffers} from '../types/gltf-types';
import type {
  GLTF_EXT_mesh_polygon,
  GLTFMeshPolygonData,
  GLTFPolygon
} from '../types/gltf-vector-topology';
import {GLTFIterator} from '../api/gltf-iterator';
import {getPrimitiveRestartRanges} from './KHR_mesh_primitive_restart';

/** Draft polygon-topology extension name. */
export const name = 'EXT_mesh_polygon';

/** Resolve and validate polygon topology accessors. */
export async function decode(gltfData: GLTFWithBuffers, options: GLTFLoaderOptions): Promise<void> {
  if (!options.gltf?.loadBuffers) {
    return;
  }
  const iterator = new GLTFIterator(gltfData);
  for (const mesh of iterator.meshes) {
    for (const primitive of iterator.getReferences(mesh).primitives) {
      const extension = iterator.getExtension<GLTF_EXT_mesh_polygon>(primitive, name);
      if (extension) {
        Object.defineProperty(extension, 'data', {
          configurable: true,
          enumerable: false,
          writable: true,
          value: decodePolygonData(iterator, primitive, extension)
        });
      }
    }
  }
}

/** Resolve the accessors referenced by one polygon extension. */
function decodePolygonData(
  iterator: GLTFIterator,
  primitive: GLTFMeshPrimitive,
  extension: GLTF_EXT_mesh_polygon
): GLTFMeshPolygonData {
  if (!Number.isInteger(extension.count) || extension.count < 1) {
    throw new Error(`${name}: count must be a positive integer`);
  }
  if ((primitive.mode ?? 4) !== 4 || primitive.indices === undefined) {
    throw new Error(`${name}: primitive must use TRIANGLES mode with indices`);
  }

  const triangleIndices = getUnsignedScalarAccessor(iterator, primitive.indices, 'indices');
  const indicesOffsets = getUnsignedScalarAccessor(
    iterator,
    extension.indicesOffsets,
    'indicesOffsets',
    extension.count
  );
  const loopIndices = getUnsignedScalarAccessor(iterator, extension.loopIndices, 'loopIndices');
  const loopIndicesOffsets = getUnsignedScalarAccessor(
    iterator,
    extension.loopIndicesOffsets,
    'loopIndicesOffsets',
    extension.count
  );
  const loopAccessor = iterator.data.accessors?.[extension.loopIndices] as GLTFAccessor;
  const restartIndex = getUnsignedMaximum(loopAccessor.componentType);

  validateOffsets(indicesOffsets, triangleIndices.length, 'indicesOffsets');
  validateOffsets(loopIndicesOffsets, loopIndices.length, 'loopIndicesOffsets');

  const polygons: GLTFPolygon[] = [];
  for (let polygonIndex = 0; polygonIndex < extension.count; polygonIndex++) {
    const triangleStart = Number(indicesOffsets[polygonIndex]);
    const triangleEnd =
      polygonIndex + 1 < extension.count
        ? Number(indicesOffsets[polygonIndex + 1])
        : triangleIndices.length;
    const loopStart = Number(loopIndicesOffsets[polygonIndex]);
    const loopEnd =
      polygonIndex + 1 < extension.count
        ? Number(loopIndicesOffsets[polygonIndex + 1])
        : loopIndices.length;
    const polygonLoopIndices = Array.from(loopIndices).slice(loopStart, loopEnd);
    const loopRanges = getPrimitiveRestartRanges(polygonLoopIndices, restartIndex).map(range => ({
      offset: range.offset + loopStart,
      count: range.count
    }));
    if ((triangleEnd - triangleStart) % 3 !== 0) {
      throw new Error(
        `${name}: polygon ${polygonIndex} triangle range must contain complete triangles`
      );
    }
    if (loopRanges.length === 0) {
      throw new Error(`${name}: polygon ${polygonIndex} must contain at least one loop`);
    }
    if (loopRanges.some(range => range.count < 3)) {
      throw new Error(`${name}: polygon ${polygonIndex} loops must contain at least three indices`);
    }
    polygons.push({
      triangleRange: {offset: triangleStart, count: triangleEnd - triangleStart},
      loopRanges
    });
  }

  return {indicesOffsets, loopIndices, loopIndicesOffsets, polygons};
}

/** Resolve one unsigned scalar accessor with an optional expected count. */
function getUnsignedScalarAccessor(
  iterator: GLTFIterator,
  accessorIndex: number,
  label: string,
  expectedCount?: number
): NumericArray {
  if (!Number.isInteger(accessorIndex) || accessorIndex < 0) {
    throw new Error(`${name}: ${label} must reference an accessor`);
  }
  const accessor = iterator.data.accessors?.[accessorIndex];
  if (!accessor) {
    throw new Error(`${name}: ${label} references missing accessor ${accessorIndex}`);
  }
  if (accessor.type !== 'SCALAR' || ![5121, 5123, 5125].includes(accessor.componentType)) {
    throw new Error(`${name}: ${label} must be an unsigned integer SCALAR accessor`);
  }
  if (expectedCount !== undefined && accessor.count !== expectedCount) {
    throw new Error(`${name}: ${label} count must equal polygon count ${expectedCount}`);
  }
  return iterator.getTypedArrayForAccessor(accessorIndex) as NumericArray;
}

/** Validate monotonic offsets into an index accessor. */
function validateOffsets(offsets: NumericArray, targetLength: number, label: string): void {
  if (Number(offsets[0]) !== 0) {
    throw new Error(`${name}: ${label} must begin at zero`);
  }
  let previousOffset = -1;
  for (let index = 0; index < offsets.length; index++) {
    const offset = Number(offsets[index]);
    if (
      !Number.isInteger(offset) ||
      offset < 0 ||
      offset >= targetLength ||
      offset <= previousOffset
    ) {
      throw new Error(`${name}: ${label} must contain increasing in-bounds offsets`);
    }
    previousOffset = offset;
  }
}

/** Return the maximum value of an unsigned glTF accessor component type. */
function getUnsignedMaximum(componentType: number): number {
  switch (componentType) {
    case 5121:
      return 0xff;
    case 5123:
      return 0xffff;
    case 5125:
      return 0xffffffff;
    default:
      throw new Error(`${name}: unsupported loop index component type ${componentType}`);
  }
}

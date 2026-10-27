// loaders.gl
// SPDX-License-Identifier: MIT
// Copyright vis.gl contributors

import type {GLTF, GLTFMeshPrimitive} from '../types/gltf-json-schema';
import type {GLTFWithBuffers} from '../types/gltf-types';
import type {
  GLTF_EXT_primitive_voxels,
  GLTFVoxelPrimitive
} from '../types/gltf-ext-vector-voxel-schema';

/** Voxel primitive extension name. */
export const name = 'EXT_primitive_voxels';

/** Validates and preserves lazy voxel primitive declarations. */
export async function decode(gltfData: GLTFWithBuffers): Promise<void> {
  for (const [meshIndex, mesh] of (gltfData.json.meshes || []).entries()) {
    for (const [primitiveIndex, primitive] of mesh.primitives.entries()) {
      const extension = primitive.extensions?.[name] as GLTF_EXT_primitive_voxels | undefined;
      if (extension)
        validateVoxelPrimitive(gltfData.json, primitive, extension, meshIndex, primitiveIndex);
    }
  }
}

/** Returns normalized lazy voxel descriptors without allocating dense volumes. */
export function getVoxelPrimitives(gltf: GLTF | GLTFWithBuffers): GLTFVoxelPrimitive[] {
  const json: GLTF = 'json' in gltf ? (gltf as GLTFWithBuffers).json : (gltf as GLTF);
  const descriptors: GLTFVoxelPrimitive[] = [];
  for (const [meshIndex, mesh] of (json.meshes || []).entries()) {
    for (const [primitiveIndex, primitive] of mesh.primitives.entries()) {
      const extension = primitive.extensions?.[name] as GLTF_EXT_primitive_voxels | undefined;
      if (extension) {
        descriptors.push({
          meshIndex,
          primitiveIndex,
          attributes: {...primitive.attributes},
          extension
        });
      }
    }
  }
  return descriptors;
}

/** Validates shape, dimensions, mode, and accessor references for a lazy voxel primitive. */
function validateVoxelPrimitive(
  gltf: GLTF,
  primitive: GLTFMeshPrimitive,
  extension: GLTF_EXT_primitive_voxels,
  meshIndex: number,
  primitiveIndex: number
): void {
  if (!Number.isInteger(extension.shape) || extension.shape < 0) {
    throw new Error(
      `EXT_primitive_voxels: mesh ${meshIndex} primitive ${primitiveIndex} has invalid shape.`
    );
  }
  if (
    !Array.isArray(extension.dimensions) ||
    extension.dimensions.length !== 3 ||
    extension.dimensions.some(value => !Number.isInteger(value) || value <= 0)
  ) {
    throw new Error(
      `EXT_primitive_voxels: mesh ${meshIndex} primitive ${primitiveIndex} must provide three positive dimensions.`
    );
  }
  if (primitive.mode !== undefined && primitive.mode !== 2147483647) {
    throw new Error(
      `EXT_primitive_voxels: mesh ${meshIndex} primitive ${primitiveIndex} must use voxel mode.`
    );
  }
  for (const attributeName of Object.keys(primitive.attributes)) {
    const accessorIndex = primitive.attributes[attributeName];
    if (
      !Number.isInteger(accessorIndex) ||
      accessorIndex < 0 ||
      accessorIndex >= (gltf.accessors || []).length
    ) {
      throw new Error(
        `EXT_primitive_voxels: mesh ${meshIndex} primitive ${primitiveIndex} has invalid accessor ${attributeName}.`
      );
    }
  }
}

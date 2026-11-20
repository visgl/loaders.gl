// loaders.gl
// SPDX-License-Identifier: MIT
// Copyright (c) vis.gl contributors

import type {GLTFMeshPrimitive, GLTFWithBuffers} from '../types/gltf-types';
import {GLTFScenegraph} from './gltf-scenegraph';

/** Returns the authored outline's vertex-index pairs for a triangle primitive. */
export function getGLTFPrimitiveOutline(
  gltf: GLTFWithBuffers,
  primitive: GLTFMeshPrimitive
): Uint16Array | Uint32Array | undefined {
  /** The extension references a scalar accessor rather than a primitive attribute. */
  const outline = primitive.extensions?.CESIUM_primitive_outline as {indices?: number} | undefined;
  if (outline === undefined) return undefined;
  /** Identifier of the accessor containing consecutive edge endpoints. */
  const accessorIndex = outline?.indices;
  /** Accessor metadata constrains the decoded representation. */
  const accessor = accessorIndex === undefined ? undefined : gltf.json.accessors?.[accessorIndex];
  /** The outline indices are relative to the primitive's position accessor. */
  const vertexCount = gltf.json.accessors?.[primitive.attributes.POSITION]?.count;
  if (
    (primitive.mode ?? 4) !== 4 ||
    accessor?.type !== 'SCALAR' ||
    ![5123, 5125].includes(accessor.componentType) ||
    accessor.normalized ||
    accessor.count % 2 !== 0 ||
    vertexCount === undefined
  ) {
    throw new Error('Invalid CESIUM_primitive_outline accessor');
  }
  /** Decoded outline edges retain their original index width. */
  const indices = new GLTFScenegraph(gltf).getTypedArrayForAccessor(accessor);
  if (
    !(indices instanceof Uint16Array || indices instanceof Uint32Array) ||
    indices.length !== accessor.count ||
    indices.some(index => index >= vertexCount)
  ) {
    throw new Error('Invalid CESIUM_primitive_outline vertex index');
  }
  return indices;
}

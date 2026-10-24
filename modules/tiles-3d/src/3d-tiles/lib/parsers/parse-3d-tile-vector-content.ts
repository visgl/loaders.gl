// loaders.gl
// SPDX-License-Identifier: MIT
// Copyright vis.gl contributors

import {getGLTFAccessor} from '@loaders.gl/gltf';
import type {GLTFWithBuffers, GLTF_EXT_mesh_polygon} from '@loaders.gl/gltf';
import type {Tiles3DVectorContent, Tiles3DVectorPrimitive} from '../../types';

/**
 * Builds the common vector-content contract from a decoded glTF payload.
 *
 * Point and line-strip modes retain their ordinary glTF fallback representation. Polygon
 * descriptors are emitted only when `EXT_mesh_polygon` supplied complete decoded topology.
 *
 * @param gltf - glTF JSON and decoded buffers.
 * @param clip - Whether rendering should clip the content to its tile bounding volume.
 * @returns Vector topology descriptors in source mesh and primitive order.
 */
export function parse3DTileVectorContent(
  gltf: GLTFWithBuffers,
  clip: boolean
): Tiles3DVectorContent {
  const primitives: Tiles3DVectorPrimitive[] = [];

  for (let meshIndex = 0; meshIndex < (gltf.json.meshes || []).length; meshIndex++) {
    const mesh = gltf.json.meshes![meshIndex];
    for (let primitiveIndex = 0; primitiveIndex < mesh.primitives.length; primitiveIndex++) {
      const primitive = mesh.primitives[primitiveIndex];
      const descriptor = {meshIndex, primitiveIndex, primitive};
      if (primitive.mode === 0) {
        primitives.push({
          ...descriptor,
          type: 'points',
          pointCount:
            primitive.attributes.POSITION === undefined
              ? 0
              : getGLTFAccessor(gltf, primitive.attributes.POSITION).count
        });
        continue;
      }
      if (primitive.mode === 3) {
        const positionCount =
          primitive.attributes.POSITION === undefined
            ? 0
            : getGLTFAccessor(gltf, primitive.attributes.POSITION).count;
        const indexCount =
          primitive.indices === undefined
            ? positionCount
            : getGLTFAccessor(gltf, primitive.indices).count;
        primitives.push({
          ...descriptor,
          type: 'polylines',
          ranges: primitive.primitiveRestart?.ranges || [{offset: 0, count: indexCount}]
        });
        continue;
      }
      const polygonTopology = (
        primitive.extensions?.EXT_mesh_polygon as GLTF_EXT_mesh_polygon | undefined
      )?.data;
      if ((primitive.mode ?? 4) === 4 && polygonTopology) {
        primitives.push({...descriptor, type: 'polygons', topology: polygonTopology});
      }
    }
  }

  return {clip, primitives};
}

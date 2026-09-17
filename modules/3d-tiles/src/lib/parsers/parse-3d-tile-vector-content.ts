// loaders.gl
// SPDX-License-Identifier: MIT
// Copyright vis.gl contributors

import type {GLTFPostprocessed} from '@loaders.gl/gltf';
import type {Tiles3DVectorContent, Tiles3DVectorPrimitive} from '../../types';

/**
 * Builds the common vector-content contract from a decoded glTF payload.
 *
 * Point and line-strip modes retain their ordinary glTF fallback representation. Polygon
 * descriptors are emitted only when `EXT_mesh_polygon` supplied complete decoded topology.
 *
 * @param gltf - Postprocessed glTF content.
 * @param clip - Whether rendering should clip the content to its tile bounding volume.
 * @returns Vector topology descriptors in source mesh and primitive order.
 */
export function parse3DTileVectorContent(
  gltf: GLTFPostprocessed,
  clip: boolean
): Tiles3DVectorContent {
  const primitives: Tiles3DVectorPrimitive[] = [];

  for (let meshIndex = 0; meshIndex < gltf.meshes.length; meshIndex++) {
    const mesh = gltf.meshes[meshIndex];
    for (let primitiveIndex = 0; primitiveIndex < mesh.primitives.length; primitiveIndex++) {
      const primitive = mesh.primitives[primitiveIndex];
      const descriptor = {meshIndex, primitiveIndex, primitive};
      if (primitive.mode === 0) {
        primitives.push({
          ...descriptor,
          type: 'points',
          pointCount: primitive.attributes.POSITION?.count || 0
        });
        continue;
      }
      if (primitive.mode === 3) {
        const indexCount = primitive.indices?.count || primitive.attributes.POSITION?.count || 0;
        primitives.push({
          ...descriptor,
          type: 'polylines',
          ranges: primitive.primitiveRestart?.ranges || [{offset: 0, count: indexCount}]
        });
        continue;
      }
      const polygonTopology = primitive.extensions?.EXT_mesh_polygon?.data;
      if ((primitive.mode ?? 4) === 4 && polygonTopology) {
        primitives.push({...descriptor, type: 'polygons', topology: polygonTopology});
      }
    }
  }

  return {clip, primitives};
}

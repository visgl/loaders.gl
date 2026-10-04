// loaders.gl
// SPDX-License-Identifier: MIT
// Copyright (c) vis.gl contributors

import type {GLTFWithBuffers} from '../types/gltf-types';
import {readGLTFV1AccessorComponent, type GLTFV1AccessorReader} from './repack-gltf-v1-accessors';

/** Validate vertex counts and indices against every primitive consuming an accessor. */
export function validateGLTFV1Geometry(
  gltf: GLTFWithBuffers,
  readAccessor: GLTFV1AccessorReader,
  reportUnsupported: (feature: string) => void
): void {
  const maximumIndices = new Map<number, number>();
  for (const [meshIndex, mesh] of (gltf.json.meshes || []).entries())
    for (const [primitiveIndex, primitive] of mesh.primitives.entries()) {
      const label = `mesh ${meshIndex} primitive ${primitiveIndex}`;
      const counts = Object.values(primitive.attributes).map(accessorIndex => {
        const accessor = Number.isSafeInteger(accessorIndex)
          ? gltf.json.accessors?.[accessorIndex]
          : undefined;
        return accessor?.count;
      });
      if (
        !counts.length ||
        counts.some(count => !Number.isSafeInteger(count) || (count as number) < 1)
      ) {
        reportUnsupported(`${label} requires valid vertex attribute accessors`);
        continue;
      }
      if (counts.some(count => count !== counts[0]))
        reportUnsupported(`${label} vertex attribute counts do not match`);
      if (primitive.indices === undefined) continue;
      const source = readAccessor(primitive.indices, `${label} indices`);
      if (!source) continue;
      if (
        source.accessor.type !== 'SCALAR' ||
        ![5121, 5123, 5125].includes(source.accessor.componentType) ||
        source.accessor.normalized
      ) {
        reportUnsupported(`${label} indices require unnormalized unsigned SCALAR data`);
        continue;
      }
      let maximum = maximumIndices.get(primitive.indices);
      if (maximum === undefined) {
        maximum = 0;
        for (let elementIndex = 0; elementIndex < source.accessor.count; elementIndex++)
          maximum = Math.max(maximum, readGLTFV1AccessorComponent(source, elementIndex, 0));
        maximumIndices.set(primitive.indices, maximum);
      }
      if (counts.some(count => maximum! >= (count as number)))
        reportUnsupported(`${label} index ${maximum} is outside its vertex attribute counts`);
    }
}

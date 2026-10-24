// loaders.gl
// SPDX-License-Identifier: MIT
// Copyright (c) vis.gl contributors

import {getGLTFAccessor, getGLTFAccessorValue, type GLTFWithBuffers} from '@loaders.gl/gltf';

/** Read the first primitive's attributes for explicit builder input. */
export function getMeshAttributes(gltf: GLTFWithBuffers) {
  return Object.fromEntries(
    Object.entries(gltf.json.meshes![0].primitives[0].attributes).map(([semantic, reference]) => {
      const accessor = getGLTFAccessor(gltf, reference);
      return [
        semantic,
        {
          ...accessor,
          value: getGLTFAccessorValue(gltf, reference),
          size:
            accessor.type === 'VEC2'
              ? 2
              : accessor.type === 'VEC3'
                ? 3
                : accessor.type === 'VEC4'
                  ? 4
                  : 1
        }
      ];
    })
  );
}

// loaders.gl
// SPDX-License-Identifier: MIT
// Copyright (c) vis.gl contributors

import {loadPBREnvironment} from '@luma.gl/gltf';

const GLTF_ENV_BASE_URL =
  'https://raw.githubusercontent.com/visgl/deck.gl-data/master/luma.gl/examples/gltf/';

const CUBE_FACE_TO_DIRECTION = ['right', 'left', 'top', 'bottom', 'front', 'back'];

/** Load the precomputed lighting textures for the provided device. */
export default function loadIBLEnvironment(device) {
  return loadPBREnvironment(device, {
    brdfLutUrl: `${GLTF_ENV_BASE_URL}/brdfLUT.png`,
    specularMipLevels: 6,
    getTexUrl: (type, dir, mipLevel) =>
      `${GLTF_ENV_BASE_URL}/papermill/${type}/${type}_${CUBE_FACE_TO_DIRECTION[dir]}_${mipLevel}.jpg`
  });
}

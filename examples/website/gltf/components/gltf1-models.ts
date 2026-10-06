// loaders.gl
// SPDX-License-Identifier: MIT
// Copyright (c) vis.gl contributors

/** Original, embedded glTF 1 assets shared by the example and offline conversion tests. */
export const GLTF1_MODELS = [
  {
    name: 'Box (glTF 1)',
    url: new URL('../../../../modules/gltf/test/data/gltf-1.0/Box.gltf', import.meta.url).href
  },
  {
    name: 'Box Animated (glTF 1)',
    url: new URL('../../../../modules/gltf/test/data/gltf-1.0/BoxAnimated.gltf', import.meta.url)
      .href
  }
];

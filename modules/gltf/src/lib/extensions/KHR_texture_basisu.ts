// loaders.gl
// SPDX-License-Identifier: MIT
// Copyright (c) vis.gl contributors

// GLTF EXTENSION: KHR_texture_basisu
// https://github.com/KhronosGroup/glTF/tree/main/extensions/2.0/Khronos/KHR_texture_basisu
/* eslint-disable camelcase */

import type {GLTF_KHR_texture_basisu} from '../types/gltf-json-schema';
import type {GLTFWithBuffers} from '../types/gltf-types';
import type {GLTFLoaderOptions} from '../../gltf-loader';

import {GLTFIterator} from '../api/gltf-iterator';

const KHR_TEXTURE_BASISU = 'KHR_texture_basisu';

/** Extension name */
export const name = KHR_TEXTURE_BASISU;

/**
 * Replaces a texture source reference with the extension texture
 * Done in preprocess() to prevent load of default image
 */
export function preprocess(gltfData: GLTFWithBuffers, options: GLTFLoaderOptions): void {
  void options;
  const iterator = new GLTFIterator(gltfData);

  for (const texture of iterator.textures) {
    const extension = iterator.getExtension<GLTF_KHR_texture_basisu>(texture, KHR_TEXTURE_BASISU);
    if (extension) {
      // TODO - if multiple texture extensions are present which one wins?
      texture.source = extension.source;
      iterator.removeExtension(texture, KHR_TEXTURE_BASISU);
    }
  }

  // Remove the top-level extension
  iterator.removeExtension(KHR_TEXTURE_BASISU);
}

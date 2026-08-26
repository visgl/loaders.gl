// loaders.gl
// SPDX-License-Identifier: MIT
// Copyright (c) vis.gl contributors

// GLTF EXTENSION: EXT_TEXTURE_WEBP
// https://github.com/KhronosGroup/glTF/tree/master/extensions/2.0/Khronos/EXT_TEXTURE_WEBP
/* eslint-disable camelcase */

import type {GLTF_EXT_texture_webp} from '../types/gltf-json-schema';
import type {GLTFWithBuffers} from '../types/gltf-types';
import type {GLTFLoaderOptions} from '../../gltf-loader';

import {isImageFormatSupported} from '@loaders.gl/images';
import {GLTFIterator} from '../api/gltf-iterator';

const EXT_TEXTURE_WEBP = 'EXT_texture_webp';

/** Extension name */
export const name = EXT_TEXTURE_WEBP;

/**
 * Replaces a texture source reference with the extension texture
 * Done in preprocess() to prevent load of default image
 */
export function preprocess(gltfData: GLTFWithBuffers, options: GLTFLoaderOptions): void {
  const iterator = new GLTFIterator(gltfData);

  if (!isImageFormatSupported('image/webp')) {
    if (iterator.isExtensionRequired(EXT_TEXTURE_WEBP)) {
      throw new Error(`gltf: Required extension ${EXT_TEXTURE_WEBP} not supported by browser`);
    }
    return;
  }

  for (const texture of iterator.textures) {
    const extension = iterator.getExtension<GLTF_EXT_texture_webp>(texture, EXT_TEXTURE_WEBP);
    if (extension) {
      // TODO - if multiple texture extensions are present which one wins?
      texture.source = extension.source;
    }
    iterator.removeExtension(texture, EXT_TEXTURE_WEBP);
  }

  // Remove the top-level extension
  iterator.removeExtension(EXT_TEXTURE_WEBP);
}

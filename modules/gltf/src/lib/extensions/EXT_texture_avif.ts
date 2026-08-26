// loaders.gl
// SPDX-License-Identifier: MIT
// Copyright (c) vis.gl contributors

// GLTF EXTENSION: EXT_TEXTURE_AVIF
// https://github.com/KhronosGroup/glTF/tree/main/extensions/2.0/Vendor/EXT_texture_avif
/* eslint-disable camelcase */

import type {GLTF_EXT_texture_avif} from '../types/gltf-json-schema';
import type {GLTFWithBuffers} from '../types/gltf-types';
import type {GLTFLoaderOptions} from '../../gltf-loader';

import {getSupportedImageFormats} from '@loaders.gl/images';
import {GLTFIterator} from '../api/gltf-iterator';

const EXT_TEXTURE_AVIF = 'EXT_texture_avif';

/** Extension name. */
export const name = EXT_TEXTURE_AVIF;

/**
 * Selects AVIF image sources when the active image decoder supports AVIF.
 *
 * Optional AVIF sources retain their ordinary texture source when unsupported. Required AVIF
 * sources fail before image loading so callers never receive a texture with an invalid source.
 *
 * @param gltfData Parsed glTF JSON whose texture sources may be updated in place.
 * @param options glTF loader options. The extension currently has no custom options.
 */
export async function preprocess(
  gltfData: GLTFWithBuffers,
  options: GLTFLoaderOptions
): Promise<void> {
  void options;
  const iterator = new GLTFIterator(gltfData);

  const supportedImageFormats = await getSupportedImageFormats();
  if (!supportedImageFormats.has('image/avif')) {
    if (iterator.isExtensionRequired(EXT_TEXTURE_AVIF)) {
      throw new Error(`gltf: Required extension ${EXT_TEXTURE_AVIF} not supported by browser`);
    }
    return;
  }

  for (const texture of iterator.textures) {
    const extension = texture.getExtension<GLTF_EXT_texture_avif>(EXT_TEXTURE_AVIF);
    if (extension) {
      texture.data.source = extension.source;
    }
    texture.removeExtension(EXT_TEXTURE_AVIF);
  }

  iterator.removeExtension(EXT_TEXTURE_AVIF);
}

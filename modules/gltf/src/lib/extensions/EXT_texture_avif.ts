// loaders.gl
// SPDX-License-Identifier: MIT
// Copyright (c) vis.gl contributors

// GLTF EXTENSION: EXT_TEXTURE_AVIF
// https://github.com/KhronosGroup/glTF/tree/main/extensions/2.0/Vendor/EXT_texture_avif
/* eslint-disable camelcase */

import type {GLTF, GLTF_EXT_texture_avif} from '../types/gltf-json-schema';
import type {GLTFLoaderOptions} from '../../gltf-loader';

import {isImageFormatSupported} from '@loaders.gl/images';
import {GLTFScenegraph} from '../api/gltf-scenegraph';

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
export function preprocess(gltfData: {json: GLTF}, options: GLTFLoaderOptions): void {
  void options;
  const scenegraph = new GLTFScenegraph(gltfData);

  if (!isImageFormatSupported('image/avif')) {
    if (scenegraph.getRequiredExtensions().includes(EXT_TEXTURE_AVIF)) {
      throw new Error(`gltf: Required extension ${EXT_TEXTURE_AVIF} not supported by browser`);
    }
    return;
  }

  const {json} = scenegraph;
  for (const texture of json.textures || []) {
    const extension = scenegraph.getObjectExtension<GLTF_EXT_texture_avif>(
      texture,
      EXT_TEXTURE_AVIF
    );
    if (extension) {
      texture.source = extension.source;
    }
    scenegraph.removeObjectExtension(texture, EXT_TEXTURE_AVIF);
  }

  scenegraph.removeExtension(EXT_TEXTURE_AVIF);
}

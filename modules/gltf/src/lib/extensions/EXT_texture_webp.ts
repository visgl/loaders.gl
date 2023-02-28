// GLTF EXTENSION: EXT_TEXTURE_WEBP
// https://github.com/KhronosGroup/glTF/tree/master/extensions/2.0/Khronos/EXT_TEXTURE_WEBP
/* eslint-disable camelcase */

import type {GLTF, GLTF_EXT_texture_webp} from '../types/gltf-types';
import type {GLTFLoaderOptions} from '../../gltf-loader';

import {isImageFormatSupported} from '@loaders.gl/images';
import GLTFScenegraph from '../api/gltf-scenegraph';

const EXT_TEXTURE_WEBP = 'EXT_texture_webp';

/** Extension name */
export const name = EXT_TEXTURE_WEBP;

/**
 * Replaces a texture source reference with the extension texture
 * Done in preprocess() to prevent load of default image
 */
export function preprocess(gltfData: {json: GLTF}, options: GLTFLoaderOptions): void {
  const scenegraph = new GLTFScenegraph(gltfData);

  if (!isImageFormatSupported('image/webp')) {
    if (scenegraph.getRequiredExtensions().includes(EXT_TEXTURE_WEBP)) {
      throw new Error(`gltf: Required extension ${EXT_TEXTURE_WEBP} not supported by browser`);
    }
    return;
  }

  const {json} = scenegraph;

  for (const texture of json.textures || []) {
    const extension = scenegraph.getObjectExtension<GLTF_EXT_texture_webp>(
      texture,
      EXT_TEXTURE_WEBP
    );
    if (extension) {
      // TODO - if multiple texture extensions are present which one wins?
      texture.source = extension.source;
    }
    scenegraph.removeObjectExtension(texture, EXT_TEXTURE_WEBP);
  }

  // Remove the top-level extension
  scenegraph.removeExtension(EXT_TEXTURE_WEBP);
}

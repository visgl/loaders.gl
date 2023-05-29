// GLTF EXTENSION: KHR_texture_basisu
// https://github.com/KhronosGroup/glTF/tree/main/extensions/2.0/Khronos/KHR_texture_basisu
/* eslint-disable camelcase */

import type {GLTF, GLTF_KHR_texture_basisu} from '../types/gltf-json-schema';
import type {GLTFLoaderOptions} from '../../gltf-loader';

import {GLTFScenegraph} from '../api/gltf-scenegraph';

const KHR_TEXTURE_BASISU = 'KHR_texture_basisu';

/** Extension name */
export const name = KHR_TEXTURE_BASISU;

/**
 * Replaces a texture source reference with the extension texture
 * Done in preprocess() to prevent load of default image
 */
export function preprocess(gltfData: {json: GLTF}, options: GLTFLoaderOptions): void {
  const scene = new GLTFScenegraph(gltfData);
  const {json} = scene;

  for (const texture of json.textures || []) {
    const extension = scene.getObjectExtension<GLTF_KHR_texture_basisu>(
      texture,
      KHR_TEXTURE_BASISU
    );
    if (extension) {
      // TODO - if multiple texture extensions are present which one wins?
      texture.source = extension.source;
      scene.removeObjectExtension(texture, KHR_TEXTURE_BASISU);
    }
  }

  // Remove the top-level extension
  scene.removeExtension(KHR_TEXTURE_BASISU);
}

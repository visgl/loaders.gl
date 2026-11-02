// loaders.gl
// SPDX-License-Identifier: MIT
// Copyright (c) vis.gl contributors

import type {GLTFLoaderOptions} from '../../gltf-loader-types';
import type {GLTFWithBuffers} from '../types/gltf-types';
import type {GLTF_MSFT_texture_dds} from '../types/gltf-json-schema';
import {GLTFIterator} from '../api/gltf-iterator';

/** Name of the Microsoft DDS texture extension. */
export const name = 'MSFT_texture_dds';

/** Select DDS sources only when an application supplies a compatible parser. */
export function preprocess(gltf: GLTFWithBuffers, options: GLTFLoaderOptions): void {
  const iterator = new GLTFIterator(gltf);
  if (!iterator.hasExtension(name)) return;
  if (!options.gltf?.ddsParser) {
    if (iterator.isExtensionRequired(name)) {
      throw new Error('gltf: Required extension MSFT_texture_dds needs a DDS parser');
    }
    return;
  }
  for (const texture of iterator.textures) {
    const extension = iterator.getExtension<GLTF_MSFT_texture_dds>(texture, name);
    if (extension) texture.source = extension.source;
  }
}

/** Remove DDS declarations only after image loading can identify the selected sources. */
export async function decode(gltf: GLTFWithBuffers, options: GLTFLoaderOptions): Promise<void> {
  if (!options.gltf?.ddsParser || options.gltf.loadImages === false) return;
  const iterator = new GLTFIterator(gltf);
  if (!iterator.hasExtension(name)) return;
  for (const texture of iterator.textures) iterator.removeExtension(texture, name);
  iterator.removeExtension(name);
}
